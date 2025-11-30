// src/features/Auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/**
 * Auth slice + thunks
 *
 * Notes:
 * - Uses localStorage keys: auth_access, auth_refresh, auth_user
 * - All API requests that require auth should use authFetch (adds Authorization header)
 * - changePassword thunk posts to: ${API_BASE}/auth/password/change/
 */

export const API_BASE =
  import.meta.env.VITE_API_BASE || 'https://api.eastmondvillas.com/api';

const ACCESS_KEY = 'auth_access';
const REFRESH_KEY = 'auth_refresh';
const USER_KEY = 'auth_user';

/* ----------------------------- Local storage helpers ---------------------------- */
const saveTokens = ({ access, refresh }) => {
  try {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  } catch (e) {
    // ignore storage errors
    // console.warn('saveTokens error', e);
  }
};

const clearTokens = () => {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch (e) {
    // ignore
  }
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
    // JSON.stringify(null) -> "null" which is OK to store; getUserFromStorage handles it.
    localStorage.setItem(USER_KEY, JSON.stringify(user ?? null));
  } catch (e) {
    // ignore
  }
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
  } catch (e) {
    // ignore
  }
};

/* ----------------------------- Fetch helper (auth) ----------------------------- */
/**
 * authFetch(url, options)
 * - adds Authorization header when access token available
 * - merges headers provided in options
 * - sets Accept: application/json
 * - sets Content-Type: application/json unless body is FormData or Content-Type already provided
 */
const authFetch = (url, options = {}) => {
  const headers = { ...(options.headers || {}) };

  // Always accept JSON responses
  if (!headers.Accept) headers.Accept = 'application/json';

  // Attach Authorization header if available
  const access = getAccessToken();
  if (access && !headers.Authorization) {
    headers.Authorization = `Bearer ${access}`;
  }

  // Only set Content-Type to application/json when the caller didn't provide it and body is not FormData
  const body = options.body;
  const isFormData =
    typeof FormData !== 'undefined' && body instanceof FormData;

  if (!headers['Content-Type'] && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  // Return the raw fetch promise so calling code can handle response/json
  return fetch(url, { ...options, headers });
};

/* ----------------------------- Async thunks ----------------------------- */

export const register = createAsyncThunk(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/registration/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return rejectWithValue(data || { detail: 'Registration failed' });
      return data;
    } catch (err) {
      return rejectWithValue({ detail: err?.message || 'Network error' });
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return rejectWithValue(data || { detail: 'Login failed' });

      saveTokens({ access: data.access, refresh: data.refresh });
      saveUser(data.user || null);
      return data; // { access, refresh, user }
    } catch (err) {
      return rejectWithValue({ detail: err?.message || 'Network error' });
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const refresh = getRefreshToken();
      if (!refresh) return rejectWithValue({ detail: 'No refresh token' });

      const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refresh }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) return rejectWithValue(data || { detail: 'Refresh failed' });

      if (data.access) {
        try {
          localStorage.setItem(ACCESS_KEY, data.access);
        } catch (e) {
          // ignore
        }
      }
      return data;
    } catch (err) {
      return rejectWithValue({ detail: err?.message || 'Network error' });
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const access = getAccessToken();
      const refresh = getRefreshToken();

      const res = await fetch(`${API_BASE}/auth/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: access ? `Bearer ${access}` : '',
        },
        body: JSON.stringify({ refresh }),
      });

      // Clear tokens locally regardless of server result
      clearTokens();
      clearUser();

      if (res.ok) return { detail: 'Successfully logged out.' };
      const data = await res.json().catch(() => null);
      return rejectWithValue(data || { detail: 'Logout failed' });
    } catch (err) {
      clearTokens();
      clearUser();
      return rejectWithValue({ detail: err?.message || 'Network error' });
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      let res = await authFetch(`${API_BASE}/auth/user/`);

      if (res.status === 401) {
        // Try refresh
        const refreshed = await dispatch(refreshToken());
        if (refreshToken.fulfilled.match(refreshed)) {
          res = await authFetch(`${API_BASE}/auth/user/`);
        } else {
          return rejectWithValue({ detail: 'Session expired' });
        }
      }

      const data = await res.json().catch(() => null);
      if (!res.ok) return rejectWithValue(data || { detail: 'Failed to fetch user' });

      saveUser(data);
      return data;
    } catch (err) {
      return rejectWithValue({ detail: err?.message || 'Network error' });
    }
  }
);

/* ----------------------------- Admin user management ----------------------------- */

export const adminListUsers = createAsyncThunk(
  'auth/adminListUsers',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authFetch(`${API_BASE}/admin/users/`);
      const data = await res.json().catch(() => null);
      if (!res.ok) return rejectWithValue(data || { detail: 'Failed to list users' });
      return data;
    } catch (err) {
      return rejectWithValue({ detail: err?.message || 'Network error' });
    }
  }
);

export const adminCreateUser = createAsyncThunk(
  'auth/adminCreateUser',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await authFetch(`${API_BASE}/admin/users/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return rejectWithValue(data || { detail: 'Failed to create user' });
      return data;
    } catch (err) {
      return rejectWithValue({ detail: err?.message || 'Network error' });
    }
  }
);

export const adminUpdateUser = createAsyncThunk(
  'auth/adminUpdateUser',
  async ({ id, body }, { rejectWithValue }) => {
    try {
      const res = await authFetch(`${API_BASE}/admin/users/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return rejectWithValue(data || { detail: 'Failed to update user' });
      return data;
    } catch (err) {
      return rejectWithValue({ detail: err?.message || 'Network error' });
    }
  }
);

export const adminDeleteUser = createAsyncThunk(
  'auth/adminDeleteUser',
  async (id, { rejectWithValue }) => {
    try {
      const res = await authFetch(`${API_BASE}/admin/users/${id}/`, {
        method: 'DELETE',
      });
      if (res.status === 204) return { id };
      const data = await res.json().catch(() => null);
      return rejectWithValue(data || { detail: 'Failed to delete user' });
    } catch (err) {
      return rejectWithValue({ detail: err?.message || 'Network error' });
    }
  }
);

/* ----------------------------- Password change thunk ----------------------------- */
/**
 * changePassword payload should contain:
 * - old_password (optional depending on backend)
 * - new_password1
 * - new_password2
 *
 * Endpoint: POST ${API_BASE}/auth/password/change/
 */
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await authFetch(`${API_BASE}/auth/password/change/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return rejectWithValue(data || { detail: 'Failed to change password' });
      return data;
    } catch (err) {
      return rejectWithValue({ detail: err?.message || 'Network error' });
    }
  }
);

/* ----------------------------- Slice & reducers ----------------------------- */

const initialState = {
  access: getAccessToken(),
  refresh: getRefreshToken(),
  user: getUserFromStorage(),
  usersList: [],
  loading: false,
  error: null,
  lastAction: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthState(state) {
      state.access = null;
      state.refresh = null;
      state.user = null;
      state.loading = false;
      state.error = null;
      state.lastAction = 'clearAuthState';
      clearTokens();
      clearUser();
    },

    setLocalRole(state, action) {
      if (state.user) state.user.role = action.payload;
      state.lastAction = 'setLocalRole';

      saveUser(state.user);
    },
  },
  extraReducers: (builder) => {
    // register
    builder.addCase(register.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.lastAction = 'register_started';
    });
    builder.addCase(register.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      state.lastAction = 'register_succeeded';
      state.user = action.payload;
      saveUser(action.payload);
    });
    builder.addCase(register.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error;
      state.lastAction = 'register_failed';
    });

    // login
    builder.addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.lastAction = 'login_started';
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.loading = false;
      state.access = action.payload.access;
      state.refresh = action.payload.refresh;
      state.user = action.payload.user;
      state.error = null;
      state.lastAction = 'login_succeeded';
      saveTokens({
        access: action.payload.access,
        refresh: action.payload.refresh,
      });
      saveUser(action.payload.user);
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error;
      state.lastAction = 'login_failed';
      clearTokens();
      clearUser();
      state.access = null;
      state.refresh = null;
      state.user = null;
    });

    // refreshToken
    builder.addCase(refreshToken.pending, (state) => {
      state.loading = true;
      state.lastAction = 'refresh_started';
      state.error = null;
    });
    builder.addCase(refreshToken.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload?.access) {
        state.access = action.payload.access;
        try {
          localStorage.setItem(ACCESS_KEY, action.payload.access);
        } catch (e) {
          // ignore
        }
      }
      state.lastAction = 'refresh_succeeded';
    });
    builder.addCase(refreshToken.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error;
      state.lastAction = 'refresh_failed';
      state.access = null;
      state.refresh = null;
      state.user = null;
      clearTokens();
      clearUser();
    });

    // logout
    builder.addCase(logout.pending, (state) => {
      state.loading = true;
      state.lastAction = 'logout_started';
      state.error = null;
    });
    builder.addCase(logout.fulfilled, (state) => {
      state.loading = false;
      state.access = null;
      state.refresh = null;
      state.user = null;
      state.error = null;
      state.lastAction = 'logout_succeeded';
      clearTokens();
      clearUser();
    });
    builder.addCase(logout.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error;
      state.lastAction = 'logout_failed';
      state.access = null;
      state.refresh = null;
      state.user = null;
      clearTokens();
      clearUser();
    });

    // fetchCurrentUser
    builder.addCase(fetchCurrentUser.pending, (state) => {
      state.loading = true;
      state.lastAction = 'fetchCurrentUser_started';
      state.error = null;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
      state.lastAction = 'fetchCurrentUser_succeeded';
      saveUser(action.payload);
    });
    builder.addCase(fetchCurrentUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error;
      state.lastAction = 'fetchCurrentUser_failed';
    });

    // admin list/create/update/delete
    builder.addCase(adminListUsers.pending, (state) => {
      state.loading = true;
      state.lastAction = 'adminListUsers_started';
      state.error = null;
    });
    builder.addCase(adminListUsers.fulfilled, (state, action) => {
      state.loading = false;
      state.usersList = action.payload;
      state.lastAction = 'adminListUsers_succeeded';
    });
    builder.addCase(adminListUsers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error;
      state.lastAction = 'adminListUsers_failed';
    });

    builder.addCase(adminCreateUser.pending, (state) => {
      state.loading = true;
      state.lastAction = 'adminCreateUser_started';
      state.error = null;
    });
    builder.addCase(adminCreateUser.fulfilled, (state, action) => {
      state.loading = false;
      state.usersList = [action.payload, ...state.usersList];
      state.lastAction = 'adminCreateUser_succeeded';
    });
    builder.addCase(adminCreateUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error;
      state.lastAction = 'adminCreateUser_failed';
    });

    builder.addCase(adminUpdateUser.pending, (state) => {
      state.loading = true;
      state.lastAction = 'adminUpdateUser_started';
      state.error = null;
    });
    builder.addCase(adminUpdateUser.fulfilled, (state, action) => {
      state.loading = false;
      const updated = action.payload;
      state.usersList = state.usersList.map((u) =>
        u.id === updated.id ? updated : u
      );

      if (state.user && state.user.id === updated.id) {
        state.user = { ...state.user, ...updated };
        saveUser(state.user);
      }
      state.lastAction = 'adminUpdateUser_succeeded';
    });
    builder.addCase(adminUpdateUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error;
      state.lastAction = 'adminUpdateUser_failed';
    });

    builder.addCase(adminDeleteUser.pending, (state) => {
      state.loading = true;
      state.lastAction = 'adminDeleteUser_started';
      state.error = null;
    });
    builder.addCase(adminDeleteUser.fulfilled, (state, action) => {
      state.loading = false;
      state.usersList = state.usersList.filter((u) => u.id !== action.payload.id);
      state.lastAction = 'adminDeleteUser_succeeded';
    });
    builder.addCase(adminDeleteUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error;
      state.lastAction = 'adminDeleteUser_failed';
    });

    // changePassword
    builder.addCase(changePassword.pending, (state) => {
      state.loading = true;
      state.lastAction = 'changePassword_started';
      state.error = null;
    });
    builder.addCase(changePassword.fulfilled, (state, action) => {
      state.loading = false;
      state.lastAction = 'changePassword_succeeded';
    });
    builder.addCase(changePassword.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error;
      state.lastAction = 'changePassword_failed';
    });
  },
});

export const { clearAuthState, setLocalRole } = authSlice.actions;

/* ----------------------------- Selectors ----------------------------- */
export const selectAuth = (state) => state.auth;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) =>
  Boolean(state.auth.access && state.auth.user);
export const selectUsersList = (state) => state.auth.usersList;

export default authSlice.reducer;
