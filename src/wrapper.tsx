// src/RootWraper.tsx
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { addNotification } from "./features/notificationsSlice";

// helper to map server payload -> Notification
const mapServerToNotif = (payload: any) => {
  // Try to reuse server id if present
  const id = payload.id ?? payload.notification_id ?? `notif-${Date.now()}-${Math.random()}`;

  return {
    id,
    type: payload.type ?? payload.event ?? "notification",
    title: payload.title ?? payload.summary ?? payload.message ?? "Notification",
    body: payload.body ?? payload.message ?? JSON.stringify(payload.data ?? payload),
    data: payload,
    read: !!payload.read,
    created_at: payload.created_at ?? new Date().toISOString(),
  };
};

export const RootWraper = () => {
  const ws = useRef<WebSocket | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const getToken = () => localStorage.getItem("auth_access") || "";
    let reconnectAttempts = 0;
    let reconnectTimer: number | undefined;

    const connect = () => {
      const token = getToken();
      const wsUrl = `wss://api.eastmondvillas.com/api/notifications/ws/notifications/?token=${token}`;
      console.log("Attempting WS connect to:", wsUrl);

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        reconnectAttempts = 0;
      };

      ws.current.onmessage = (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          console.log("WS payload:", payload);

          // Server may send different shapes: summary, single, array
          if (payload.type === "unseen_notifications" && payload.count !== undefined) {
            const notif = {
              id: `summary-${Date.now()}`,
              type: payload.type,
              title: "New notifications",
              body: `You have ${payload.count} unseen notifications`,
              data: payload,
              read: false,
              created_at: new Date().toISOString(),
            };
            dispatch(addNotification(notif));
          } else if (Array.isArray(payload)) {
            payload.forEach((p) => dispatch(addNotification(mapServerToNotif(p))));
          } else {
            dispatch(addNotification(mapServerToNotif(payload)));
          }
        } catch (err) {
          console.warn("Failed to parse WS message:", event.data, err);
        }
      };

      ws.current.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      ws.current.onclose = (ev) => {
        console.warn("WebSocket closed:", ev.code, ev.reason);
        reconnectAttempts += 1;
        const timeout = Math.min(30000, 1000 * 2 ** Math.min(reconnectAttempts, 5));
        reconnectTimer = window.setTimeout(connect, timeout);
      };
    };

    connect();

    return () => {
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (ws.current) {
        ws.current.onopen = null;
        ws.current.onmessage = null;
        ws.current.onerror = null;
        ws.current.onclose = null;
        try { ws.current.close(); } catch { /* ignore */ }
        ws.current = null;
      }
    };
  }, [dispatch]);

  return <RouterProvider router={router} />;
};
