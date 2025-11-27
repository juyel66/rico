// src/store/notificationsSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

/**
 * Notification shape
 */
export interface Notification {
  id: string;
  type: string;
  title?: string;
  body?: string;
  data?: any;
  read: boolean;
  created_at?: string;
}

interface NotificationsState {
  items: Notification[];
  unreadCount: number;
}

/**
 * In-memory only initial state
 */
const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
};

/**
 * Async thunk: mark a notification as read on the server.
 * Expects server endpoint: POST /api/notifications/{id}/mark-read/
 * Adjust endpoint as needed for your backend.
 */
export const markAsReadAsync = createAsyncThunk<
  { id: string },
  { id: string },
  { rejectValue: { message: string } }
>("notifications/markAsReadAsync", async ({ id }, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("auth_access") || "";
    const res = await fetch(`/api/notifications/${id}/mark-read/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return rejectWithValue({ message: text || "Failed to mark read" });
    }

    return { id };
  } catch (err: any) {
    return rejectWithValue({ message: err.message || "Network error" });
  }
});

const slice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<Notification>) {
      const exists = state.items.find((i) => i.id === action.payload.id);
      if (!exists) {
        state.items.unshift(action.payload);
        if (!action.payload.read) state.unreadCount += 1;
      } else {
        Object.assign(exists, action.payload);
      }
    },
    markAsRead(state, action: PayloadAction<string>) {
      const id = action.payload;
      const item = state.items.find((i) => i.id === id);
      if (item && !item.read) {
        item.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead(state) {
      state.items.forEach((i) => (i.read = true));
      state.unreadCount = 0;
    },
    setNotifications(state, action: PayloadAction<Notification[]>) {
      state.items = [...action.payload].sort((a, b) =>
        (b.created_at || "").localeCompare(a.created_at || "")
      );
      state.unreadCount = state.items.filter((i) => !i.read).length;
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
      state.unreadCount = state.items.filter((i) => !i.read).length;
    },
    clearNotifications(state) {
      state.items = [];
      state.unreadCount = 0;
    },
    // NEW: set unread count directly (for unseen_notifications summary messages)
    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(markAsReadAsync.fulfilled, (state, action) => {
      const id = action.payload.id;
      const item = state.items.find((i) => i.id === id);
      if (item && !item.read) {
        item.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    });
    // Optionally handle pending/rejected for UI feedback
  },
});

export const {
  addNotification,
  markAsRead,
  markAllRead,
  setNotifications,
  removeNotification,
  clearNotifications,
  setUnreadCount,
} = slice.actions;

export default slice.reducer;
