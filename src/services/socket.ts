import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket | null => {
  const token = localStorage.getItem("gaming_token");
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  if (!socket) {
    const rawUrl =
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL_BASE_URL ||
      "http://localhost:5000";

    // remove /api suffix if present
    const serverUrl = rawUrl.replace(/\/api\/?$/, "");

    socket = io(serverUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
