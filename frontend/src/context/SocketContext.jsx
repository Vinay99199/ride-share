import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { notificationsApi } from "../api/notifications";
import { errorMessage } from "../api/client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [socketError, setSocketError] = useState("");
  const [notificationError, setNotificationError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      setConnected(false);
      setUnreadCount(0);
      setSocketError("");
      setNotificationError("");
      setToast(null);
      return undefined;
    }

    let active = true;
    setNotificationError("");
    const client = io(
      import.meta.env.VITE_SOCKET_URL ||
        (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, ""),
      { auth: { token }, reconnection: true, reconnectionAttempts: 8 }
    );
    setSocket(client);
    const onConnect = () => {
      setConnected(true);
      setSocketError("");
      notificationsApi
        .unreadCount()
        .then((count) => { if (active) setUnreadCount(count); })
        .catch((error) => { if (active) setNotificationError(errorMessage(error)); });
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = (error) => {
      setConnected(false);
      setSocketError(error.message || "Socket connection failed");
    };
    const onNotification = (notification) => {
      setToast(notification);
      setUnreadCount((count) => count + 1);
      window.dispatchEvent(new CustomEvent("avonex:notification", { detail: notification }));
    };

    client.on("connect", onConnect);
    client.on("disconnect", onDisconnect);
    client.on("connect_error", onConnectError);
    client.on("notification:new", onNotification);
    notificationsApi
      .unreadCount()
      .then((count) => { if (active) setUnreadCount(count); })
      .catch((error) => { if (active) setNotificationError(errorMessage(error)); });

    return () => {
      active = false;
      client.off("connect", onConnect);
      client.off("disconnect", onDisconnect);
      client.off("connect_error", onConnectError);
      client.off("notification:new", onNotification);
      client.disconnect();
    };
  }, [token]);

  const refreshUnreadCount = async () => {
    const count = await notificationsApi.unreadCount();
    setUnreadCount(count);
    setNotificationError("");
    return count;
  };
  const clearNotificationError = () => setNotificationError("");

  const value = useMemo(
    () => ({
      socket,
      connected,
      socketError,
      notificationError,
      unreadCount,
      setUnreadCount,
      refreshUnreadCount,
      clearNotificationError,
      toast,
      dismissToast: () => setToast(null),
    }),
    [socket, connected, socketError, notificationError, unreadCount, toast]
  );
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const value = useContext(SocketContext);
  if (!value) throw new Error("useSocket must be used within SocketProvider");
  return value;
};
