// src/components/NotificationBell.tsx
import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
// import { RootState } from "../";
import { markAsRead } from "../../features/notificationsSlice"; // adjust path if needed
import { Link } from "react-router-dom";
import type { RootState } from "@/store";

export const NotificationBell: React.FC = () => {
  const unread = useSelector((s: RootState) => s.notifications.unreadCount);
  const items = useSelector((s: RootState) => s.notifications.items.slice(0, 6)); // preview
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const onClickNotif = (id: string, url?: string) => {
    dispatch(markAsRead(id));
    setOpen(false);
    if (url) {
      // navigate if you want; using anchor for simplicity
      window.location.href = url;
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        className="p-2 rounded hover:bg-gray-100"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1 rounded-full">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border shadow-lg rounded z-50">
          <div className="p-3 border-b flex items-center justify-between">
            <span className="font-medium">Notifications</span>
            <Link to="//dashboard/notifications" onClick={() => setOpen(false)} className="text-sm text-blue-600">
              View all
            </Link>
          </div>

          <div className="max-h-64 overflow-auto">
            {items.length === 0 && (
              <div className="p-4 text-sm text-gray-500">No notifications</div>
            )}

            {items.map((n) => (
              <div
                key={n.id}
                className={`p-3 cursor-pointer hover:bg-gray-50 ${!n.read ? "bg-gray-50" : ""}`}
                onClick={() => onClickNotif(n.id, (n.data && n.data.url) || undefined)}
              >
                <div className="text-sm font-medium">{n.title}</div>
                <div className="text-xs text-gray-700 truncate">{n.body}</div>
                <div className="text-[11px] text-gray-400 mt-1">{n.created_at}</div>
              </div>
            ))}
          </div>

          <div className="p-2 border-t text-center">
            <Link to="/dashboard/notifications" className="text-sm text-blue-600">
              Open notifications page
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
export default NotificationBell;
