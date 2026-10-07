import type { ChatMessage, ChatPublicKey } from "./api";

export interface EncryptedChatPayload {
  version: 1;
  iv: string;
  ciphertext: string;
  senderKey: string;
  recipientKey: string;
}

const DATABASE_NAME = "gaming-chat-keys";
const DATABASE_VERSION = 1;
const KEY_STORE = "identity-keys";
const PEER_STORE = "trusted-peer-keys";

function openKeyDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(KEY_STORE)) {
        database.createObjectStore(KEY_STORE);
      }
      if (!database.objectStoreNames.contains(PEER_STORE)) {
        database.createObjectStore(PEER_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open encrypted chat key storage"));
  });
}

function readStoredValue<T>(storeName: string, key: string): Promise<T | undefined> {
  return openKeyDatabase().then(
    (database) =>
      new Promise<T | undefined>((resolve, reject) => {
        const transaction = database.transaction(storeName, "readonly");
        const request = transaction.objectStore(storeName).get(key);
        request.onsuccess = () => resolve(request.result as T | undefined);
        request.onerror = () => reject(request.error ?? new Error("Could not read encrypted chat key storage"));
        transaction.oncomplete = () => database.close();
      })
  );
}

function addStoredValue(storeName: string, key: string, value: unknown): Promise<void> {
  return openKeyDatabase().then(
    (database) =>
      new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(storeName, "readwrite");
        transaction.objectStore(storeName).add(value, key);
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => {
          database.close();
          reject(transaction.error ?? new Error("Could not save encrypted chat key"));
        };
        transaction.onabort = () => {
          database.close();
          reject(transaction.error ?? new Error("Could not save encrypted chat key"));
        };
      })
  );
}

function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of array) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): ArrayBuffer {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function samePublicKey(left: JsonWebKey, right: JsonWebKey): boolean {
  return left.kty === right.kty && left.n === right.n && left.e === right.e;
}

interface StoredChatKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  publicJwk: ChatPublicKey;
}

export async function getOrCreateChatKeyPair(
  userId: string,
  registeredPublicKey: ChatPublicKey | null
): Promise<StoredChatKeyPair> {
  const stored = await readStoredValue<StoredChatKeyPair>(KEY_STORE, userId);
  if (stored) {
    if (registeredPublicKey && !samePublicKey(stored.publicJwk, registeredPublicKey)) {
      throw new Error("This device's chat key does not match the registered key. Chat access has been stopped to protect your messages.");
    }
    return stored;
  }

  if (registeredPublicKey) {
    throw new Error("This account already has a chat key, but its private key is missing from this device. Existing encrypted messages cannot be recovered.");
  }

  const generated = (await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  )) as CryptoKeyPair;
  const publicJwk = (await crypto.subtle.exportKey("jwk", generated.publicKey)) as ChatPublicKey;
  const privatePkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", generated.privateKey));
  const nonExtractablePrivateKey = await crypto.subtle.importKey(
    "pkcs8",
    privatePkcs8,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"]
  );
  privatePkcs8.fill(0);

  const newKeys: StoredChatKeyPair = {
    publicKey: generated.publicKey,
    privateKey: nonExtractablePrivateKey,
    publicJwk,
  };

  try {
    await addStoredValue(KEY_STORE, userId, newKeys);
    return newKeys;
  } catch (error) {
    const concurrentKeys = await readStoredValue<StoredChatKeyPair>(KEY_STORE, userId);
    if (concurrentKeys) {
      if (registeredPublicKey && !samePublicKey(concurrentKeys.publicJwk, registeredPublicKey)) {
        throw new Error("Another chat key was created for this account. Reload the page to verify the registered key.");
      }
      return concurrentKeys;
    }
    throw error;
  }
}

export async function trustPeerKey(
  localUserId: string,
  peerUserId: string,
  publicJwk: ChatPublicKey
): Promise<CryptoKey> {
  const keyId = `${localUserId}:${peerUserId}`;
  const existing = await readStoredValue<ChatPublicKey>(PEER_STORE, keyId);
  if (existing && !samePublicKey(existing, publicJwk)) {
    throw new Error("The other participant's encryption key has changed. Messages are blocked until the key is verified.");
  }
  if (!existing) {
    try {
      await addStoredValue(PEER_STORE, keyId, publicJwk);
    } catch (error) {
      const racedKey = await readStoredValue<ChatPublicKey>(PEER_STORE, keyId);
      if (!racedKey || !samePublicKey(racedKey, publicJwk)) throw error;
    }
  }
  return crypto.subtle.importKey(
    "jwk",
    publicJwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
}

export async function encryptChatMessage(
  text: string,
  senderPublicKey: CryptoKey,
  recipientPublicKey: CryptoKey,
  conversationId: string
): Promise<EncryptedChatPayload> {
  const contentKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: new TextEncoder().encode(conversationId),
    },
    contentKey,
    new TextEncoder().encode(text)
  );
  const rawContentKey = await crypto.subtle.exportKey("raw", contentKey);
  const [senderKey, recipientKey] = await Promise.all([
    crypto.subtle.encrypt({ name: "RSA-OAEP" }, senderPublicKey, rawContentKey),
    crypto.subtle.encrypt({ name: "RSA-OAEP" }, recipientPublicKey, rawContentKey),
  ]);

  return {
    version: 1,
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
    senderKey: toBase64(senderKey),
    recipientKey: toBase64(recipientKey),
  };
}

export async function decryptChatMessage(
  message: ChatMessage,
  privateKey: CryptoKey,
  localRole: "admin" | "user",
  conversationId: string
): Promise<string> {
  if (!message.encryptedPayload) return message.text;
  const envelope =
    message.senderRole === localRole
      ? message.encryptedPayload.senderKey
      : message.encryptedPayload.recipientKey;
  const rawContentKey = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    fromBase64(envelope)
  );
  const contentKey = await crypto.subtle.importKey(
    "raw",
    rawContentKey,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: fromBase64(message.encryptedPayload.iv),
      additionalData: new TextEncoder().encode(conversationId),
    },
    contentKey,
    fromBase64(message.encryptedPayload.ciphertext)
  );
  return new TextDecoder().decode(plaintext);
}
