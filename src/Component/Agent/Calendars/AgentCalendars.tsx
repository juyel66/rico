// File: Calendars.tsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * Calendars.tsx
 * - Shows properties rows with days for selected month/year
 * - Month & Year selector refetch data for that month/year
 * - Bookable days are green (clickable), booked days are red (disabled)
 * - On booking, POST { propertyId, day, agentId, month, year } and update UI
 *
 * Notes:
 * - Backend endpoints:
 *    GET  /api/bookings?propertyId=<id>&month=<1-12>&year=<yyyy>
 *    POST /api/bookings  (body as JSON above)
 * - This component keeps bookings keyed by `${propertyId}-${year}-${month}`
 */

type BookingResponse = {
  propertyId: number;
  month: number;
  year: number;
  bookedDays: number[]; // 1..daysInMonth
};

type Property = {
  id: number;
  name: string;
};

type CalendarsProps = {
  properties?: Property[];
  agentId?: number | string;
  apiBaseUrl?: string;
  startYear?: number; // for year dropdown range
  endYear?: number;
};

const DEFAULT_PROPERTIES: Property[] = [
  { id: 1, name: "Luxury Waterfront Villa" },
  { id: 2, name: "Modern Urban Loft" },
  { id: 3, name: "Cozy Mountain Cabin" },
  { id: 4, name: "Chic City Apartment" },
  { id: 5, name: "Elegant Countryside" },
  { id: 6, name: "Charming Coastal" },
  { id: 7, name: "Modern Urban Loft 2" },
  { id: 8, name: "Rustic Mountain Cabin" },
  { id: 9, name: "Sleek Suburban Home" },
  { id: 10, name: "Artistic City Studio" },
  { id: 11, name: "Classic Victorian House" },
];

function monthNames() {
  return [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
}

export default function Calendars({
  properties = DEFAULT_PROPERTIES,
  agentId = "agent-unknown",
  apiBaseUrl = "/api",
  startYear,
  endYear,
}: CalendarsProps) {
  // date selection state
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1..12
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // bookings keyed by `${propertyId}-${year}-${month}` => Set<number>
  const [bookingsMap, setBookingsMap] = useState<Map<string, Set<number>>>(() => new Map());
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState<Record<string, boolean>>({});

  // year range for selector
  const start = startYear ?? now.getFullYear() - 2;
  const end = endYear ?? now.getFullYear() + 2;
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = start; y <= end; y++) arr.push(y);
    return arr;
  }, [start, end]);

  // days in the selected month
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate(); // month is 1..12
  }, [selectedMonth, selectedYear]);

  const daysArray = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  // helper key
  function mapKey(propertyId: number, y: number, m: number) {
    return `${propertyId}-${y}-${m}`;
  }

  // fetch bookings for a single property-month
  async function fetchBookingsForProperty(propertyId: number, month: number, year: number) {
    const key = mapKey(propertyId, year, month);
    setLoadingMap((p) => ({ ...p, [key]: true }));
    try {
      const resp = await fetch(`${apiBaseUrl}/bookings?propertyId=${propertyId}&month=${month}&year=${year}`);
      if (!resp.ok) {
        // if not found or backend doesn't support per-property, treat as empty
        console.warn(`Failed to fetch bookings for ${propertyId} ${month}/${year}: ${resp.status}`);
        setBookingsMap((prev) => {
          const next = new Map(prev);
          next.set(key, new Set());
          return next;
        });
        return;
      }
      const data = (await resp.json()) as BookingResponse;
      const setDays = new Set<number>(Array.isArray(data?.bookedDays) ? data.bookedDays : []);
      setBookingsMap((prev) => {
        const next = new Map(prev);
        next.set(key, setDays);
        return next;
      });
    } catch (err) {
      console.error(err);
      setError("Unable to load bookings");
      setBookingsMap((prev) => {
        const next = new Map(prev);
        next.set(key, new Set());
        return next;
      });
    } finally {
      setLoadingMap((p) => ({ ...p, [key]: false }));
    }
  }

  // fetch bookings for all properties for the selected month/year
  async function fetchAllForSelectedMonth() {
    setError(null);
    const promises = properties.map((p) => fetchBookingsForProperty(p.id, selectedMonth, selectedYear));
    await Promise.all(promises);
  }

  // fetch when month/year or properties change
  useEffect(() => {
    fetchAllForSelectedMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, apiBaseUrl, properties.length]);

  // helper check
  function isBooked(propertyId: number, day: number, month = selectedMonth, year = selectedYear) {
    const key = mapKey(propertyId, year, month);
    const s = bookingsMap.get(key);
    return s ? s.has(day) : false;
  }

  // booking function (optimistic)
  async function handleBook(propertyId: number, day: number) {
    const key = mapKey(propertyId, selectedYear, selectedMonth);
    if (isBooked(propertyId, day, selectedMonth, selectedYear)) {
      alert("Already booked.");
      return;
    }
    const postKey = `${key}-${day}`;
    if (posting[postKey]) return;
    setPosting((p) => ({ ...p, [postKey]: true }));

    // optimistic update
    setBookingsMap((prev) => {
      const next = new Map(prev);
      const setFor = new Set(next.get(key) ? Array.from(next.get(key)!) : []);
      setFor.add(day);
      next.set(key, setFor);
      return next;
    });

    try {
      const resp = await fetch(`${apiBaseUrl}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          day,
          agentId,
          month: selectedMonth,
          year: selectedYear,
        }),
      });
      if (!resp.ok) {
        let msg = `Booking failed (${resp.status})`;
        try {
          const j = await resp.json();
          if (j?.message) msg = j.message;
        } catch {}
        throw new Error(msg);
      }
      const json = await resp.json();
      if (json?.success && Array.isArray(json.bookedDays)) {
        // replace with server canonical data
        setBookingsMap((prev) => {
          const next = new Map(prev);
          next.set(key, new Set(json.bookedDays));
          return next;
        });
      } else if (json?.success) {
        // server accepted but didn't return list — leave optimistic
      } else {
        throw new Error(json?.message || "Booking failed");
      }
    } catch (err: any) {
      // rollback optimistic
      setBookingsMap((prev) => {
        const next = new Map(prev);
        const cur = new Set(next.get(key) ? Array.from(next.get(key)!) : []);
        cur.delete(day);
        next.set(key, cur);
        return next;
      });
      alert(err?.message || "Booking failed");
    } finally {
      setPosting((p) => {
        const copy = { ...p };
        delete copy[postKey];
        return copy;
      });
    }
  }

  // render booked days text for detail
  function bookedDaysText(propertyId: number) {
    const key = mapKey(propertyId, selectedYear, selectedMonth);
    const s = bookingsMap.get(key);
    if (!s || s.size === 0) return "No bookings";
    const arr = Array.from(s).sort((a, b) => a - b);
    return `Booked: ${arr.join(", ")}`;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Calendars</h2>
            <p className="text-sm text-gray-500">Select month & year, then click green days to book</p>
          </div>

          {/* selectors */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-2 py-1 border rounded"
            >
              {monthNames().map((mn, idx) => (
                <option key={mn} value={idx + 1}>
                  {mn}
                </option>
              ))}
            </select>

            <label className="text-sm text-gray-600">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-2 py-1 border rounded"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              onClick={fetchAllForSelectedMonth}
              className="px-3 py-1 rounded-md bg-white border text-sm shadow-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

        <div
          className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-auto"
          style={{ maxHeight: "72vh" }}
        >
          <div className="p-4 space-y-3">
            {properties.map((prop) => {
              const key = mapKey(prop.id, selectedYear, selectedMonth);
              const loading = !!loadingMap[key];
              return (
                <div key={prop.id} className="flex items-start gap-4 py-2 px-2 rounded-md hover:bg-gray-50">
                  {/* Left name + details */}
                  <div className="w-56 min-w-[12rem] pr-2">
                    <div className="text-sm text-gray-700 font-medium">{prop.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{bookedDaysText(prop.id)}</div>
                    <div className="text-xs text-gray-400 mt-1">Month: {monthNames()[selectedMonth - 1]} {selectedYear}</div>
                    {loading && <div className="text-xs text-gray-500 mt-1">Loading...</div>}
                  </div>

                  {/* Right: horizontally scrollable days */}
                  <div className="flex-1">
                    <div className="overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: "touch" }}>
                      <div className="flex items-center gap-2 py-1">
                        {daysArray.map((d) => {
                          const booked = isBooked(prop.id, d, selectedMonth, selectedYear);
                          return (
                            <button
                              key={`${prop.id}-${d}`}
                              onClick={() => {
                                if (booked) {
                                  alert(`Property "${prop.name}" is already booked on ${d}/${selectedMonth}/${selectedYear}.`);
                                  return;
                                }
                                handleBook(prop.id, d);
                              }}
                              disabled={booked}
                              className={`flex-shrink-0 flex items-center justify-center select-none transition-all
                                ${booked ? "cursor-not-allowed" : "cursor-pointer"}`}
                              style={{
                                minWidth: 44,
                                minHeight: 44,
                                maxWidth: 56,
                                maxHeight: 56,
                              }}
                              title={booked ? "Booked" : `Click to book ${d}/${selectedMonth}/${selectedYear}`}
                              aria-pressed={!booked}
                            >
                              <div
                                className={`w-full h-full flex items-center justify-center rounded-lg border text-sm font-semibold
                                  ${booked ? "bg-red-100 border-red-200 text-red-700" : "bg-green-50 border-green-100 text-green-700"}`}
                                style={{ padding: 6 }}
                              >
                                {d}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Click a green day to book. The booking is sent to the server (month/year included) and will update across clients after server confirms.
        </p>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { height: 8px; display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
