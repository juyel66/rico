// src/store/propertyBookingSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const API_BASE =
  import.meta.env.VITE_API_BASE || 'https://api.eastmondvillas.com/api';

/* --------------------------------
   Auth / Token Helpers (local)
----------------------------------- */
const ACCESS_KEY = 'auth_access';

export const getAccessToken = () => {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch (e) {
    return null;
  }
};

/**
 * authFetch: convenience wrapper
 * - If options.body is FormData, it will NOT set Content-Type (browser sets the multipart boundary)
 * - If options.headers already contains 'Content-Type', we will not override it.
 */
const authFetch = (url: string, options: any = {}) => {
  const headers: any = { ...(options.headers || {}) };
  const access = getAccessToken();

  if (access) headers['Authorization'] = `Bearer ${access}`;

  const isForm = options.body instanceof FormData;
  // Only set json content-type when not sending FormData and not already set by caller
  if (!isForm && !('Content-Type' in headers)) {
    headers['Content-Type'] = 'application/json';
  }
  if (isForm && 'Content-Type' in headers) {
    // ensure the Content-Type header isn't forcing application/json for FormData
    delete headers['Content-Type'];
  }

  return fetch(url, { ...options, headers });
};

/* --------------------------------
   FormData Builder for Properties
----------------------------------- */
function buildPropertyFormData(
  propertyData: any = {},
  mediaFiles: File[] = []
) {
  const fd = new FormData();

  if (mediaFiles.length > 0) {
    if (
      !Array.isArray(propertyData.media_metadata) ||
      propertyData.media_metadata.length !== mediaFiles.length
    ) {
      throw { detail: 'media_files count must match media_metadata count.' };
    }
  }

  for (const [k, v] of Object.entries(propertyData)) {
    if (v === undefined || v === null) continue;

    if (k === 'media_metadata') {
      for (const meta of v) {
        fd.append(
          'media_metadata',
          typeof meta === 'string' ? meta : JSON.stringify(meta)
        );
      }
      continue;
    }

    if (
      typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'boolean'
    )
      fd.append(k, String(v));
    else fd.append(k, JSON.stringify(v));
  }

  mediaFiles.forEach((file) => fd.append('media_files', file));

  return fd;
}

/* --------------------------------
   Announcements helpers & types
----------------------------------- */
interface AnnouncementFile {
  id: number;
  file: string;
  created_at: string;
}
interface Announcement {
  id: number;
  title: string;
  date: string;
  priority: string;
  description: string;
  created_at: string;
  updated_at: string;
  files: AnnouncementFile[];
}

/**
 * buildAnnouncementFormData
 * - Accepts announcementData (plain object) and files array (File[])
 * - Appends fields and files as `files`
 */
function buildAnnouncementFormData(
  announcementData: any = {},
  files: File[] = []
) {
  const fd = new FormData();

  for (const [k, v] of Object.entries(announcementData)) {
    if (v === undefined || v === null) continue;
    if (
      typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'boolean'
    )
      fd.append(k, String(v));
    else fd.append(k, JSON.stringify(v));
  }

  files.forEach((f) => fd.append('files', f));
  return fd;
}

/* --------------------------------
   Resource helpers (new)
----------------------------------- */
/**
 * buildResourceFormData
 * - Appends scalar fields, and appends files using:
 *    - 'file' when there is exactly one file (backend often expects 'file' singular)
 *    - 'files' when multiple files provided
 */
function buildResourceFormData(resourceData: any = {}, files: File[] = []) {
  const fd = new FormData();

  for (const [k, v] of Object.entries(resourceData)) {
    if (v === undefined || v === null) continue;
    if (
      typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'boolean'
    )
      fd.append(k, String(v));
    else fd.append(k, JSON.stringify(v));
  }

  if (files && files.length > 0) {
    if (files.length === 1) {
      // Many backends expect the single uploaded file under 'file'
      fd.append('file', files[0]);
    } else {
      // multi-file case: send under 'files' (array)
      files.forEach((f) => fd.append('files', f));
    }
  }

  return fd;
}

/* --------------------------------
   Helper: URL builders
----------------------------------- */
// Build normalized endpoints even if API_BASE may or may not already include '/api'
const API_ROOT = API_BASE.replace(/\/api\/?$/, '');
const ANNOUNCEMENTS_URL = `${API_ROOT}/api/announcements/announcement/`;
const ACTIVITY_LOGS_URL = `${API_ROOT}/api/activity-log/list/`;

/* NEW: resources endpoint */
const RESOURCES_URL = `${API_ROOT}/api/resources/`;

/* --------------------------------
   Properties Thunks
----------------------------------- */
export const fetchProperties = createAsyncThunk(
  'propertyBooking/fetchProperties',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authFetch(`${API_BASE}/villas/properties/`);
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const fetchProperty = createAsyncThunk(
  'propertyBooking/fetchProperty',
  async (propertyId: number, { rejectWithValue }) => {
    try {
      const res = await authFetch(
        `${API_BASE}/villas/properties/${propertyId}/`
      );
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const createProperty = createAsyncThunk(
  'propertyBooking/createProperty',
  async ({ propertyData, mediaFiles }: any, { rejectWithValue }) => {
    try {
      let options: any;

      if (mediaFiles?.length > 0) {
        const fd = buildPropertyFormData(propertyData, mediaFiles);
        options = { method: 'POST', body: fd };
      } else {
        options = { method: 'POST', body: JSON.stringify(propertyData) };
      }

      const res = await authFetch(`${API_BASE}/villas/properties/`, options);
      const data = await res.json();

      if (!res.ok) throw data;

      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

/**
 * updateProperty
 */
export const updateProperty = createAsyncThunk(
  'propertyBooking/updateProperty',
  async (
    {
      propertyId,
      updates,
      mediaFiles,
      useJson = false,
    }: {
      propertyId: number;
      updates: any;
      mediaFiles?: File[];
      useJson?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      let options: any;

      if (!useJson) {
        // prefer FormData by default
        const fd = buildPropertyFormData(updates ?? {}, mediaFiles ?? []);
        options = { method: 'PATCH', body: fd };
      } else {
        // send JSON — caller requested JSON explicitly
        options = {
          method: 'PATCH',
          body: JSON.stringify(updates ?? {}),
          headers: { 'Content-Type': 'application/json' },
        };
      }

      const res = await authFetch(
        `${API_BASE}/villas/properties/${propertyId}/`,
        options
      );

      // try parse JSON; if parse fails, return raw text as fallback
      let data: any = null;
      try {
        data = await res.json();
      } catch (e) {
        const txt = await res.text().catch(() => null);
        data = txt;
      }

      if (!res.ok) throw data ?? { detail: `HTTP ${res.status}` };

      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

/**
 * updateMultipleProperties
 */
export const updateMultipleProperties = createAsyncThunk(
  'propertyBooking/updateMultipleProperties',
  async (
    items: Array<{
      propertyId: number;
      updates: any;
      mediaFiles?: File[];
      useJson?: boolean;
    }>,
    { rejectWithValue }
  ) => {
    try {
      const results: any[] = [];

      for (const it of items) {
        try {
          const { propertyId, updates, mediaFiles, useJson } = it;
          let options: any;
          if (!useJson) {
            const fd = buildPropertyFormData(updates ?? {}, mediaFiles ?? []);
            options = { method: 'PATCH', body: fd };
          } else {
            options = {
              method: 'PATCH',
              body: JSON.stringify(updates ?? {}),
              headers: { 'Content-Type': 'application/json' },
            };
          }

          const res = await authFetch(
            `${API_BASE}/villas/properties/${propertyId}/`,
            options
          );

          let data: any = null;
          try {
            data = await res.json();
          } catch (e) {
            data = await res.text().catch(() => null);
          }

          if (!res.ok) {
            results.push({
              propertyId,
              ok: false,
              error: data ?? { detail: `HTTP ${res.status}` },
            });
          } else {
            results.push({ propertyId, ok: true, payload: data });
          }
        } catch (err) {
          results.push({
            propertyId: (it as any).propertyId,
            ok: false,
            error: err,
          });
        }
      }

      return results;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const deleteProperty = createAsyncThunk(
  'propertyBooking/deleteProperty',
  async (propertyId: number, { rejectWithValue }) => {
    try {
      const res = await authFetch(
        `${API_BASE}/villas/properties/${propertyId}/`,
        { method: 'DELETE' }
      );

      if (res.status === 204) return propertyId;

      const data = await res.json();
      throw data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

/* --------------------------------
   Announcements Thunks (robust & fixed URL)
----------------------------------- */
export const fetchAnnouncements = createAsyncThunk(
  'propertyBooking/fetchAnnouncements',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authFetch(ANNOUNCEMENTS_URL);
      const contentType = res.headers.get('content-type') || '';
      let data: any;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      if (!res.ok) {
        const message =
          (data && (data.detail || data.message)) ||
          (typeof data === 'string' ? data : `HTTP ${res.status}`);
        return rejectWithValue({ status: res.status, message });
      }

      return data;
    } catch (err: any) {
      return rejectWithValue({ message: String(err?.message ?? err) });
    }
  }
);

export const createAnnouncement = createAsyncThunk(
  'propertyBooking/createAnnouncement',
  async (
    { announcementData, files }: { announcementData: any; files?: File[] },
    { rejectWithValue }
  ) => {
    try {
      let options: any;

      if (files && files.length > 0) {
        const fd = buildAnnouncementFormData(announcementData ?? {}, files);
        options = { method: 'POST', body: fd };
      } else {
        options = {
          method: 'POST',
          body: JSON.stringify({
            title: announcementData.title,
            date: announcementData.date,
            priority: announcementData.priority,
            description:
              announcementData.description ?? announcementData.details,
          }),
          headers: { 'Content-Type': 'application/json' },
        };
      }

      const res = await authFetch(ANNOUNCEMENTS_URL, options);
      const contentType = res.headers.get('content-type') || '';
      let data: any;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      if (!res.ok) {
        const message =
          (data && (data.detail || data.message)) ||
          (typeof data === 'string' ? data : `HTTP ${res.status}`);
        return rejectWithValue({ status: res.status, message });
      }

      return data as Announcement;
    } catch (err: any) {
      return rejectWithValue({ message: String(err?.message ?? err) });
    }
  }
);

/* --------------------------------
   Activity Logs Thunk (new)
   - GET list of activity logs from ACTIVITY_LOGS_URL
   - returns either array or { results: [...] }
----------------------------------- */
export const fetchActivityLogs = createAsyncThunk(
  'propertyBooking/fetchActivityLogs',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authFetch(ACTIVITY_LOGS_URL);
      const contentType = res.headers.get('content-type') || '';
      let data: any;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      if (!res.ok) {
        const message =
          (data && (data.detail || data.message)) ||
          (typeof data === 'string' ? data : `HTTP ${res.status}`);
        return rejectWithValue({ status: res.status, message });
      }

      // Expect either plain array or { results: [...] } pagination
      return data;
    } catch (err: any) {
      return rejectWithValue({ message: String(err?.message ?? err) });
    }
  }
);

/* --------------------------------
   Resources Thunks (NEW)
   - GET  /api/resources/
   - POST /api/resources/
   - Accepts JSON or files (FormData)
----------------------------------- */
export const fetchResources = createAsyncThunk(
  'propertyBooking/fetchResources',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authFetch(RESOURCES_URL);
      const contentType = res.headers.get('content-type') || '';
      let data: any;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      if (!res.ok) {
        const message =
          (data && (data.detail || data.message)) ||
          (typeof data === 'string' ? data : `HTTP ${res.status}`);
        return rejectWithValue({ status: res.status, message });
      }

      return data;
    } catch (err: any) {
      return rejectWithValue({ message: String(err?.message ?? err) });
    }
  }
);

/**
 * createResource
 * - payload: { resourceData: any, files?: File[] }
 * - if files present it uses FormData, otherwise sends JSON
 */
export const createResource = createAsyncThunk(
  'propertyBooking/createResource',
  async (
    { resourceData, files }: { resourceData: any; files?: File[] },
    { rejectWithValue }
  ) => {
    try {
      let options: any;
      if (files && files.length > 0) {
        const fd = buildResourceFormData(resourceData ?? {}, files);
        options = { method: 'POST', body: fd };
      } else {
        options = {
          method: 'POST',
          body: JSON.stringify(resourceData ?? {}),
          headers: { 'Content-Type': 'application/json' },
        };
      }

      const res = await authFetch(RESOURCES_URL, options);
      const contentType = res.headers.get('content-type') || '';
      let data: any;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      if (!res.ok) {
        const message =
          (data && (data.detail || data.message)) ||
          (typeof data === 'string' ? data : `HTTP ${res.status}`);
        return rejectWithValue({ status: res.status, message });
      }

      return data;
    } catch (err: any) {
      return rejectWithValue({ message: String(err?.message ?? err) });
    }
  }
);

/* --------------------------------
   Bookings Thunks (unchanged)
----------------------------------- */
export const fetchMyBookings = createAsyncThunk(
  'propertyBooking/fetchMyBookings',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authFetch(`${API_BASE}/villas/bookings/`);
      const data = await res.json();

      if (!res.ok) throw data;

      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const createBooking = createAsyncThunk(
  'propertyBooking/createBooking',
  async (payload: any, { rejectWithValue }) => {
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
  'propertyBooking/updateBooking',
  async ({ bookingId, updates }: any, { rejectWithValue }) => {
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
  'propertyBooking/deleteBooking',
  async (bookingId: number, { rejectWithValue }) => {
    try {
      const res = await authFetch(`${API_BASE}/villas/bookings/${bookingId}/`, {
        method: 'DELETE',
      });

      if (res.status === 204) return bookingId;

      const data = await res.json();
      throw data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

/* --------------------------------
   NEW: Monthly Agent Bookings Thunk
   - GET /villas/agent/bookings/monthly/?month=<1-12>&year=<yyyy>
   - returns parsed object: { "<propertyId>-<year>-<month>": [1,2,3], ... } as payload
----------------------------------- */
export const fetchMonthlyAgentBookings = createAsyncThunk(
  'propertyBooking/fetchMonthlyAgentBookings',
  async (
    {
      month,
      year,
      agent,
    }: { month: number; year: number; agent?: number | string },
    { rejectWithValue }
  ) => {
    try {
      let url = `${API_BASE.replace(/\/$/, '')}/villas/agent/bookings/monthly/?month=${month}&year=${year}`;
      if (agent !== undefined && agent !== null) {
        // append agent query param if provided
        url += `&agent=${encodeURIComponent(String(agent))}`;
      }

      const resp = await authFetch(url);
      const data = await resp.json().catch(() => null);

      if (!resp.ok) {
        return rejectWithValue({ status: resp.status, data });
      }

      // Return both raw + parsed to reducer
      return { raw: data ?? null, month, year };
    } catch (err: any) {
      return rejectWithValue({ message: String(err?.message ?? err) });
    }
  }
);

/* --------------------------------
   Combined Slice
----------------------------------- */

type InitialState = {
  properties: any[];
  currentProperty: any | null;
  bookings: any[];
  currentBooking: any | null;
  announcements: Announcement[];
  activityLogs: any[]; // objects from activity-log/li
  resources: any[]; // NEW
  loading: boolean;
  error: any;

  // NEW monthly bookings storage (serializable)
  monthlyBookings: { [key: string]: number[] }; // key => array of days
  monthlyRaw: any | null;
};

const initialState: InitialState = {
  properties: [],
  currentProperty: null,

  bookings: [],
  currentBooking: null,

  announcements: [],
  activityLogs: [],

  // NEW
  resources: [],

  loading: false,
  error: null,

  // monthly bookings
  monthlyBookings: {},
  monthlyRaw: null,
};

const propertyBookingSlice = createSlice({
  name: 'propertyBooking',
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    /* -------- Properties -------- */
    builder.addCase(fetchProperties.fulfilled, (state, action) => {
      state.loading = false;
      state.properties = action.payload?.results ?? action.payload ?? [];
    });

    builder.addCase(fetchProperty.fulfilled, (state, action) => {
      state.loading = false;
      state.currentProperty = action.payload;
    });

    builder.addCase(createProperty.fulfilled, (state, action) => {
      state.loading = false;
      state.properties.push(action.payload);
      state.currentProperty = action.payload;
    });

    builder.addCase(updateProperty.fulfilled, (state, action) => {
      state.loading = false;
      const updated = action.payload;
      if (updated && updated.id !== undefined) {
        const idx = state.properties.findIndex((p: any) => p.id === updated.id);
        if (idx > -1) state.properties[idx] = updated;
      }
      state.currentProperty = updated;
    });

    builder.addCase(updateMultipleProperties.fulfilled, (state, action) => {
      state.loading = false;
      const results = action.payload ?? [];
      for (const r of results) {
        if (r?.ok && r.payload && r.payload.id !== undefined) {
          const idx = state.properties.findIndex(
            (p: any) => p.id === r.payload.id
          );
          if (idx > -1) state.properties[idx] = r.payload;
        }
      }
    });

    builder.addCase(deleteProperty.fulfilled, (state, action) => {
      state.loading = false;
      const id = action.payload;
      state.properties = state.properties.filter((p: any) => p.id !== id);
    });

    /* -------- Announcements -------- */
    builder.addCase(fetchAnnouncements.fulfilled, (state, action) => {
      state.loading = false;
      state.announcements = action.payload?.results ?? action.payload ?? [];
    });

    builder.addCase(createAnnouncement.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload) {
        state.announcements.unshift(action.payload as Announcement);
      }
    });

    /* -------- Activity Logs -------- */
    builder.addCase(fetchActivityLogs.fulfilled, (state, action) => {
      state.loading = false;
      state.activityLogs = action.payload?.results ?? action.payload ?? [];
    });

    /* -------- Resources (NEW) -------- */
    builder.addCase(fetchResources.fulfilled, (state, action) => {
      state.loading = false;
      state.resources = action.payload?.results ?? action.payload ?? [];
    });

    builder.addCase(createResource.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload) {
        // push or unshift depending on your preference; I'll unshift to show newest first
        state.resources.unshift(action.payload);
      }
    });

    /* -------- Bookings -------- */
    builder.addCase(fetchMyBookings.fulfilled, (state, action) => {
      state.loading = false;
      state.bookings = action.payload?.results ?? action.payload ?? [];
    });

    builder.addCase(createBooking.fulfilled, (state, action) => {
      state.loading = false;
      state.bookings.push(action.payload);
      state.currentBooking = action.payload;
    });

    builder.addCase(updateBooking.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.bookings.findIndex(
        (b: any) => b.id === action.payload.id
      );
      if (index > -1) state.bookings[index] = action.payload;
      state.currentBooking = action.payload;
    });

    builder.addCase(deleteBooking.fulfilled, (state, action) => {
      state.loading = false;
      const id = action.payload;
      state.bookings = state.bookings.filter((b: any) => b.id !== id);
    });

    /* -------- Monthly Agent Bookings (NEW) -------- */
    builder.addCase(fetchMonthlyAgentBookings.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(fetchMonthlyAgentBookings.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      const payload = action.payload as
        | { raw: any; month: number; year: number }
        | any;
      if (!payload) {
        state.monthlyRaw = null;
        state.monthlyBookings = {};
        return;
      }

      state.monthlyRaw = payload.raw ?? payload;

      // parse into serializable map: { "<propertyId>-<year>-<month>": [day, ...] }
      const parsedMap: { [key: string]: number[] } = {};
      const d = payload.raw ?? payload;

      // robust extraction of data array
      const dataArray: any[] = Array.isArray(d?.data)
        ? d.data
        : Array.isArray(d)
          ? d
          : [];

      for (const item of dataArray) {
        // attempt to find property id
        const idCandidates = [
          item.property,
          item.propertyId,
          item.property_id,
          item.id,
          item.pk,
          item.villa,
          item.villa_id,
          item.villaId,
        ];
        let pid: number | null = null;
        for (const c of idCandidates) {
          if (c !== undefined && c !== null && !Number.isNaN(Number(c))) {
            pid = Number(c);
            break;
          }
        }

        // collect days in various possible shapes
        let days: number[] = [];
        if (Array.isArray(item.bookedDays)) days = item.bookedDays as number[];
        else if (Array.isArray(item.booked_days))
          days = item.booked_days as number[];
        else if (Array.isArray(item.days)) days = item.days as number[];
        else if (Array.isArray(item.bookings)) {
          days = item.bookings
            .map((b: any) => {
              if (typeof b === 'number') return b;
              if (b?.day) return Number(b.day);
              if (b?.date) {
                try {
                  return new Date(b.date).getDate();
                } catch {
                  return null;
                }
              }
              return null;
            })
            .filter(Boolean);
        } else if (Array.isArray(item.booked)) days = item.booked as number[];

        // If days are in nested objects
        if (!days.length && item.bookings && Array.isArray(item.bookings)) {
          days = item.bookings
            .map((b: any) =>
              b?.day
                ? Number(b.day)
                : b?.date
                  ? new Date(b.date).getDate()
                  : null
            )
            .filter(Boolean);
        }

        if (pid != null) {
          const year = payload.year ?? d?.year ?? null;
          const month = payload.month ?? d?.month ?? null;
          const key = `${pid}-${year ?? 'unknownYear'}-${month ?? 'unknownMonth'}`;
          parsedMap[key] = Array.from(
            new Set((days || []).map((v) => Number(v)).filter(Boolean))
          );
        }
      }

      state.monthlyBookings = parsedMap;
    });

    builder.addCase(fetchMonthlyAgentBookings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ??
        action.error ?? { message: 'Failed to fetch monthly bookings' };
      // keep monthlyBookings as-is on failure (or you can clear it)
    });

    /* -------- Global Pending & Error -------- */
    builder.addMatcher(
      (action) =>
        action.type.startsWith('propertyBooking') &&
        action.type.endsWith('pending'),
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );

    // ensure we store only serializable error values
    builder.addMatcher(
      (action) =>
        action.type.startsWith('propertyBooking') &&
        action.type.endsWith('rejected'),
      (state, action) => {
        state.loading = false;
        const payload = action.payload;
        if (payload) {
          state.error = payload;
        } else if (action.error && action.error.message) {
          state.error = action.error.message;
        } else {
          state.error = String(action.error ?? 'Unknown error');
        }
      }
    );
  },
});

export const propertiesAndBookingReducer = propertyBookingSlice.reducer;

/* ------------- Selectors (you can import these) ------------- */
export const selectAllProperties = (state: any) =>
  state.propertyBooking.properties;
export const selectMonthlyBookings = (state: any) =>
  state.propertyBooking.monthlyBookings;
export const selectMonthlyRaw = (state: any) =>
  state.propertyBooking.monthlyRaw;
export const selectPropertyById = (state: any, id: number) =>
  state.propertyBooking.properties.find((p: any) => p.id === id);

export default propertyBookingSlice.reducer;
