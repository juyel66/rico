// File: BookingManagement.tsx
import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import Swal from "sweetalert2";

type Booking = {
  id: number;
  full_name?: string;
  email?: string;
  phone?: string;
  check_in?: string;
  check_out?: string;
  total_price?: string | number;
  property_details?: { id?: number; title?: string };
  user_details?: { id?: number; name?: string; email?: string };
  status?: string;
  [k: string]: any;
};

const ACCESS_KEY = "auth_access";

// build endpoint robustly (avoid double /api)
const RAW_BASE = import.meta.env?.VITE_API_BASE || "http://10.10.13.60:8000";
const BASE_NO_SLASH = RAW_BASE.replace(/\/+$/, "");
const BOOKINGS_ENDPOINT = /\/api(\/|$)/i.test(BASE_NO_SLASH)
  ? `${BASE_NO_SLASH}/villas/bookings/`
  : `${BASE_NO_SLASH}/api/villas/bookings/`;

const getAccessToken = (): string | null => {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
};

const STATUS_OPTIONS = ["pending", "rejected", "completed", "cancelled", "approved"];

function capitalize(s?: string) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Return tailwind classes to style the <select> element based on status.
 * The class includes background and text colors, plus border to keep consistent sizing.
 */
function getSelectStatusClass(status?: string) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "rejected":
      return "bg-red-100 text-red-800 border-red-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "cancelled":
      return "bg-yellow-50 text-yellow-800 border-yellow-200";
    case "approved":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export default function BookingManagement(): JSX.Element {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // track which booking(s) are being updated for status (id -> boolean)
  const [statusUpdating, setStatusUpdating] = useState<Record<number, boolean>>({});

  const redirectToLogin = () => {
    const next = window.location.pathname + window.location.search;
    window.location.href = `/login?next=${encodeURIComponent(next)}`;
  };

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: any = { Accept: "application/json" };
      const token = getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(BOOKINGS_ENDPOINT, { headers });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        // If unauthorized, redirect to login
        if (res.status === 401 || res.status === 403) {
          setError("Authentication required. Redirecting to login...");
          redirectToLogin();
          return;
        }
        throw new Error(`Fetch error ${res.status} ${text}`);
      }

      const data = await res.json();
      // Accept paginated response with results or plain array
      const list: Booking[] = Array.isArray(data)
        ? data
        : data?.results ?? data?.bookings ?? [];
      setBookings(list);
    } catch (err: any) {
      console.error("Failed to fetch bookings:", err);
      setError(err?.message ?? "Failed to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search/filter (uses full_name, email, phone, check_in, check_out, property title)
  const filtered = bookings.filter((b) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    const idStr = String(b.id ?? "");
    const name = String(b.full_name ?? b.user_details?.name ?? "").toLowerCase();
    const email = String(b.email ?? b.user_details?.email ?? "").toLowerCase();
    const phone = String(b.phone ?? "").toLowerCase();
    const checkIn = String(b.check_in ?? "").toLowerCase();
    const checkOut = String(b.check_out ?? "").toLowerCase();
    const prop = String(b.property_details?.title ?? "").toLowerCase();

    return (
      idStr.includes(q) ||
      name.includes(q) ||
      email.includes(q) ||
      phone.includes(q) ||
      checkIn.includes(q) ||
      checkOut.includes(q) ||
      prop.includes(q)
    );
  });

  const handleDelete = async (id: number) => {
    const b = bookings.find((x) => x.id === id);
    if (!b) return;

    const confirmation = await Swal.fire({
      title: "Are you sure?",
      html: `<div>Delete booking for <strong>${b.full_name ?? "Guest"}</strong><br/><span class="text-sm text-gray-500">${b.email ?? ""}</span></div>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      reverseButtons: true,
    });

    if (!confirmation.isConfirmed) return;

    setDeletingId(id);
    const prev = bookings.slice();
    setBookings((prevList) => prevList.filter((x) => x.id !== id));

    try {
      const headers: any = { Accept: "application/json" };
      const token = getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;

      const deleteUrl = `${BOOKINGS_ENDPOINT}${id}/`;
      const res = await fetch(deleteUrl, {
        method: "DELETE",
        headers,
      });

      if (res.status === 204 || res.ok) {
        await Swal.fire({
          title: "Deleted!",
          text: "The booking has been deleted.",
          icon: "success",
          timer: 1400,
          showConfirmButton: false,
        });
      } else {
        const txt = await res.text().catch(() => "");
        throw new Error(`Delete failed ${res.status} ${txt}`);
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      setBookings(prev);
      await Swal.fire({
        title: "Error",
        text: "Failed to delete booking. See console for details.",
        icon: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Change status handler (PATCH)
  const handleChangeStatus = async (id: number, newStatus: string) => {
    const booking = bookings.find((b) => b.id === id);
    if (!booking) return;

    // confirm quick prompt
    const { isConfirmed } = await Swal.fire({
      title: "Change status?",
      html: `<div>Set booking for <strong>${booking.full_name ?? "Guest"}</strong> to <strong>${capitalize(newStatus)}</strong>?</div>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, change it",
      cancelButtonText: "Cancel",
    });

    if (!isConfirmed) return;

    // optimistic UI update
    const prevBookings = bookings.slice();
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b)));
    setStatusUpdating((s) => ({ ...s, [id]: true }));

    try {
      const token = getAccessToken();
      if (!token) {
        // require login to update
        await Swal.fire({
          title: "Login required",
          text: "You must be logged in to change status. Redirecting to login.",
          icon: "warning",
        });
        setBookings(prevBookings);
        redirectToLogin();
        return;
      }

      const headers: any = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      // FIXED: use BOOKINGS_ENDPOINT (already normalized) to avoid double /api
      const patchUrl = `${BOOKINGS_ENDPOINT}${id}/`;

      const res = await fetch(patchUrl, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      let body: any = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }

      if (!res.ok) {
        // revert on error
        setBookings(prevBookings);

        // If unauthorized, redirect to login
        if (res.status === 401 || res.status === 403) {
          await Swal.fire({
            title: "Authentication required",
            text: "Please log in to change booking status.",
            icon: "warning",
          });
          redirectToLogin();
          return;
        }

        const txt = body && (body.detail || JSON.stringify(body)) ? (body.detail || JSON.stringify(body)) : `HTTP ${res.status}`;
        throw new Error(txt);
      }

      // success feedback
      await Swal.fire({
        title: "Updated",
        text: `Status changed to ${capitalize(newStatus)}.`,
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });

      // if server returned updated booking, merge it
      if (body && body.id) {
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...body } : b)));
      }
    } catch (err: any) {
      console.error("Status update error:", err);
      await Swal.fire({
        title: "Error",
        text: "This date already  booking approved",
        icon: "error",
      });
    } finally {
      setStatusUpdating((s) => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div>
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold mb-1">Booking management</h1>
          <p className="text-sm text-gray-600 mb-4 mt-4">Total booking: {bookings.length}</p>

          <input
            type="search"
            placeholder="Search by name, email, phone, date or property"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-96 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
          />
        </div>

        {error && (
          <div className="mb-4">
            <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded">
              <strong className="block">Failed to load bookings</strong>
              <div className="text-sm mt-1">{error}</div>
            </div>
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden lg:block bg-white border rounded-lg shadow-sm overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3">No</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Check In</th>
                <th className="px-6 py-3">Check Out</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-6 text-center text-gray-500">
                    Loading bookings...
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((b, idx) => (
                  <tr key={b.id ?? idx} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4">{idx + 1}</td>
                    <td className="px-6 py-4">{b.full_name ?? b.user_details?.name}</td>
                    <td className="px-6 py-4 text-gray-600">{b.email ?? b.user_details?.email}</td>
                    <td className="px-6 py-4">{b.phone}</td>
                    <td className="px-6 py-4">{b.check_in}</td>
                    <td className="px-6 py-4">{b.check_out}</td>

                    {/* Status dropdown (desktop) - colored select showing current status color */}
                    <td className="px-6 py-4">
                      <select
                        value={b.status ?? "pending"}
                        onChange={(e) => handleChangeStatus(b.id, e.target.value)}
                        disabled={!!statusUpdating[b.id]}
                        className={`border rounded px-2 py-1 ${getSelectStatusClass(b.status)}`}
                        title="Change booking status"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {capitalize(s)}
                          </option>
                        ))}
                      </select>
                      {statusUpdating[b.id] && <span className="ml-2 text-xs text-gray-500">Updating…</span>}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-md text-white text-sm"
                        style={{
                          backgroundColor: deletingId === b.id ? "#9B1C1C" : "#DC2626",
                        }}
                        disabled={deletingId === b.id}
                        title="Delete booking"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-6 text-center text-gray-500">
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden mt-6 space-y-4">
          {loading && <div className="text-center text-gray-500">Loading bookings...</div>}

          {!loading &&
            filtered.map((b, idx) => (
              <div key={b.id ?? idx} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">
                      {idx + 1}. {b.full_name ?? b.user_details?.name}
                    </div>
                    <div className="text-xs text-gray-600">{b.email ?? b.user_details?.email}</div>
                    <div className="text-xs text-gray-600">{b.phone}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Check In</div>
                    <div className="text-sm">{b.check_in}</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Check Out</div>
                    <div>{b.check_out}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">Property</div>
                    <div>{b.property_details?.title ?? "—"}</div>
                  </div>

                  <div className="col-span-2 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500">Status</div>

                        <select
                          value={b.status ?? "pending"}
                          onChange={(e) => handleChangeStatus(b.id, e.target.value)}
                          disabled={!!statusUpdating[b.id]}
                          className={`w-full border rounded px-2 py-1 ${getSelectStatusClass(b.status)}`}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {capitalize(s)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-32">
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-md text-white text-sm"
                          style={{
                            backgroundColor: deletingId === b.id ? "#9B1C1C" : "#DC2626",
                          }}
                          disabled={deletingId === b.id}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {statusUpdating[b.id] && <div className="mt-2 text-xs text-gray-500">Updating…</div>}
                  </div>
                </div>
              </div>
            ))}

          {!loading && filtered.length === 0 && (
            <div className="text-center text-sm text-gray-500">No bookings found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
