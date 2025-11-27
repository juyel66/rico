// src/store/bookingsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/* ---------------------------
   Auth & storage helpers (same copy, file-local)
   --------------------------- */

export const API_BASE =
  import.meta.env.VITE_API_BASE || 'https://api.eastmondvillas.com/api';

const ACCESS_KEY = 'auth_access';
const REFRESH_KEY = 'auth_refresh';
const USER_KEY = 'auth_user';

const saveTokens = ({ access, refresh }) => {
  try {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  } catch (e) {}
};

const clearTokens = () => {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch (e) {}
};

export const getAccessToken = () => {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch (e) {
    return null;
  }
};
export const getRefreshToken = () => {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch (e) {
    return null;
  }
};

const saveUser = (user) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user || null));
  } catch (e) {}
};
const getUserFromStorage = () => {
  try {
    const v = localStorage.getItem(USER_KEY);
    return v ? JSON.parse(v) : null;
  } catch (e) {
    return null;
  }
};
const clearUser = () => {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (e) {}
};

const authFetch = (url, options = {}) => {
  const headers = { ...(options.headers || {}) };
  const access = getAccessToken();
  if (access) headers['Authorization'] = `Bearer ${access}`;
  const isForm = options.body instanceof FormData;
  if (!isForm) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  } else {
    if (headers['Content-Type']) delete headers['Content-Type'];
  }
  return fetch(url, { ...options, headers });
};

/* ---------------------------
   Thunks - Bookings
   --------------------------- */

export const fetchMyBookings = createAsyncThunk(
  'bookings/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authFetch(`${API_BASE}/villas/bookings/`, {
        method: 'GET',
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const fetchBooking = createAsyncThunk(
  'bookings/fetchOne',
  async (bookingId, { rejectWithValue }) => {
    try {
      const res = await authFetch(`${API_BASE}/villas/bookings/${bookingId}/`, {
        method: 'GET',
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const createBooking = createAsyncThunk(
  'bookings/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await authFetch(`${API_BASE}/villas/bookings/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const updateBooking = createAsyncThunk(
  'bookings/update',
  async ({ bookingId, updates }, { rejectWithValue }) => {
    try {
      const res = await authFetch(`${API_BASE}/villas/bookings/${bookingId}/`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const deleteBooking = createAsyncThunk(
  'bookings/delete',
  async (bookingId, { rejectWithValue }) => {
    try {
      const res = await authFetch(`${API_BASE}/villas/bookings/${bookingId}/`, {
        method: 'DELETE',
      });
      if (res.status === 204) return bookingId;
      const body = await res.json();
      throw body;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

/* ---------------------------
   Bookings slice
   --------------------------- */

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState: {
    items: [],
    current: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentBooking(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMyBookings.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    builder.addCase(fetchMyBookings.fulfilled, (s, a) => {
      s.loading = false;
      s.items = a.payload;
    });
    builder.addCase(fetchMyBookings.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload ?? a.error;
    });

    builder.addCase(fetchBooking.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    builder.addCase(fetchBooking.fulfilled, (s, a) => {
      s.loading = false;
      s.current = a.payload;
    });
    builder.addCase(fetchBooking.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload ?? a.error;
    });

    builder.addCase(createBooking.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    builder.addCase(createBooking.fulfilled, (s, a) => {
      s.loading = false;
      s.items.unshift(a.payload);
      s.current = a.payload;
    });
    builder.addCase(createBooking.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload ?? a.error;
    });

    builder.addCase(updateBooking.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    builder.addCase(updateBooking.fulfilled, (s, a) => {
      s.loading = false;
      const idx = s.items.findIndex((it) => it.id === a.payload.id);
      if (idx >= 0) s.items[idx] = a.payload;
      s.current = a.payload;
    });
    builder.addCase(updateBooking.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload ?? a.error;
    });

    builder.addCase(deleteBooking.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    builder.addCase(deleteBooking.fulfilled, (s, a) => {
      s.loading = false;
      s.items = s.items.filter((b) => b.id !== a.payload);
      if (s.current?.id === a.payload) s.current = null;
    });
    builder.addCase(deleteBooking.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload ?? a.error;
    });
  },
});

export const bookingsReducer = bookingsSlice.reducer;
export const bookingsActions = bookingsSlice.actions;

/* Optional exports for auth helpers if you need them in UI */
export const authHelpersBookings = {
  saveTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveUser,
  getUserFromStorage,
  clearUser,
  authFetch,
};
