import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { Send, Pin, Info, Forward, X, Smile, Phone, Video, ArrowLeft } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import WebRTCCall from "../components/chat/WebRTCCall";
import { toast } from "react-hot-toast";
import { API_BASE_URL, getAuthToken, SOCKET_URL } from "../services/api";

export default function AdminChatPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<any>(null);
  const [activeUser, setActiveUser] = useState<string | null>(null);
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const [reactingMsgId, setReactingMsgId] = useState<string | null>(null);
  
  // New features states
  const [pinnedRooms, setPinnedRooms] = useState<string[]>(JSON.parse(localStorage.getItem('pinnedRooms') || '[]'));
  const [showInfo, setShowInfo] = useState(false);
  const [forwardMsgId, setForwardMsgId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{data: string, name: string, type: 'image' | 'document'} | null>(null);

  const [callData, setCallData] = useState<{isIncoming: boolean, type: 'audio'|'video', callerName: string, roomId: string, callerId: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedRoomRef = useRef<string | null>(selectedRoom);

  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/chat/admin/users`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load support chats.");
      setUsers(data.users);
    } catch (error) {
      console.error("Unable to load support chat users:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load support chats.");
    }
  }, []);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, { auth: { token: getAuthToken() } });
    setSocket(newSocket);

    newSocket.on("connect_error", (error) => {
      console.error("Support chat connection failed:", error.message);
      toast.error("Support chat connection failed.");
    });

    newSocket.on("admin_alert_new_message", (msg: any) => {
      void loadUsers();
      if (selectedRoomRef.current === msg.roomId) {
        setMessages((prev) => prev.some((message) => message._id === msg._id) ? prev : [...prev, msg]);
        fetch(`${API_BASE_URL}/chat/mark-read`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({ roomId: msg.roomId }),
        }).catch((error) => console.error("Unable to mark support messages read:", error));
      }
    });

    newSocket.on("message_deleted", ({ messageId, type, role: delRole, updatedMessage }) => {
      setMessages((prev) => {
        if (type === 'everyone') {
          return prev.map(m => m._id === messageId ? updatedMessage : m);
        } else if (type === 'me' && delRole === 'admin') {
          return prev.filter(m => m._id !== messageId);
        }
        return prev;
      });
    });

    newSocket.on("message_reacted", ({ messageId, reaction }) => {
      setMessages((prev) => prev.map(m => m._id === messageId ? { ...m, reaction } : m));
    });

    newSocket.on("incoming_call", ({ callerId, callerName, callType }) => {
      const roomId = `room_${callerId}`;
      setCallData({ isIncoming: true, type: callType, callerName, roomId, callerId });
    });

    void loadUsers();

    return () => { newSocket.disconnect(); };
  }, [loadUsers]);

  useEffect(() => {
    if (!socket || !callData) return;

    socket.emit("join_call_room", { roomId: callData.roomId });
    return () => {
      socket.emit("leave_call_room", { roomId: callData.roomId });
    };
  }, [socket, callData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectUser = async (roomId: string) => {
    setSelectedRoom(roomId);
    setActiveUser(roomId.replace(/^room_/, ""));
    setShowInfo(false);
    
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      };
      const [readResponse, historyResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/chat/mark-read`, {
          method: "POST",
          headers,
          body: JSON.stringify({ roomId }),
        }),
        fetch(`${API_BASE_URL}/chat/history/${encodeURIComponent(roomId)}`, { headers }),
      ]);
      const [readResult, history] = await Promise.all([
        readResponse.json(),
        historyResponse.json(),
      ]);
      if (!readResponse.ok || !readResult.success) {
        throw new Error(readResult.message || "Unable to mark messages read.");
      }
      if (!historyResponse.ok || !history.success) {
        throw new Error(history.message || "Unable to load chat history.");
      }
      setMessages(history.messages);
      void loadUsers();
    } catch (error) {
      console.error("Unable to open support conversation:", error);
      toast.error(error instanceof Error ? error.message : "Unable to load chat.");
    }
  };

  const handleSend = (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText !== undefined ? customText : input;
    if (!textToSend.trim() && !selectedFile && customText === undefined) return;
    if (!socket || !activeUser) return;

    const msgData = {
      receiverId: activeUser,
      text: textToSend,
      fileData: customText === undefined ? selectedFile?.data : undefined,
      fileName: customText === undefined ? selectedFile?.name : undefined,
      fileType: customText === undefined ? selectedFile?.type : undefined,
    };
    socket.emit("send_message", msgData, (res: { success?: boolean; message?: any; error?: string }) => {
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      if (res?.success && res.message) {
        setMessages((prev) => prev.some((message) => message._id === res.message._id) ? prev : [...prev, res.message]);
        void loadUsers();
      }
    });
    if (customText === undefined) {
      setInput("");
      setSelectedFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    if (file.size > 5 * 1024 * 1024) return alert("File is too large (max 5MB)");

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
    socket.emit("delete_message", { messageId: msgId, type, role: 'admin' }, () => {
      setDeletingMsgId(null);
    });
  };

  const handleReact = (msgId: string, emoji: string) => {
    if (!socket) return;
    socket.emit("react_message", { messageId: msgId, reaction: emoji });
    setReactingMsgId(null);
  };

  const togglePin = (roomId: string, e: any) => {
    e.stopPropagation();
    let newPins;
    if (pinnedRooms.includes(roomId)) {
      newPins = pinnedRooms.filter(r => r !== roomId);
    } else {
      newPins = [...pinnedRooms, roomId];
    }
    setPinnedRooms(newPins);
    localStorage.setItem('pinnedRooms', JSON.stringify(newPins));
  };

  const handleForward = (targetUserId: string) => {
    if (!forwardMsgId || !socket) return;
    const msgToForward = messages.find(m => m._id === forwardMsgId);
    if (!msgToForward) return;

    const msgData = {
      receiverId: targetUserId,
      text: msgToForward.text,
      fileData: msgToForward.fileData,
      fileName: msgToForward.fileName,
      fileType: msgToForward.fileType,
    };
    socket.emit("send_message", msgData, (result: { error?: string }) => {
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Message forwarded.");
      void loadUsers();
    });
    setForwardMsgId(null);
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  let filteredUsers = users.filter(u => (u.senderName || u.senderId).toLowerCase().includes(searchTerm.toLowerCase()));
  filteredUsers.sort((a, b) => {
    const aPinned = pinnedRooms.includes(a._id) ? 1 : 0;
    const bPinned = pinnedRooms.includes(b._id) ? 1 : 0;
    return bPinned - aPinned; // Pinned first
  });

  const activeUserInfo = users.find(u => u._id === selectedRoom);

  return (
    <div className="flex h-[85vh] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-700/50 bg-[#0f172a] relative">
      {/* Sidebar */}
      <div className={`w-full md:w-1/3 bg-slate-900 border-r border-slate-800/80 flex-col ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 font-bold text-white border-b border-slate-800/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Users Chat</span>
          </div>
          <span className="text-xs bg-indigo-600 px-2.5 py-1 rounded-full">{filteredUsers.length}</span>
        </div>
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/80">
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all border border-slate-700/50"
          />
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredUsers.map(u => (
            <div key={u._id} onClick={() => void selectUser(u._id)} className={`p-4 border-b border-slate-800/50 cursor-pointer transition-all ${selectedRoom === u._id ? 'bg-indigo-600/10 border-l-4 border-l-indigo-500' : 'hover:bg-slate-800/50 border-l-4 border-l-transparent'}`}>
              <div className="flex justify-between items-center mb-1.5">
                <strong className="text-slate-200 text-sm font-medium flex items-center gap-2">
                  {u.senderName || u.senderId}
                  {pinnedRooms.includes(u._id) && <Pin size={12} className="text-indigo-400" />}
                </strong>
                {u.unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">{u.unreadCount}</span>}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {u.lastMessage || (u.fileName ? `📄 ${u.fileName}` : "No messages yet")}
              </p>
            </div>
          ))}
          {filteredUsers.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">No users found.</div>}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`w-full md:flex-1 bg-[#0f172a] flex-col relative ${selectedRoom ? 'flex' : 'hidden md:flex'}`}>
        {selectedRoom ? (
          <>
            <div className="px-4 md:px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-b border-slate-800/80 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Mobile back to sidebar */}
                <button onClick={() => setSelectedRoom(null)} className="md:hidden text-slate-400 hover:text-white transition-colors">
                  <ArrowLeft size={20} />
                </button>
                {/* Desktop back to dashboard */}
                <a href="/admin" className="hidden md:block text-slate-400 hover:text-white transition-colors">
                  <ArrowLeft size={20} />
                </a>

                <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg">
                  {activeUserInfo?.senderName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    {activeUserInfo?.senderName}
                  </h3>
                  <p className="text-[10px] text-indigo-400">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setCallData({ isIncoming: false, type: 'audio', callerName: activeUserInfo?.senderName, roomId: selectedRoom, callerId: activeUserInfo?.senderId })} className="bg-slate-800 text-slate-400 hover:text-white p-2 rounded-full transition-colors"><Phone size={16} /></button>
                <button onClick={() => setCallData({ isIncoming: false, type: 'video', callerName: activeUserInfo?.senderName, roomId: selectedRoom, callerId: activeUserInfo?.senderId })} className="bg-slate-800 text-slate-400 hover:text-white p-2 rounded-full transition-colors"><Video size={16} /></button>
                <button onClick={(e) => togglePin(selectedRoom, e)} className={`p-2 rounded-full transition-colors ${pinnedRooms.includes(selectedRoom) ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                  <Pin size={16} />
                </button>
                <button onClick={() => setShowInfo(!showInfo)} className={`p-2 rounded-full transition-colors ${showInfo ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                  <Info size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {messages.map((m, i) => (
                <div key={m._id || i} className={`flex flex-col relative group ${m.senderType === "admin" ? "items-end" : "items-start"}`}>
                  
                  <div className={`flex items-end gap-2 w-full ${m.senderType === "admin" ? "flex-row-reverse" : "flex-row"}`}>
                    <div 
                      onClick={() => { setDeletingMsgId(deletingMsgId === m._id ? null : m._id); setReactingMsgId(null); }}
                      className={`max-w-[80%] px-5 py-3 text-sm shadow-sm cursor-pointer transition-all relative ${m.senderType === "admin" ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl rounded-br-sm" : "bg-slate-800 text-slate-100 rounded-2xl rounded-bl-sm border border-slate-700/50"}`}
                    >
                      {m.text && <p className="leading-relaxed">{m.text}</p>}
                      {m.fileType === "image" && m.fileData && (
                        <img src={m.fileData} alt="uploaded" className="mt-2 max-w-full rounded-lg max-h-[250px] object-cover shadow-sm border border-white/10" />
                      )}
                      {m.fileType === "document" && m.fileData && (
                        <a href={m.fileData} download={m.fileName} className="mt-2 flex items-center gap-2 text-xs font-medium bg-black/20 p-2.5 rounded-lg text-white hover:bg-black/30 transition-colors">
                          📄 <span className="truncate max-w-[200px]">{m.fileName}</span>
                        </a>
                      )}
                      <div className={`text-[9px] mt-1.5 flex items-center ${m.senderType === "admin" ? "justify-end text-indigo-200" : "justify-start text-slate-400"}`}>
                        {formatTime(m.createdAt || new Date().toISOString())}
                      </div>
                      {m.reaction && (
                        <div className={`absolute -bottom-2 ${m.senderType === "admin" ? "-left-2" : "-right-2"} bg-slate-700 rounded-full px-1.5 shadow-sm text-sm border border-slate-600`}>
                          {m.reaction}
                        </div>
                      )}
                    </div>

                    {m._id && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2">
                        <button onClick={(e) => { e.stopPropagation(); setReactingMsgId(reactingMsgId === m._id ? null : m._id); setDeletingMsgId(null); }} className="text-slate-400 hover:text-indigo-400 p-1.5 bg-slate-800 rounded-full border border-slate-700">
                          <Smile size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {reactingMsgId === m._id && m._id && (
                    <div className={`absolute top-full mt-1 z-[9999] shadow-2xl ${m.senderType === "admin" ? "right-12" : "left-12"}`}>
                      <EmojiPicker 
                        onEmojiClick={(emojiData) => handleReact(m._id, emojiData.emoji)} 
                        theme={Theme.DARK}
                        width={280}
                        height={350}
                      />
                    </div>
                  )}

                  {deletingMsgId === m._id && m._id && (
                    <div className={`absolute top-full mt-2 z-10 flex flex-col gap-1 rounded-lg bg-slate-800 p-1.5 shadow-xl border border-slate-700/50 ${m.senderType === "admin" ? "right-0" : "left-0"}`}>
                      <button onClick={() => setForwardMsgId(m._id)} className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-left text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"><Forward size={12}/> Forward</button>
                      <button onClick={() => handleDelete(m._id, 'me')} className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs text-left text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">Delete for me</button>
                      {m.senderType === "admin" && (
                        <button onClick={() => handleDelete(m._id, 'everyone')} className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs text-left text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors">Delete for everyone</button>
                      )}
                      <button onClick={() => setDeletingMsgId(null)} className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs text-left text-slate-400 hover:bg-slate-700 hover:text-slate-300 transition-colors">Cancel</button>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {selectedFile && (
              <div className="px-6 py-3 bg-slate-800 border-t border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedFile.type === 'image' ? (
                    <img src={selectedFile.data} alt="preview" className="h-12 w-12 object-cover rounded-lg shadow" />
                  ) : (
                    <div className="h-12 w-12 bg-indigo-600/20 text-indigo-400 flex items-center justify-center rounded-lg shadow">📄</div>
                  )}
                  <span className="text-sm font-medium text-white truncate max-w-[300px]">{selectedFile.name}</span>
                </div>
                <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-white bg-slate-700/50 p-2 rounded-full transition-colors"><X size={16} /></button>
              </div>
            )}

            <form onSubmit={(e) => handleSend(e)} className="p-4 border-t border-slate-800/80 flex gap-3 items-center bg-slate-900">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-full transition-all">
                <span className="text-2xl leading-none">+</span>
              </button>
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                className="flex-1 rounded-full bg-slate-800 px-5 py-3 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all border border-slate-700/50" 
                placeholder="Type your reply..." 
              />
              <button type="submit" disabled={!input.trim()} className="flex items-center justify-center bg-gradient-to-tr from-violet-600 to-indigo-600 h-11 w-11 rounded-full text-white disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/20">
                <Send size={18} className="-ml-0.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-60">
            <div className="h-24 w-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
              <span className="text-4xl text-slate-600">👋</span>
            </div>
            <p className="text-sm font-medium">Select a conversation to start messaging</p>
          </div>
        )}

        {/* Chat Info Panel overlay */}
        {showInfo && selectedRoom && (
          <div className="absolute top-0 right-0 h-full w-64 bg-slate-900 border-l border-slate-800 shadow-2xl p-6 z-20 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold">Chat Info</h3>
              <button onClick={() => setShowInfo(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            <div className="flex flex-col items-center mb-6">
              <div className="h-20 w-20 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-3xl text-white shadow-lg mb-3">
                {activeUserInfo?.senderName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <h4 className="text-white font-bold text-lg">{activeUserInfo?.senderName}</h4>
              <p className="text-slate-400 text-xs">ID: {activeUserInfo?.senderId}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 text-sm text-slate-300">
              <div className="flex justify-between mb-2"><span>Total Messages:</span> <span className="font-bold text-white">{messages.length}</span></div>
              <div className="flex justify-between"><span>Pinned:</span> <span className="font-bold text-white">{pinnedRooms.includes(selectedRoom) ? 'Yes' : 'No'}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Forward Modal */}
      {forwardMsgId && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 shadow-2xl w-96 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-lg">Forward Message to...</h3>
              <button onClick={() => setForwardMsgId(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
              {users.map(u => (
                <div key={u._id} onClick={() => handleForward(u.senderId)} className="p-3 bg-slate-800 hover:bg-indigo-600/20 rounded-xl cursor-pointer text-white text-sm flex items-center gap-3 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold">{u.senderName?.charAt(0).toUpperCase()}</div>
                  {u.senderName}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {callData && (
        <WebRTCCall 
          socket={socket} 
          roomId={callData.roomId} 
          isIncoming={callData.isIncoming} 
          initialCallType={callData.type} 
          callerName={callData.callerName} 
          onEnd={() => setCallData(null)} 
        />
      )}
    </div>
  );
}
