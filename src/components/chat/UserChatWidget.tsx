import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, ShieldCheck } from "lucide-react";
import { chatApi, type ChatMessage } from "../../services/api";
import { getSocket } from "../../services/socket";
import {
  decryptChatMessage,
  encryptChatMessage,
  getOrCreateChatKeyPair,
  trustPeerKey,
} from "../../services/chatEncryption";
import toast from "react-hot-toast";
import { OPEN_SUPPORT_CHAT_EVENT } from "./supportChatEvents";

type DisplayChatMessage = ChatMessage & { displayText: string };

export default function UserChatWidget() {
  const token = localStorage.getItem("gaming_token");
  const role = (localStorage.getItem("gaming_user_role") || "user").toLowerCase();

  if (!token || role === "admin" || role === "manager" || role === "staff") {
    return null;
  }

  return <AuthenticatedUserChatWidget key={`${token}:${role}`} />;
}

function AuthenticatedUserChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatStatus, setChatStatus] = useState("Preparing encrypted chat...");
  const [isChatReady, setIsChatReady] = useState(false);
  const [setupAttempt, setSetupAttempt] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userIdRef = useRef("");
  const privateKeyRef = useRef<CryptoKey | null>(null);
  const publicKeyRef = useRef<CryptoKey | null>(null);
  const recipientKeyRef = useRef<CryptoKey | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!isOpen) return;

    const initializeChat = async () => {
      try {
        const identityResponse = await chatApi.getIdentity();
        const identity = identityResponse.data;
        if (identity.role !== "user") {
          throw new Error("This secure support chat is only available to customer accounts.");
        }

        const keys = await getOrCreateChatKeyPair(identity.userId, identity.publicKey);
        if (!identity.publicKey) {
          await chatApi.registerPublicKey(keys.publicJwk);
        }

        await chatApi.createRoom();
        const refreshedIdentity = await chatApi.getIdentity();
        const recipient = refreshedIdentity.data.recipient;
        if (!recipient) {
          if (isMounted) {
            setChatStatus("An admin needs to set up encrypted chat before you can start.");
          }
          return;
        }

        const recipientKey = await trustPeerKey(identity.userId, recipient.userId, recipient.publicKey);
        userIdRef.current = identity.userId;
        privateKeyRef.current = keys.privateKey;
        publicKeyRef.current = keys.publicKey;
        recipientKeyRef.current = recipientKey;

        const history = await chatApi.getMessages("me");
        const decryptedMessages = await Promise.all(
          history.data.map(async (message) => ({
            ...message,
            displayText: await decryptChatMessage(message, keys.privateKey, "user", identity.userId),
          }))
        );

        if (isMounted) {
          setMessages(decryptedMessages);
          setIsChatReady(true);
          setChatStatus("End-to-end encrypted");
          getSocket()?.emit("mark_as_read", "me");
        }
      } catch (error) {
        console.error("Secure chat setup failed:", error);
        if (isMounted) {
          setChatStatus(error instanceof Error ? error.message : "Could not set up encrypted chat.");
          toast.error("Secure chat could not be initialized.");
        }
      }
    };

    void initializeChat();

    return () => {
      isMounted = false;
    };
  }, [isOpen, setupAttempt]);

  const openChat = () => {
    setIsOpen(true);
    setChatStatus("Creating your private support room...");
    setSetupAttempt((attempt) => attempt + 1);
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = async (msg: ChatMessage) => {
      const privateKey = privateKeyRef.current;
      const userId = userIdRef.current;
      if (!isChatReady || !privateKey || !userId) return;
      try {
        const displayMessage = {
          ...msg,
          displayText: await decryptChatMessage(msg, privateKey, "user", userId),
        };
        setMessages((prev) =>
          prev.some((existing) => existing._id === msg._id)
            ? prev
            : [...prev, displayMessage]
        );
        if (!isOpen && msg.senderRole !== "user") {
          setUnreadCount((count) => count + 1);
        }
      } catch (error) {
        console.error("Could not decrypt incoming support message:", error);
        toast.error("A support message could not be decrypted on this device.");
      }
    };

    socket.on("new_message", handleNewMessage);

    const handleOpenEvent = () => {
      openChat();
      setUnreadCount(0);
    };
    window.addEventListener(OPEN_SUPPORT_CHAT_EVENT, handleOpenEvent);

    return () => {
      socket.off("new_message", handleNewMessage);
      window.removeEventListener(OPEN_SUPPORT_CHAT_EVENT, handleOpenEvent);
    };
  }, [isOpen, isChatReady]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending || !isChatReady) return;

    const textToSend = input.trim();
    const socket = getSocket();
    if (!socket?.connected) {
      toast.error("Support chat is unavailable right now. Please try again.");
      return;
    }

    const ownPublicKey = publicKeyRef.current;
    const privateKey = privateKeyRef.current;
    const recipientKey = recipientKeyRef.current;
    const userId = userIdRef.current;
    if (!ownPublicKey || !privateKey || !recipientKey || !userId) {
      toast.error("Encrypted chat is not ready on this device.");
      return;
    }

    setSending(true);
    try {
      const encryptedPayload = await encryptChatMessage(
        textToSend,
        ownPublicKey,
        recipientKey,
        userId
      );
      socket.emit("send_message", { encryptedPayload }, async (res: {
        success: boolean;
        message?: ChatMessage;
        error?: string;
      }) => {
        setSending(false);
        if (!res.success || !res.message) {
          toast.error(res.error || "Could not send your message.");
          return;
        }
        try {
          const sentMessage = {
            ...res.message,
            displayText: await decryptChatMessage(
              res.message,
              privateKey,
              "user",
              userId
            ),
          };
          setInput("");
          setMessages((prev) =>
            prev.some((message) => message._id === sentMessage._id)
              ? prev
              : [...prev, sentMessage]
          );
        } catch (error) {
          console.error("Could not decrypt sent support message:", error);
          toast.error("Message was sent, but could not be decrypted on this device.");
        }
      });
    } catch (error) {
      setSending(false);
      console.error("Could not encrypt support message:", error);
      toast.error("Could not encrypt your message.");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => {
            openChat();
            setUnreadCount(0);
          }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_25px_rgba(124,58,237,0.8)] transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
          title="Chat with Support"
        >
          <MessageSquare size={26} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="flex h-[480px] w-[350px] sm:w-[380px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#16161e] shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3.5 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold">GameZone Support</h3>
                <p className="flex items-center gap-1.5 text-xs text-white/80">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  {chatStatus}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {!isChatReady && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-100">
                <p>{chatStatus}</p>
                {chatStatus.startsWith("An admin needs") && (
                  <span className="mt-2 block">Please ask an admin to open the support Chat page once.</span>
                )}
              </div>
            )}
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                <MessageSquare size={36} className="mb-2 opacity-30" />
                <p className="font-medium">Have a question or need help?</p>
                <p className="text-xs text-slate-500">Send a message to chat with admin.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderRole === "user";
                return (
                  <div
                    key={m._id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <span className="mb-1 text-[10px] text-slate-400">
                      {isMe ? "You" : m.senderName || "Admin Support"}
                    </span>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                        isMe
                          ? "rounded-br-none bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                          : "rounded-bl-none border border-white/10 bg-[#1f2335] text-slate-100"
                      }`}
                    >
                      {!m.encryptedPayload && (
                        <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-amber-300">
                          Legacy message · not encrypted
                        </span>
                      )}
                      {m.displayText}
                    </div>
                    <span className="mt-1 text-[9px] text-slate-500">
                      {m.createdAt
                        ? new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input box */}
          <form onSubmit={handleSend} className="border-t border-white/10 bg-[#12121a] p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-xl border border-white/10 bg-[#1f2335] px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
              <button
                type="submit"
                disabled={sending || !input.trim() || !isChatReady}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500 disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
