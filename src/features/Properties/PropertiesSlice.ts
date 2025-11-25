// src/store/propertyBookingSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://10.10.13.60:8000/api";

/* --------------------------------
   Auth / Token Helpers (local)
----------------------------------- */
const ACCESS_KEY = "auth_access";

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

  if (access) headers["Authorization"] = `Bearer ${access}`;

  const isForm = options.body instanceof FormData;
  // Only set json content-type when not sending FormData and not already set by caller
  if (!isForm && !("Content-Type" in headers)) {
    headers["Content-Type"] = "application/json";
  }
  if (isForm && "Content-Type" in headers) {
    // ensure the Content-Type header isn't forcing application/json for FormData
    delete headers["Content-Type"];
  }

  return fetch(url, { ...options, headers });
};

/* --------------------------------
   FormData Builder for Properties
----------------------------------- */
function buildPropertyFormData(propertyData: any = {}, mediaFiles: File[] = []) {
  const fd = new FormData();

  if (mediaFiles.length > 0) {
    if (
      !Array.isArray(propertyData.media_metadata) ||
      propertyData.media_metadata.length !== mediaFiles.length
    ) {
      throw { detail: "media_files count must match media_metadata count." };
    }
  }

  for (const [k, v] of Object.entries(propertyData)) {
    if (v === undefined || v === null) continue;

    if (k === "media_metadata") {
      for (const meta of v) {
        fd.append(
          "media_metadata",
          typeof meta === "string" ? meta : JSON.stringify(meta)
        );
      }
      continue;
    }

    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean")
      fd.append(k, String(v));
    else fd.append(k, JSON.stringify(v));
  }

  mediaFiles.forEach((file) => fd.append("media_files", file));

  return fd;
}

/* --------------------------------
   Properties Thunks
----------------------------------- */
export const fetchProperties = createAsyncThunk(
  "propertyBooking/fetchProperties",
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
  "propertyBooking/fetchProperty",
  async (propertyId: number, { rejectWithValue }) => {
    try {
      const res = await authFetch(`${API_BASE}/villas/properties/${propertyId}/`);
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const createProperty = createAsyncThunk(
  "propertyBooking/createProperty",
  async ({ propertyData, mediaFiles }: any, { rejectWithValue }) => {
    try {
      let options: any;

      if (mediaFiles?.length > 0) {
        const fd = buildPropertyFormData(propertyData, mediaFiles);
        options = { method: "POST", body: fd };
      } else {
        options = { method: "POST", body: JSON.stringify(propertyData) };
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
 * - payload: { propertyId, updates, mediaFiles?, useJson? }
 * - default: use FormData (many backends expect multipart for PATCH)
 * - if useJson === true, send JSON (Content-Type: application/json)
 */
export const updateProperty = createAsyncThunk(
  "propertyBooking/updateProperty",
  async (
    {
      propertyId,
      updates,
      mediaFiles,
      useJson = false,
    }: { propertyId: number; updates: any; mediaFiles?: File[]; useJson?: boolean },
    { rejectWithValue }
  ) => {
    try {
      let options: any;

      if (!useJson) {
        // prefer FormData by default
        const fd = buildPropertyFormData(updates ?? {}, mediaFiles ?? []);
        options = { method: "PATCH", body: fd };
      } else {
        // send JSON — caller requested JSON explicitly
        options = {
          method: "PATCH",
          body: JSON.stringify(updates ?? {}),
          headers: { "Content-Type": "application/json" },
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
 * - payload: Array<{ propertyId, updates, mediaFiles?, useJson? }>
 * - Performs sequential PATCH requests and returns array of results.
 * - If any item fails, we collect the error object in the results array (so caller can inspect per-item)
 */
export const updateMultipleProperties = createAsyncThunk(
  "propertyBooking/updateMultipleProperties",
  async (
    items: Array<{ propertyId: number; updates: any; mediaFiles?: File[]; useJson?: boolean }>,
    { rejectWithValue }
  ) => {
    try {
      const results: any[] = [];

      // perform sequentially to avoid overloading backend and make consistent behaviour
      for (const it of items) {
        try {
          const { propertyId, updates, mediaFiles, useJson } = it;
          let options: any;
          if (!useJson) {
            const fd = buildPropertyFormData(updates ?? {}, mediaFiles ?? []);
            options = { method: "PATCH", body: fd };
          } else {
            options = {
              method: "PATCH",
              body: JSON.stringify(updates ?? {}),
              headers: { "Content-Type": "application/json" },
            };
          }

          const res = await authFetch(`${API_BASE}/villas/properties/${propertyId}/`, options);

          let data: any = null;
          try {
            data = await res.json();
          } catch (e) {
            data = await res.text().catch(() => null);
          }

          if (!res.ok) {
            // push an error object for that item (don't abort all)
            results.push({ propertyId, ok: false, error: data ?? { detail: `HTTP ${res.status}` } });
          } else {
            results.push({ propertyId, ok: true, payload: data });
          }
        } catch (err) {
          results.push({ propertyId: (it as any).propertyId, ok: false, error: err });
        }
      }

      return results;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const deleteProperty = createAsyncThunk(
  "propertyBooking/deleteProperty",
  async (propertyId: number, { rejectWithValue }) => {
    try {
      const res = await authFetch(
        `${API_BASE}/villas/properties/${propertyId}/`,
        { method: "DELETE" }
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
   Bookings Thunks (unchanged)
----------------------------------- */
export const fetchMyBookings = createAsyncThunk(
  "propertyBooking/fetchMyBookings",
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
  "propertyBooking/createBooking",
  async (payload: any, { rejectWithValue }) => {
    try {
      const res = await authFetch(`${API_BASE}/villas/bookings/`, {
        method: "POST",
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
  "propertyBooking/updateBooking",
  async ({ bookingId, updates }: any, { rejectWithValue }) => {
    try {
      const res = await authFetch(
        `${API_BASE}/villas/bookings/${bookingId}/`,
        {
          method: "PATCH",
          body: JSON.stringify(updates),
        }
      );

      const data = await res.json();

      if (!res.ok) throw data;

      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const deleteBooking = createAsyncThunk(
  "propertyBooking/deleteBooking",
  async (bookingId: number, { rejectWithValue }) => {
    try {
      const res = await authFetch(
        `${API_BASE}/villas/bookings/${bookingId}/`,
        { method: "DELETE" }
      );

      if (res.status === 204) return bookingId;

      const data = await res.json();
      throw data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

/* --------------------------------
   Combined Slice
----------------------------------- */
const propertyBookingSlice = createSlice({
  name: "propertyBooking",
  initialState: {
    properties: [] as any[],
    currentProperty: null as any | null,

    bookings: [] as any[],
    currentBooking: null as any | null,

    loading: false,
    error: null as any,
  },

  reducers: {},

  extraReducers: (builder) => {
    /* -------- Properties -------- */
    builder.addCase(fetchProperties.fulfilled, (state, action) => {
      state.loading = false;
      // normalize paginated or plain responses
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

    // handle the result of updateMultipleProperties (array of results)
    builder.addCase(updateMultipleProperties.fulfilled, (state, action) => {
      state.loading = false;
      const results = action.payload ?? [];
      for (const r of results) {
        if (r?.ok && r.payload && r.payload.id !== undefined) {
          const idx = state.properties.findIndex((p: any) => p.id === r.payload.id);
          if (idx > -1) state.properties[idx] = r.payload;
        }
      }
    });

    builder.addCase(deleteProperty.fulfilled, (state, action) => {
      state.loading = false;
      const id = action.payload;
      state.properties = state.properties.filter((p: any) => p.id !== id);
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
      const index = state.bookings.findIndex((b: any) => b.id === action.payload.id);
      if (index > -1) state.bookings[index] = action.payload;
      state.currentBooking = action.payload;
    });

    builder.addCase(deleteBooking.fulfilled, (state, action) => {
      state.loading = false;
      const id = action.payload;
      state.bookings = state.bookings.filter((b: any) => b.id !== id);
    });

    /* -------- Global Pending & Error -------- */
    builder.addMatcher(
      (action) => action.type.startsWith("propertyBooking") && action.type.endsWith("pending"),
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );

    builder.addMatcher(
      (action) => action.type.startsWith("propertyBooking") && action.type.endsWith("rejected"),
      (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error;
      }
    );
  },
});

export const propertiesAndBookingReducer = propertyBookingSlice.reducer;
