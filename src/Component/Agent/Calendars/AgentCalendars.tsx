// // File: AgentCalendar.tsx
// import React, { useEffect, useMemo, useState } from "react";

// /**
//  * AgentCalendar.tsx
//  *
//  * Fetches:
//  *  https://api.eastmondvillas.com/api/villas/agent/bookings/monthly/?month=<1-12>&year=<yyyy>
//  *
//  * Behavior:
//  * - Builds rows from response.data (property_id -> id, property_title -> name)
//  * - Booked days (inside any booking range) = YELLOW (disabled)
//  * - Available days = GREEN (clickable if you later want to add booking)
//  * - Month & Year selectors refetch data
//  *
//  * NOTE:
//  * - check_out is treated EXCLUSIVE (booking covers check_in .. day before check_out).
//  *   To treat check_out inclusive, change the while condition in parseBookingDays.
//  */

// type BookingItem = {
//   booking_id: number;
//   full_name: string;
//   check_in: string; // "YYYY-MM-DD"
//   check_out: string; // "YYYY-MM-DD"
//   status?: string;
//   total_price?: string;
// };

// type BookingResponseItem = {
//   property_id: number;
//   property_title: string;
//   city?: string;
//   total_bookings_this_month?: number;
//   bookings: BookingItem[];
// };

// type BookingResponse = {
//   agent: number;
//   month: number;
//   year: number;
//   properties_count: number;
//   data: BookingResponseItem[];
// };

// type Property = {
//   id: number;
//   name: string;
//   city?: string;
//   total_bookings_this_month?: number;
// };

// const API_BASE = "https://api.eastmondvillas.com"; // your base
// const MONTHLY_PATH = "/api/villas/agent/bookings/monthly/"; // appended with ?month=&year=

// function monthNames() {
//   return [
//     "January","February","March","April","May","June",
//     "July","August","September","October","November","December"
//   ];
// }

// export default function AgentCalendar() {
//   const today = new Date();
//   // default: current month/year
//   const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
//   const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

//   const [properties, setProperties] = useState<Property[]>([]);
//   // map key: `${propertyId}-${year}-${month}`
//   const [bookingsMap, setBookingsMap] = useState<Map<string, Set<number>>>(() => new Map());
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // days in selected month
//   const daysInMonth = useMemo(
//     () => new Date(selectedYear, selectedMonth, 0).getDate(),
//     [selectedMonth, selectedYear]
//   );
//   const daysArray = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

//   function mapKey(propertyId: number, year = selectedYear, month = selectedMonth) {
//     return `${propertyId}-${year}-${month}`;
//   }

//   // parse booking range into list of day numbers inside selected month/year
//   function parseBookingDays(checkInIso: string, checkOutIso: string, month: number, year: number) {
//     // check_out exclusive
//     const days: number[] = [];
//     const start = new Date(checkInIso + "T00:00:00");
//     const end = new Date(checkOutIso + "T00:00:00"); // exclusive
//     const d = new Date(start);
//     while (d < end) {
//       if (d.getFullYear() === year && d.getMonth() + 1 === month) {
//         days.push(d.getDate());
//       }
//       d.setDate(d.getDate() + 1);
//     }
//     return days;
//   }

//   async function fetchMonthly(month: number, year: number) {
//     setLoading(true);
//     setError(null);
//     try {
//       const url = `${API_BASE}${MONTHLY_PATH}?month=${month}&year=${year}`;
//       const resp = await fetch(url);
//       if (!resp.ok) {
//         throw new Error(`API returned ${resp.status}`);
//       }
//       const data = (await resp.json()) as BookingResponse;

//       // build property list from response.data
//       const props: Property[] = Array.isArray(data.data)
//         ? data.data.map((it) => ({
//             id: it.property_id,
//             name: it.property_title,
//             city: it.city,
//             total_bookings_this_month: it.total_bookings_this_month,
//           }))
//         : [];
//       setProperties(props);

//       // build bookings map
//       const map = new Map<string, Set<number>>();
//       // ensure keys exist for all returned properties
//       props.forEach((p) => map.set(mapKey(p.id, data.year ?? year, data.month ?? month), new Set()));

//       (data.data || []).forEach((item) => {
//         const key = mapKey(item.property_id, data.year ?? year, data.month ?? month);
//         const setDays = new Set<number>(map.get(key) ? Array.from(map.get(key)!) : []);
//         (item.bookings || []).forEach((b) => {
//           try {
//             const days = parseBookingDays(b.check_in, b.check_out, data.month ?? month, data.year ?? year);
//             days.forEach((d) => setDays.add(d));
//           } catch (err) {
//             // ignore malformed date for single booking
//             console.warn("parse booking error", err, b);
//           }
//         });
//         map.set(key, setDays);
//       });

//       setBookingsMap(map);
//     } catch (err: any) {
//       console.error(err);
//       setError(err?.message ?? "Failed to fetch bookings");
//       setProperties([]);
//       setBookingsMap(new Map());
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     fetchMonthly(selectedMonth, selectedYear);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedMonth, selectedYear]);

//   function isBooked(propertyId: number, day: number) {
//     const key = mapKey(propertyId);
//     const s = bookingsMap.get(key);
//     return s ? s.has(day) : false;
//   }

//   // UI: keep simple, tailwind classes for visuals
//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       <div className="flex items-center justify-between mb-4">
//         <div>
//           <h1 className="text-xl font-semibold text-gray-800">Agent Calendar</h1>
//           <p className="text-sm text-gray-500">Booked = yellow, Available = green</p>
//         </div>

//         <div className="flex items-center gap-3">
//           <label className="text-sm text-gray-600">Month</label>
//           <select
//             value={selectedMonth}
//             onChange={(e) => setSelectedMonth(Number(e.target.value))}
//             className="px-2 py-1 border rounded"
//           >
//             {monthNames().map((mn, idx) => (
//               <option key={mn} value={idx + 1}>{mn}</option>
//             ))}
//           </select>

//           <label className="text-sm text-gray-600">Year</label>
//           <select
//             value={selectedYear}
//             onChange={(e) => setSelectedYear(Number(e.target.value))}
//             className="px-2 py-1 border rounded"
//           >
//             {/* show a reasonable year range: current-2 .. current+2 */}
//             {(() => {
//               const nowY = new Date().getFullYear();
//               const arr = [];
//               for (let y = nowY - 2; y <= nowY + 2; y++) arr.push(y);
//               return arr;
//             })().map((y) => <option key={y} value={y}>{y}</option>)}
//           </select>

//           <button
//             onClick={() => fetchMonthly(selectedMonth, selectedYear)}
//             className="px-3 py-1 rounded-md bg-white border text-sm shadow-sm"
//           >
//             Refresh
//           </button>
//         </div>
//       </div>

//       {loading && <div className="text-sm text-gray-500 mb-3">Loading bookings…</div>}
//       {error && <div className="text-sm text-red-600 mb-3">Error: {error}</div>}

//       <div className="space-y-4">
//         {properties.length === 0 && !loading ? (
//           <div className="text-sm text-gray-500">No properties found for this month/year.</div>
//         ) : null}

//         {properties.map((p) => (
//           <div key={p.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <div className="text-sm font-medium text-gray-800">{p.name}</div>
//                 {p.city && <div className="text-xs text-gray-500">{p.city}</div>}
//                 <div className="text-xs text-gray-400 mt-1">Total bookings: {p.total_bookings_this_month ?? 0}</div>
//               </div>
//               <div className="text-xs text-gray-500">{monthNames()[selectedMonth - 1]} {selectedYear}</div>
//             </div>

//             <div className="mt-3 overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: "touch" }}>
//               <div className="flex items-center gap-2 py-1">
//                 {daysArray.map((d) => {
//                   const booked = isBooked(p.id, d);
//                   return (
//                     <div
//                       key={`${p.id}-${d}`}
//                       className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border text-sm font-medium
//                         ${booked ? "bg-yellow-100 border-yellow-200 text-yellow-800" : "bg-green-50 border-green-100 text-green-700"}
//                       `}
//                       title={booked ? `Booked: ${d}/${selectedMonth}/${selectedYear}` : `Available: ${d}/${selectedMonth}/${selectedYear}`}
//                     >
//                       {d}
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       <style>{`
//         .no-scrollbar::-webkit-scrollbar { height: 8px; display: none; }
//         .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
//       `}</style>
//     </div>
//   );
// }

// File: Calendars.tsx
import React, { useEffect, useMemo, useState } from 'react';

/**
 * Calendars.tsx
 * - Fetches agent monthly bookings from:
 *    https://api.eastmondvillas.com/api/villas/agent/bookings/monthly/?month=<m>&year=<y>
 * - Renders properties from response.data
 * - Booked days: YELLOW (disabled)
 * - Available days: GREEN (clickable)
 *
 * Note: check_out is treated EXCLUSIVE (booking covers check_in .. day before check_out).
 */

type BookingItem = {
  booking_id: number;
  full_name: string;
  check_in: string; // "YYYY-MM-DD"
  check_out: string; // "YYYY-MM-DD"
  status?: string;
  total_price?: string;
};

type BookingResponseItem = {
  property_id: number;
  property_title: string;
  city?: string;
  total_bookings_this_month?: number;
  bookings: BookingItem[];
};

type BookingResponse = {
  agent: number;
  month: number;
  year: number;
  properties_count: number;
  data: BookingResponseItem[];
};

type Property = {
  id: number;
  name: string;
  city?: string;
  total_bookings_this_month?: number;
};

const API_BASE = 'https://api.eastmondvillas.com';
const MONTHLY_PATH = '/api/villas/agent/bookings/monthly/'; // will append ?month=&year=
const POST_BOOKING_PATH = '/api/bookings'; // POST target for booking (kept optimistic)

function monthNames() {
  return [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
}

export default function Calendars() {
  // default selection to December 2025 as you provided
  const [selectedMonth, setSelectedMonth] = useState<number>(12);
  const [selectedYear, setSelectedYear] = useState<number>(2025);

  const [properties, setProperties] = useState<Property[]>([]);
  // bookings keyed by `${propertyId}-${year}-${month}` => Set<number>
  const [bookingsMap, setBookingsMap] = useState<Map<string, Set<number>>>(
    () => new Map()
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState<Record<string, boolean>>({});

  // year range for selector: current-2 .. current+2
  const now = new Date();
  const startYear = now.getFullYear() - 2;
  const endYear = now.getFullYear() + 2;
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = startYear; y <= endYear; y++) arr.push(y);
    return arr;
  }, [startYear, endYear]);

  // days in selected month
  const daysInMonth = useMemo(
    () => new Date(selectedYear, selectedMonth, 0).getDate(),
    [selectedMonth, selectedYear]
  );
  const daysArray = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  function mapKey(
    propertyId: number,
    year = selectedYear,
    month = selectedMonth
  ) {
    return `${propertyId}-${year}-${month}`;
  }

  // parse booking range into day numbers within selected month/year
  function parseBookingDays(
    checkInIso: string,
    checkOutIso: string,
    month: number,
    year: number
  ) {
    // check_out exclusive
    const result: number[] = [];
    const start = new Date(checkInIso + 'T00:00:00');
    const end = new Date(checkOutIso + 'T00:00:00'); // exclusive
    const d = new Date(start);
    while (d < end) {
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        result.push(d.getDate());
      }
      d.setDate(d.getDate() + 1);
    }
    return result;
  }

  // fetch monthly endpoint and populate properties + bookingsMap
  async function fetchMonthly(month: number, year: number) {
    setLoading(true);
    setError(null);

    const url = `${API_BASE}${MONTHLY_PATH}?month=${month}&year=${year}`;

    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`API responded ${resp.status}`);
      }
      const data = (await resp.json()) as BookingResponse;

      // build properties list from response.data
      const props: Property[] = Array.isArray(data.data)
        ? data.data.map((it) => ({
            id: it.property_id,
            name: it.property_title,
            city: it.city,
            total_bookings_this_month: it.total_bookings_this_month,
          }))
        : [];

      setProperties(props);

      // build bookings map
      const nextMap = new Map<string, Set<number>>();
      props.forEach((p) =>
        nextMap.set(
          mapKey(p.id, data.year ?? year, data.month ?? month),
          new Set()
        )
      );

      (data.data || []).forEach((item) => {
        const key = mapKey(
          item.property_id,
          data.year ?? year,
          data.month ?? month
        );
        const existing = new Set<number>(
          nextMap.get(key) ? Array.from(nextMap.get(key)!) : []
        );
        (item.bookings || []).forEach((b) => {
          try {
            const days = parseBookingDays(
              b.check_in,
              b.check_out,
              data.month ?? month,
              data.year ?? year
            );
            days.forEach((day) => existing.add(day));
          } catch (err) {
            console.warn('parse booking failed', err, b);
          }
        });
        nextMap.set(key, existing);
      });

      setBookingsMap(nextMap);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Unable to fetch bookings');
      setProperties([]);
      setBookingsMap(new Map());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMonthly(selectedMonth, selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  // helper to check booked
  function isBooked(propertyId: number, day: number) {
    const s = bookingsMap.get(mapKey(propertyId));
    return s ? s.has(day) : false;
  }

  // optimistic booking (kept in case you want click-to-book)
  async function handleBook(propertyId: number, day: number) {
    const key = mapKey(propertyId);
    if (isBooked(propertyId, day)) {
      alert('Already booked.');
      return;
    }
    const postKey = `${key}-${day}`;
    if (posting[postKey]) return;
    setPosting((p) => ({ ...p, [postKey]: true }));

    // optimistic
    setBookingsMap((prev) => {
      const next = new Map(prev);
      const setFor = new Set(next.get(key) ? Array.from(next.get(key)!) : []);
      setFor.add(day);
      next.set(key, setFor);
      return next;
    });

    try {
      const resp = await fetch(`${API_BASE}${POST_BOOKING_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          day,
          agentId: 'agent-unknown',
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
        setBookingsMap((prev) => {
          const next = new Map(prev);
          next.set(key, new Set(json.bookedDays));
          return next;
        });
      } else if (json?.success) {
        // server accepted but didn't return list — leave optimistic
      } else {
        throw new Error(json?.message || 'Booking failed');
      }
    } catch (err: any) {
      // rollback
      setBookingsMap((prev) => {
        const next = new Map(prev);
        const cur = new Set(next.get(key) ? Array.from(next.get(key)!) : []);
        cur.delete(day);
        next.set(key, cur);
        return next;
      });
      alert(err?.message || 'Booking failed');
    } finally {
      setPosting((p) => {
        const copy = { ...p };
        delete copy[postKey];
        return copy;
      });
    }
  }

  // small helper to render "Booked: ..." text
  function bookedDaysText(propertyId: number) {
    const s = bookingsMap.get(mapKey(propertyId));
    if (!s || s.size === 0) return 'No bookings';
    const arr = Array.from(s).sort((a, b) => a - b);
    return `Booked: ${arr.join(', ')}`;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Agent Calendars
          </h2>
          <p className="text-sm text-gray-500">
            Booked = yellow, Available = green
          </p>
        </div>

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
            onClick={() => fetchMonthly(selectedMonth, selectedYear)}
            className="px-3 py-1 rounded-md bg-white border text-sm shadow-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-gray-500 mb-3">Loading bookings…</div>
      )}
      {error && <div className="text-sm text-red-600 mb-3">Error: {error}</div>}

      <div
        className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-auto"
        style={{ maxHeight: '72vh' }}
      >
        <div className="p-4 space-y-3">
          {properties.length === 0 && !loading ? (
            <div className="text-sm text-gray-500">
              No properties found for the selected month/year.
            </div>
          ) : null}

          {properties.map((prop) => {
            return (
              <div
                key={prop.id}
                className="flex items-start gap-4 py-2 px-2 rounded-md hover:bg-gray-50"
              >
                {/* Left name + details */}
                <div className="w-56 min-w-[12rem] pr-2">
                  <div className="text-sm text-gray-700 font-medium">
                    {prop.name}
                  </div>
                  {prop.city && (
                    <div className="text-xs text-gray-500 mt-1">
                      {prop.city}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {bookedDaysText(prop.id)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Month: {monthNames()[selectedMonth - 1]} {selectedYear}
                  </div>
                </div>

                {/* Right: horizontally scrollable days */}
                <div className="flex-1">
                  <div
                    className="overflow-x-auto no-scrollbar"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                  >
                    <div className="flex items-center gap-2 py-1">
                      {daysArray.map((d) => {
                        const booked = isBooked(prop.id, d);
                        return (
                          <button
                            key={`${prop.id}-${d}`}
                            onClick={() => {
                              if (booked) {
                                alert(
                                  `Property "${prop.name}" is already booked on ${d}/${selectedMonth}/${selectedYear}.`
                                );
                                return;
                              }
                              handleBook(prop.id, d);
                            }}
                            disabled={booked}
                            className={`flex-shrink-0 flex items-center justify-center select-none transition-all
                              ${booked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            style={{
                              minWidth: 44,
                              minHeight: 44,
                              maxWidth: 56,
                              maxHeight: 56,
                            }}
                            title={
                              booked
                                ? 'Booked'
                                : `Click to book ${d}/${selectedMonth}/${selectedYear}`
                            }
                            aria-pressed={!booked}
                          >
                            <div
                              className={`w-full h-full flex items-center justify-center rounded-lg border text-sm font-semibold
                                ${booked ? 'bg-yellow-100 border-yellow-200 text-yellow-800' : 'bg-green-50 border-green-100 text-green-700'}`}
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
        Booked days are yellow; available days are green. Click a green day to
        book (optimistic POST).
      </p>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { height: 8px; display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
