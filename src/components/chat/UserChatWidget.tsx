import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Smile, Phone, Video } from "lucide-react";
import { io } from "socket.io-client";
import EmojiPicker, { Theme } from "emoji-picker-react";
import WebRTCCall from "./WebRTCCall";
import toast from "react-hot-toast";
import { getAuthToken, SOCKET_URL, API_BASE_URL } from "../../services/api";

export default function UserChatWidget() {
  const [authStamp, setAuthStamp] = useState(0);

  useEffect(() => {
    const handleAuthChange = () => setAuthStamp((stamp) => stamp + 1);
    window.addEventListener("auth_changed", handleAuthChange);
    return () => window.removeEventListener("auth_changed", handleAuthChange);
  }, []);

  const token = localStorage.getItem("gaming_token");
  const role = (localStorage.getItem("gaming_user_role") || "").toLowerCase();
  const userName = localStorage.getItem("gaming_user_name") || "Player";
  const userId = localStorage.getItem("gaming_user_id") || "";

  if (!token || role !== "user" || !userId) {
    return null;
  }

  return <ChatWidget key={authStamp} userId={userId} userName={userName} />;
}

function ChatWidget({ userId, userName }: { userId: string; userName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const [reactingMsgId, setReactingMsgId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{data: string, name: string, type: 'image' | 'document'} | null>(null);
  
  // Call States
  const [callData, setCallData] = useState<{isIncoming: boolean, type: 'audio'|'video', callerName: string} | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Connect immediately so replies can update the unread badge.
  useEffect(() => {
    const newSocket = io(SOCKET_URL, { auth: { token: getAuthToken() } });
    setSocket(newSocket);

    newSocket.on("connect_error", (error) => {
      console.error("Support chat connection failed:", error.message);
      toast.error("Support chat is currently unavailable.");
    });

    newSocket.on("receive_message", (msg: any) => {
      setMessages((prev) => prev.some((existing) => existing._id === msg._id) ? prev : [...prev, msg]);
      setIsOpen((currentOpen) => {
        if (!currentOpen && msg.senderType === "admin") {
          setUnreadCount((prev) => prev + 1);
        }
        return currentOpen;
      });
    });

    newSocket.on("message_deleted", ({ messageId, type, role: delRole, updatedMessage }) => {
      setMessages((prev) => {
        if (type === 'everyone') {
          return prev.map(m => m._id === messageId ? updatedMessage : m);
        } else if (type === 'me' && delRole === 'user') {
          return prev.filter(m => m._id !== messageId);
        }
        return prev;
      });
    });

    newSocket.on("message_reacted", ({ messageId, reaction }) => {
      setMessages((prev) => prev.map(m => m._id === messageId ? { ...m, reaction } : m));
    });

    newSocket.on("incoming_call", ({ callerName, callType }) => {
      setCallData({ isIncoming: true, type: callType, callerName });
    });

    // Load history
    fetch(`${API_BASE_URL}/chat/history/room_${userId}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMessages((previous) => {
            const byId = new Map(data.messages.map((message: any) => [message._id, message]));
            previous.forEach((message) => byId.set(message._id, message));
            return Array.from(byId.values());
          });
          const unread = data.messages.filter((m: any) => m.senderType === "admin" && !m.isRead).length;
          setUnreadCount(unread);
        }
      })
      .catch((error) => {
        console.error("Unable to load support chat history:", error);
        toast.error("Unable to load support chat history.");
      });

    return () => { newSocket.disconnect(); };
  }, [userId, userName]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      fetch(`${API_BASE_URL}/chat/mark-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ roomId: `room_${userId}` })
      }).catch((error) => console.error("Unable to mark support messages read:", error));
    }
  }, [messages, isOpen, userId]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() && !selectedFile) return;
    if (!socket) return;

    socket.emit("send_message", {
      receiverId: "admin",
      text: input,
      fileData: selectedFile?.data,
      fileName: selectedFile?.name,
      fileType: selectedFile?.type,
    }, (response: { error?: string }) => {
      if (response?.error) toast.error(response.error);
    });
    setInput("");
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large (max 5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        data: reader.result as string,
        name: file.name,
        type: isImage ? 'image' : 'document'
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = (msgId: string, type: 'me' | 'everyone') => {
    if (!socket) return;
    socket.emit("delete_message", { messageId: msgId, type, role: 'user' }, () => {
      setDeletingMsgId(null);
    });
  };

  const handleReact = (msgId: string, emoji: string) => {
    if (!socket) return;
    socket.emit("react_message", { messageId: msgId, reaction: emoji });
    setReactingMsgId(null);
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-[9999] flex justify-end sm:inset-x-auto sm:bottom-6 sm:right-6">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)} 
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xl shadow-indigo-600/30 transition-all hover:scale-110 active:scale-95"
        >
          <MessageSquare size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg border-2 border-[#0f172a]">
              {unreadCount}
            </span>
          )}
        </button>
      )}{isOpen && (
  <div
    className="
      fixed inset-0 z-[9999]
      flex h-[100dvh] w-screen
      flex-col overflow-hidden
      rounded-none
      border-0
      bg-slate-900
      shadow-none
      transition-all

      sm:inset-auto
      sm:right-4
      sm:bottom-4
      sm:h-[90dvh]
      sm:w-[95vw]
      sm:max-w-[900px]
      sm:rounded-2xl
      sm:border
      sm:border-slate-700/50
      sm:shadow-[0_20px_50px_rgba(0,0,0,0.5)]

      lg:right-6
      lg:bottom-6
      lg:h-[85dvh]
      lg:w-[70vw]
      lg:max-w-[1100px]
    "
  >
    {/* ================= CHAT HEADER ================= */}
    <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-4 text-white shadow-md sm:px-5">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-bold tracking-wide sm:text-base">
          Support Chat
        </h3>

        <p className="text-[10px] text-indigo-200 sm:text-xs">
          We usually reply instantly
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() =>
            setCallData({
              isIncoming: false,
              type: "audio",
              callerName: "Admin",
            })
          }
          className="rounded-lg p-2 transition-colors hover:bg-white/20"
          aria-label="Audio call"
        >
          <Phone size={16} />
        </button>

        <button
          type="button"
          onClick={() =>
            setCallData({
              isIncoming: false,
              type: "video",
              callerName: "Admin",
            })
          }
          className="rounded-lg p-2 transition-colors hover:bg-white/20"
          aria-label="Video call"
        >
          <Video size={16} />
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="ml-1 rounded-lg p-2 transition-colors hover:bg-white/20"
          aria-label="Close chat"
        >
          <X size={18} />
        </button>
      </div>
    </div>

    {/* ================= MESSAGES ================= */}
    <div
      className="
        min-h-0
        flex-1
        overflow-y-auto
        bg-[#0f172a]
        p-3
        sm:p-4
      "
    >
      {messages.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center text-slate-500 opacity-70">
          <MessageSquare size={36} className="mb-2" />

          <p className="text-sm">
            Send a message to start!
          </p>
        </div>
      )}

      <div className="space-y-4">
        {messages.map((m, i) => (
          <div
            key={m._id || i}
            className={`group relative flex flex-col ${
              m.senderType === "user"
                ? "items-end"
                : "items-start"
            }`}
          >
            <div
              className={`flex w-full items-end gap-2 ${
                m.senderType === "user"
                  ? "flex-row-reverse"
                  : "flex-row"
              }`}
            >
              <div
                onClick={() => {
                  setDeletingMsgId(
                    deletingMsgId === m._id
                      ? null
                      : m._id
                  );

                  setReactingMsgId(null);
                }}
                className={`
                  relative
                  max-w-[85%]
                  cursor-pointer
                  px-4 py-2.5
                  text-sm
                  shadow-sm
                  transition-all
                  sm:max-w-[75%]
                  lg:max-w-[65%]

                  ${
                    m.senderType === "user"
                      ? "rounded-2xl rounded-br-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                      : "rounded-2xl rounded-bl-sm border border-slate-700/50 bg-slate-800 text-slate-100"
                  }
                `}
              >
                {m.text && (
                  <p className="break-words leading-relaxed">
                    {m.text}
                  </p>
                )}

                {m.fileType === "image" &&
                  m.fileData && (
                    <img
                      src={m.fileData}
                      alt="uploaded"
                      className="
                        mt-2
                        max-h-[220px]
                        max-w-full
                        rounded-lg
                        border
                        border-white/10
                        object-cover
                        shadow-sm
                      "
                    />
                  )}

                {m.fileType === "document" &&
                  m.fileData && (
                    <a
                      href={m.fileData}
                      download={m.fileName}
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                      className="
                        mt-2
                        flex
                        max-w-full
                        items-center
                        gap-2
                        rounded-lg
                        bg-black/20
                        p-2
                        text-xs
                        font-medium
                        text-white
                        transition-colors
                        hover:bg-black/30
                      "
                    >
                      <span>📄</span>

                      <span className="truncate">
                        {m.fileName}
                      </span>
                    </a>
                  )}

                <div
                  className={`
                    mt-1.5
                    flex
                    items-center
                    text-[9px]
                    ${
                      m.senderType === "user"
                        ? "justify-end text-indigo-200"
                        : "justify-start text-slate-400"
                    }
                  `}
                >
                  {formatTime(
                    m.createdAt ||
                      new Date().toISOString()
                  )}
                </div>

                {m.reaction && (
                  <div
                    className={`
                      absolute
                      -bottom-2
                      rounded-full
                      border
                      border-slate-600
                      bg-slate-700
                      px-1.5
                      text-sm
                      shadow-sm
                      ${
                        m.senderType === "user"
                          ? "-left-2"
                          : "-right-2"
                      }
                    `}
                  >
                    {m.reaction}
                  </div>
                )}
              </div>

              {/* Reaction Button */}
              {m._id && (
                <div className="mb-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();

                      setReactingMsgId(
                        reactingMsgId === m._id
                          ? null
                          : m._id
                      );

                      setDeletingMsgId(null);
                    }}
                    className="
                      rounded-full
                      border
                      border-slate-700
                      bg-slate-800
                      p-1.5
                      text-slate-400
                      transition
                      hover:text-indigo-400
                    "
                    aria-label="React to message"
                  >
                    <Smile size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Emoji Picker */}
            {reactingMsgId === m._id &&
              m._id && (
                <div
                  className={`
                    absolute
                    top-full
                    z-[99999]
                    mt-1
                    max-w-[calc(100vw-1rem)]
                    shadow-2xl
                    ${
                      m.senderType === "user"
                        ? "right-2"
                        : "left-2"
                    }
                  `}
                >
                  <EmojiPicker
                    onEmojiClick={(emojiData) =>
                      handleReact(
                        m._id!,
                        emojiData.emoji
                      )
                    }
                    theme={Theme.DARK}
                    width={280}
                    height={350}
                  />
                </div>
              )}

            {/* Delete Menu */}
            {deletingMsgId === m._id &&
              m._id && (
                <div
                  className={`
                    absolute
                    top-full
                    z-[99998]
                    mt-2
                    flex
                    flex-col
                    gap-1
                    rounded-lg
                    border
                    border-slate-700/50
                    bg-slate-800
                    p-1.5
                    shadow-xl
                    ${
                      m.senderType === "user"
                        ? "right-0"
                        : "left-0"
                    }
                  `}
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(m._id!, "me")
                    }
                    className="
                      whitespace-nowrap
                      rounded-md
                      px-3
                      py-1.5
                      text-left
                      text-xs
                      text-slate-300
                      transition-colors
                      hover:bg-slate-700
                      hover:text-white
                    "
                  >
                    Delete for me
                  </button>

                  {m.senderType === "user" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          m._id!,
                          "everyone"
                        )
                      }
                      className="
                        whitespace-nowrap
                        rounded-md
                        px-3
                        py-1.5
                        text-left
                        text-xs
                        text-red-400
                        transition-colors
                        hover:bg-slate-700
                        hover:text-red-300
                      "
                    >
                      Delete for everyone
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setDeletingMsgId(null)
                    }
                    className="
                      whitespace-nowrap
                      rounded-md
                      px-3
                      py-1.5
                      text-left
                      text-xs
                      text-slate-400
                      transition-colors
                      hover:bg-slate-700
                      hover:text-slate-300
                    "
                  >
                    Cancel
                  </button>
                </div>
              )}
          </div>
        ))}
      </div>

      <div ref={messagesEndRef} />
    </div>

    {/* ================= FILE PREVIEW ================= */}
    {selectedFile && (
      <div
        className="
          flex
          shrink-0
          items-center
          justify-between
          border-t
          border-slate-700/50
          bg-slate-800
          p-3
        "
      >
        <div className="flex min-w-0 items-center gap-2">
          {selectedFile.type === "image" ? (
            <img
              src={selectedFile.data}
              alt="preview"
              className="h-10 w-10 shrink-0 rounded object-cover"
            />
          ) : (
            <div
              className="
                flex h-10 w-10 shrink-0 items-center justify-center rounded bg-indigo-600/20 text-indigo-400
              "
            >
              📄
            </div>
          )}

          <span className="truncate text-xs text-white">
            {selectedFile.name}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setSelectedFile(null)}
          className="ml-3 shrink-0 text-slate-400 hover:text-white"aria-label="Remove selected file"><X size={16} />
        </button>
      </div>
    )}

    {/* ================= MESSAGE INPUT ================= */}
    <form
      onSubmit={handleSend}className="flex shrink-0 items-center gap-2 border-t border-slate-700/50 bg-slate-900 p-3 sm:p-4">
      <input
        type="file"ref={fileInputRef} onChange={handleFileChange}className="hidden"/>

      <button
        type="button"
        onClick={() =>
          fileInputRef.current?.click()
        }
        className="
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-full
          p-2
          text-slate-400
          transition-all
          hover:bg-slate-800
          hover:text-indigo-400
        "
        aria-label="Attach file"
      >
        <span className="text-2xl leading-none">
          +
        </span>
      </button>

      <input
        type="text"
        value={input}
        onChange={(e) =>
          setInput(e.target.value)
        }
        placeholder="Type your message..."
        className="
          min-w-0
          flex-1
          rounded-full
          border
          border-slate-700/50
          bg-slate-800
          px-4
          py-2.5
          text-sm
          text-white
          outline-none
          transition-all
          placeholder:text-slate-500
          focus:ring-2
          focus:ring-indigo-500/50
        "
      />

      <button
        type="submit"
        disabled={
          !input.trim() && !selectedFile
        }
        className="flex h-10
          w-10
          shrink-0 items-center justify-center rounded-full bg-gradient-to-tr
          from-violet-600
          to-indigo-600
          text-white
          shadow-lg
          shadow-indigo-600/20
          transition-all
          hover:scale-105
          active:scale-95
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
        aria-label="Send message"
      >
        <Send size={16} className="-ml-0.5" />
      </button>
    </form>
  </div>
)}

{/* ================= AUDIO / VIDEO CALL ================= */}
{callData && (
  <WebRTCCall
    socket={socket}
    roomId={`room_${userId}`}
    isIncoming={callData.isIncoming}
    initialCallType={callData.type}
    callerName={callData.callerName}
    onEnd={() => setCallData(null)}
  />
)}
    </div>
  );
}