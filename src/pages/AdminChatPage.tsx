import { useState, useEffect, useRef, useCallback } from "react";
import { Send, MessageSquare, Search } from "lucide-react";
import { chatApi, type ChatMessage, type AdminConversation } from "../services/api";
import { getSocket } from "../services/socket";
import {
  decryptChatMessage,
  encryptChatMessage,
  getOrCreateChatKeyPair,
  trustPeerKey,
} from "../services/chatEncryption";
import toast from "react-hot-toast";

type DisplayChatMessage = ChatMessage & { displayText: string };

const appendUniqueMessage = (
  messages: DisplayChatMessage[],
  message: DisplayChatMessage
): DisplayChatMessage[] =>
  messages.some((existing) => existing._id === message._id)
    ? messages
    : [...messages, message];

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminConversation["user"] | null>(null);
  const [messages, setMessages] = useState<DisplayChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConv, setLoadingConv] = useState(true);
  const [chatStatus, setChatStatus] = useState("Preparing encrypted chat...");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedUserRef = useRef<AdminConversation["user"] | null>(null);
  const adminIdRef = useRef("");
  const privateKeyRef = useRef<CryptoKey | null>(null);
  const publicKeyRef = useRef<CryptoKey | null>(null);
  const peerKeyRef = useRef<CryptoKey | null>(null);

  const loadConversations = useCallback(() => {
    chatApi
      .getConversations()
      .then((res) => {
        if (res.data) {
          setConversations(res.data);
          const currentSelectedUser = selectedUserRef.current;
          const updatedSelectedUser = currentSelectedUser
            ? res.data.find(
                (conversation) => conversation.user._id === currentSelectedUser._id
              )?.user
            : null;
          if (
            updatedSelectedUser &&
            updatedSelectedUser.chatPublicKey?.n !== currentSelectedUser?.chatPublicKey?.n
          ) {
            selectedUserRef.current = updatedSelectedUser;
            setSelectedUser(updatedSelectedUser);
          }
          if (!selectedUserRef.current && res.data.length > 0) {
            selectedUserRef.current = res.data[0].user;
            setSelectedUser(res.data[0].user);
          }
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to load encrypted conversations:", error);
        toast.error("Could not load encrypted conversations.");
      })
      .finally(() => setLoadingConv(false));
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initializeChat = async () => {
      try {
        const identityResponse = await chatApi.getIdentity();
        const identity = identityResponse.data;
        if (identity.role !== "admin") {
          throw new Error("Only the assigned admin account can access encrypted support chats.");
        }

        const keys = await getOrCreateChatKeyPair(identity.userId, identity.publicKey);
        if (!identity.publicKey) {
          await chatApi.registerPublicKey(keys.publicJwk);
        }
        adminIdRef.current = identity.userId;
        privateKeyRef.current = keys.privateKey;
        publicKeyRef.current = keys.publicKey;
        if (isMounted) {
          setChatStatus("End-to-end encrypted");
          loadConversations();
        }
      } catch (error) {
        console.error("Secure admin chat setup failed:", error);
        if (isMounted) {
          setChatStatus(error instanceof Error ? error.message : "Could not set up encrypted chat.");
          setLoadingConv(false);
        }
        toast.error("Secure chat could not be initialized.");
      }
    };
    void initializeChat();

    return () => {
      isMounted = false;
    };
  }, [loadConversations]);

  // Socket listener for new messages
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleAdminNewMessage = async (msg: ChatMessage) => {
      if (selectedUser && (msg.conversationWith === selectedUser._id || msg.sender === selectedUser._id)) {
        const privateKey = privateKeyRef.current;
        const adminId = adminIdRef.current;
        if (privateKey && adminId) {
          try {
            const displayMessage = {
              ...msg,
              displayText: await decryptChatMessage(msg, privateKey, "admin", selectedUser._id),
            };
            setMessages((prev) => appendUniqueMessage(prev, displayMessage));
          } catch (error) {
            console.error("Could not decrypt incoming user message:", error);
            toast.error("A message could not be decrypted on this device.");
          }
        }
      }
      loadConversations();
    };

    socket.on("admin_new_message", handleAdminNewMessage);
    socket.on("admin_new_room", loadConversations);

    return () => {
      socket.off("admin_new_message", handleAdminNewMessage);
      socket.off("admin_new_room", loadConversations);
    };
  }, [selectedUser, loadConversations]);

  useEffect(() => {
    if (!selectedUser || !adminIdRef.current || !privateKeyRef.current) return;
    peerKeyRef.current = null;
    const privateKey = privateKeyRef.current;

    const socket = getSocket();
    if (socket) {
      socket.emit("join_conversation", selectedUser._id);
      socket.emit("mark_as_read", selectedUser._id);
    }

    let isMounted = true;
    const loadMessages = async () => {
      try {
        const history = await chatApi.getMessages(selectedUser._id);
        const peerKey = selectedUser.chatPublicKey
          ? await trustPeerKey(
              adminIdRef.current,
              selectedUser._id,
              selectedUser.chatPublicKey
            )
          : null;
        if (history.data.some((message) => message.encryptedPayload) && !peerKey) {
          throw new Error("This user's encryption key is not registered. Ask them to click Contact Admin to continue.");
        }
        peerKeyRef.current = peerKey;
        const decryptedMessages = await Promise.all(
          history.data.map(async (message) => ({
            ...message,
            displayText: await decryptChatMessage(
              message,
              privateKey,
              "admin",
              selectedUser._id
            ),
          }))
        );
        if (isMounted) {
          setMessages(decryptedMessages);
        }
      } catch (error) {
        console.error("Failed to load/decrypt admin chat:", error);
        if (isMounted) {
          setMessages([]);
          peerKeyRef.current = null;
          toast.error(error instanceof Error ? error.message : "Could not open this encrypted chat.");
        }
      }
    };
    void loadMessages();

    return () => {
      isMounted = false;
      if (socket) {
        socket.emit("leave_conversation", selectedUser._id);
      }
    };
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedUser || sending) return;

    const textToSend = input.trim();
    const socket = getSocket();
    const ownPublicKey = publicKeyRef.current;
    const privateKey = privateKeyRef.current;
    if (!socket?.connected || !ownPublicKey || !privateKey || !peerKeyRef.current) {
      toast.error("Encrypted chat is not ready on this device.");
      return;
    }

    setSending(true);
    try {
      const encryptedPayload = await encryptChatMessage(
        textToSend,
        ownPublicKey,
        peerKeyRef.current,
        selectedUser._id
      );
      socket.emit("send_message", { encryptedPayload, targetUserId: selectedUser._id }, async (res: {
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
                "admin",
                selectedUser._id
              ),
            };
            setInput("");
            setMessages((prev) => appendUniqueMessage(prev, sentMessage));
            loadConversations();
          } catch (error) {
            console.error("Could not decrypt sent admin message:", error);
            toast.error("Message was sent, but could not be decrypted on this device.");
          }
      });
    } catch (error) {
      setSending(false);
      console.error("Could not encrypt admin message:", error);
      toast.error("Could not encrypt your message.");
    }
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-2xl border border-white/10 bg-[#16161e] shadow-xl overflow-hidden">
      <div className="flex h-full flex-col md:flex-row">
        {/* Left: Conversations list */}
        <div className="flex w-full flex-col border-b border-white/10 md:w-80 md:border-b-0 md:border-r bg-[#12121a]">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white mb-3">Live User Support</h2>
            <p className="mb-3 text-[11px] text-slate-400">{chatStatus}</p>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#1f2335] pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {loadingConv ? (
              <p className="p-4 text-center text-xs text-slate-400">Loading chats...</p>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <MessageSquare className="mx-auto mb-2 opacity-30" size={28} />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = selectedUser?._id === c.user._id;
                return (
                  <button
                    key={c.user._id}
                    onClick={() => {
                      selectedUserRef.current = c.user;
                      setSelectedUser(c.user);
                    }}
                    className={`flex w-full items-start gap-3 p-3.5 text-left transition hover:bg-white/5 ${
                      isSelected ? "bg-violet-600/15 border-l-4 border-violet-500" : ""
                    }`}
                  >
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600/20 text-violet-300 font-bold">
                      {c.user.name ? c.user.name.charAt(0).toUpperCase() : "U"}
                      {c.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-semibold text-white">{c.user.name}</p>
                        <span className="text-[10px] text-slate-500">
                          {c.lastMessage?.createdAt
                            ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-400">{c.user.email}</p>
                      <p className="truncate text-xs text-slate-500 mt-1">
                        {c.lastMessage?.encryptedPayload
                          ? "Encrypted message"
                          : c.lastMessage?.text || "No messages"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat Area */}
        <div className="flex flex-1 flex-col bg-[#16161e]">
          {selectedUser ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#14141d]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white font-bold">
                    {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedUser.name}</h3>
                    <p className="text-xs text-slate-400">{selectedUser.email} · {chatStatus}</p>
                  </div>
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 space-y-3 overflow-y-auto p-6 text-sm">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-slate-400">
                    <MessageSquare size={40} className="mb-2 opacity-30" />
                    <p className="font-medium">No messages yet with this customer.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isAdmin = m.senderRole !== "user";
                    return (
                      <div
                        key={m._id}
                        className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                      >
                        <span className="mb-1 text-[10px] text-slate-400">
                          {isAdmin ? "You (Admin Support)" : m.senderName}
                        </span>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            isAdmin
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
                        <span className="mt-1 text-[10px] text-slate-500">
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

              {/* Chat Input */}
              {!selectedUser.chatPublicKey && (
                <p className="border-t border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs text-amber-100">
                  Ask this user to click Contact Admin before sending encrypted replies.
                </p>
              )}
              <form onSubmit={handleSend} className="border-t border-white/10 bg-[#12121a] p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Reply to ${selectedUser.name}...`}
                    className="flex-1 rounded-xl border border-white/10 bg-[#1f2335] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim() || !selectedUser.chatPublicKey}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500 disabled:opacity-40"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-slate-400">
              <MessageSquare size={48} className="mb-3 opacity-20" />
              <p className="text-base font-semibold">Select a customer to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
