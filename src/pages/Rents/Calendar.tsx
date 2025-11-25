// import React, { useState, useCallback, useMemo } from 'react';

// // --- Utility Functions ---

// interface CalendarDay {
//   date: Date | null;
//   key: string;
//   isCurrentMonth: boolean;
// }

// /**
//  * Returns a list of all dates (including padding days) to display for a given month.
//  */
// const getCalendarDays = (date: Date): CalendarDay[] => {
//   const year = date.getFullYear();
//   const month = date.getMonth();
//   const firstDayOfMonth = new Date(year, month, 1);
//   const daysInMonth = new Date(year, month + 1, 0).getDate();
//   const startDayOfWeek = firstDayOfMonth.getDay();

//   const calendarDays: CalendarDay[] = [];

//   // Padding days
//   for (let i = 0; i < startDayOfWeek; i++) {
//     calendarDays.push({
//       date: null,
//       key: `pad-start-${i}`,
//       isCurrentMonth: false,
//     });
//   }

//   // Days of current month
//   for (let day = 1; day <= daysInMonth; day++) {
//     calendarDays.push({
//       date: new Date(year, month, day),
//       key: `${year}-${month + 1}-${day}`,
//       isCurrentMonth: true,
//     });
//   }

//   // Trailing padding
//   const totalSlots = calendarDays.length;
//   const neededTrailingPadding = (7 - (totalSlots % 7)) % 7;
//   for (let i = 0; i < neededTrailingPadding; i++) {
//     calendarDays.push({
//       date: null,
//       key: `pad-end-${i}`,
//       isCurrentMonth: false,
//     });
//   }

//   return calendarDays;
// };

// /**
//  * Mocks availability status.
//  */
// const getDayStatus = (date: Date): 'available' | 'booked' => {
//   const day = date.getDate();
//   const month = date.getMonth();
//   const year = date.getFullYear();

//   if (year === 2026) {
//     if (month === 3 || month === 4) {
//       if ([1, 2, 3, 7, 24].includes(day)) return 'booked';
//     }
//   }
//   return 'available';
// };

// // --- Calendar Sub-Component ---

// interface CalendarMonthProps {
//   monthDate: Date;
// }

// const CalendarMonth: React.FC<CalendarMonthProps> = ({ monthDate }) => {
//   const days = getCalendarDays(monthDate);
//   const monthName = monthDate.toLocaleString('en-US', {
//     month: 'long',
//     year: 'numeric',
//   });
//   const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

//   return (
//     <div className="p-6 bg-white rounded-xl border-2 flex-1 min-w-[300px]">
//       <h2 className="text-xl font-bold mb-4 text-gray-800">{monthName}</h2>

//       {/* Weekday Headers */}
//       <div className="grid grid-cols-7 gap-1 text-sm font-semibold text-gray-500 mb-2">
//         {weekDays.map((day) => (
//           <div key={day} className="text-center">
//             {day}
//           </div>
//         ))}
//       </div>

//       {/* Dates Grid */}
//       <div className="grid grid-cols-7 gap-1">
//         {days.map(({ date, key, isCurrentMonth }) => {
//           if (!isCurrentMonth || !date) {
//             return <div key={key} className="h-10 w-10"></div>;
//           }

//           const status = getDayStatus(date);
//           const isBooked = status === 'booked';
//           const dayNumber = date.getDate();

//           const baseClasses =
//             'flex items-center justify-center h-10 w-10 text-sm font-medium rounded-full cursor-pointer transition-colors duration-150';
//           const statusClasses = isBooked
//             ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
//             : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300';

//           return (
//             <div key={key} className="flex items-center justify-center py-1">
//               <button
//                 className={`${baseClasses} ${statusClasses}`}
//                 title={
//                   isBooked
//                     ? `Booked on ${dayNumber}`
//                     : `Available on ${dayNumber}`
//                 }
//                 onClick={() =>
//                   alert(
//                     `You clicked on ${date.toDateString()}. Status: ${
//                       isBooked ? 'Booked' : 'Available'
//                     }`
//                   )
//                 }
//               >
//                 {dayNumber}
//               </button>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// // --- Main Component ---

// const Calendar: React.FC = () => {
//   const [startMonthDate, setStartMonthDate] = useState(new Date(2026, 3, 1));

//   const secondMonthDate = useMemo(
//     () =>
//       new Date(startMonthDate.getFullYear(), startMonthDate.getMonth() + 1, 1),
//     [startMonthDate]
//   );

//   const handlePrev = useCallback(() => {
//     setStartMonthDate(
//       (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
//     );
//   }, []);

//   const handleNext = useCallback(() => {
//     setStartMonthDate(
//       (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
//     );
//   }, []);

//   const navButtonClasses =
//     'flex items-center space-x-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-150 p-2 rounded-lg';

//   const LegendItem: React.FC<{ color: string; text: string }> = ({
//     color,
//     text,
//   }) => (
//     <div className="flex items-center space-x-2 text-sm text-gray-700">
//       <span className={`w-3 h-3 rounded-full ${color}`}></span>
//       <span>{text}</span>
//     </div>
//   );

//   return (
//     <div className="py-20">
//       <div className="text-center">
//         <p className="text-4xl font-semibold mb-10 text-gray-800">
//           Availability Calendar
//         </p>
//         <p>
//           View availability below and take a step closer to paradise. Green
//           dates are available for booking, while red dates are already reserved.
//         </p>
//       </div>

//       <div className="mt-10 font-['Inter']">
//         <div className="w-full">
//           {/* Header & Navigation */}
//           <div className="flex justify-between items-center mb-6">
//             <button
//               className={`${navButtonClasses} text-gray-600`}
//               onClick={handlePrev}
//             >
//               <svg
//                 className="w-4 h-4 text-gray-600"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M10 19l-7-7m0 0l7-7m-7 7h18"
//                 />
//               </svg>
//               <span className="text-gray-600">Previous</span>
//             </button>

//             <div className="flex space-x-4">
//               <LegendItem color="bg-green-500" text="Available" />
//               <LegendItem color="bg-red-500" text="Booked" />
//             </div>

//             <button
//               className={`${navButtonClasses} text-gray-600`}
//               onClick={handleNext}
//             >
//               <span className="text-gray-600">Next</span>
//               <svg
//                 className="w-4 h-4 text-gray-600"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M14 5l7 7m0 0l-7 7m7-7H3"
//                 />
//               </svg>
//             </button>
//           </div>

//           {/* Two-Month Calendar */}
//           <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6">
//             <CalendarMonth monthDate={startMonthDate} />
//             <CalendarMonth monthDate={secondMonthDate} />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Calendar;













// src/components/PropertyCalendar.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";

type BookingRange = { start: string; end: string }; // ISO date strings "YYYY-MM-DD"

const API_BASE = import.meta.env.VITE_API_BASE || "http://10.10.13.60:8000/api";

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}
function parseISO(s: string) {
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, m - 1, day);
}
function eachDateStringBetween(startISO: string, endISO: string) {
  const out: string[] = [];
  let cur = parseISO(startISO);
  const end = parseISO(endISO);
  while (cur <= end) {
    out.push(toISO(cur));
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
  }
  return out;
}

interface CalendarDay {
  date: Date | null;
  key: string;
  isCurrentMonth: boolean;
}
const getCalendarDays = (date: Date): CalendarDay[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = firstDayOfMonth.getDay();

  const calendarDays: CalendarDay[] = [];
  for (let i = 0; i < startDayOfWeek; i++) calendarDays.push({ date: null, key: `pad-start-${i}`, isCurrentMonth: false });
  for (let day = 1; day <= daysInMonth; day++) calendarDays.push({
    date: new Date(year, month, day),
    key: `${year}-${month + 1}-${day}`,
    isCurrentMonth: true,
  });
  const totalSlots = calendarDays.length;
  const neededTrailingPadding = (7 - (totalSlots % 7)) % 7;
  for (let i = 0; i < neededTrailingPadding; i++) calendarDays.push({ date: null, key: `pad-end-${i}`, isCurrentMonth: false });
  return calendarDays;
};

async function fetchAvailabilityFromApi(villaId: number, month: number, year: number) {
  const url = new URL(`${API_BASE}/villas/properties/${villaId}/availability/`);
  url.searchParams.set("month", String(month));
  url.searchParams.set("year", String(year));
  const res = await fetch(url.toString());
  if (!res.ok) {
    const txt = await res.text().catch(() => null);
    throw new Error(txt || `HTTP ${res.status}`);
  }
  const data: BookingRange[] = await res.json();
  return data;
}

interface Props { villaId?: number; initialDate?: Date; }

const Calendar: React.FC<Props> = ({ villaId, initialDate }) => {
  // Guard: require villaId
  const [missingVillaId, setMissingVillaId] = useState(false);

  useEffect(() => {
    if (villaId === undefined || villaId === null) {
      console.error("[PropertyCalendar] villaId is required");
      setMissingVillaId(true);
    } else {
      setMissingVillaId(false);
    }
  }, [villaId]);

  const [startMonthDate, setStartMonthDate] = useState<Date>(
    initialDate ? new Date(initialDate.getFullYear(), initialDate.getMonth(), 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const secondMonthDate = useMemo(() => new Date(startMonthDate.getFullYear(), startMonthDate.getMonth() + 1, 1), [startMonthDate]);

  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const monthsToFetch = useMemo(() => [
    { month: startMonthDate.getMonth() + 1, year: startMonthDate.getFullYear() },
    { month: secondMonthDate.getMonth() + 1, year: secondMonthDate.getFullYear() },
  ], [startMonthDate, secondMonthDate]);

  // Fetch availability only when villaId is present
  useEffect(() => {
    if (villaId === undefined || villaId === null) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const sets: string[] = [];
        for (const m of monthsToFetch) {
          const ranges = await fetchAvailabilityFromApi(villaId, m.month, m.year);
          for (const r of ranges) {
            const dates = eachDateStringBetween(r.start, r.end);
            sets.push(...dates);
          }
        }
        if (!mounted) return;
        setBookedDates(new Set(sets));
      } catch (err: any) {
        console.error("Availability fetch error:", err);
        if (mounted) setFetchError(String(err?.detail ?? err?.message ?? err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [villaId, monthsToFetch]);

  const handlePrev = () => setStartMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNext = () => setStartMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const isDateBooked = useCallback((d: Date | null) => {
    if (!d) return false;
    return bookedDates.has(toISO(d));
  }, [bookedDates]);

  if (missingVillaId) {
    return (
      <div className="p-6 bg-white border rounded text-red-600">
        Villa ID is required for the calendar to work. Pass <strong>villaId</strong> to PropertyCalendar.
      </div>
    );
  }

  const CalendarMonth: React.FC<{ monthDate: Date }> = ({ monthDate }) => {
    const days = getCalendarDays(monthDate);
    const monthName = monthDate.toLocaleString("en-US", { month: "long", year: "numeric" });

    return (
      <div className="p-6 bg-white rounded-xl border-2 flex-1 min-w-[280px] relative">
        <h3 className="text-lg font-semibold mb-3">{monthName}</h3>
        <div className="grid grid-cols-7 gap-1 text-xs font-semibold text-gray-500 mb-2">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(w => <div key={w} className="text-center">{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map(({ date, key, isCurrentMonth }) => {
            if (!isCurrentMonth || !date) return <div key={key} className="h-10 w-10" />;
            const iso = toISO(date);
            const booked = isDateBooked(date);

            // Booked: yellow (not clickable). Available: green (not clickable as requested).
            const btnBase = "flex items-center justify-center h-10 w-10 text-sm font-medium rounded-full transition-colors duration-150";
            const classes = booked
              ? `${btnBase} bg-yellow-100 text-yellow-700 border border-yellow-300 cursor-default`
              : `${btnBase} bg-green-100 text-green-700 border border-green-300 cursor-default`;

            return (
              <div key={key} className="flex items-center justify-center">
                <button
                  title={booked ? `Booked: ${iso}` : `Available: ${iso}`}
                  // NO onClick handler: read-only calendar
                  className={classes}
                >
                  {date.getDate()}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="py-8 relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Availability Calendar</h2>
          <p className="text-sm text-gray-600">Yellow = booked. Green = available (read-only).</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handlePrev} className="px-3 py-2 rounded border hover:bg-gray-50">Previous</button>
          <button onClick={handleNext} className="px-3 py-2 rounded border hover:bg-gray-50">Next</button>
        </div>
      </div>

      {/* Loading overlay inside the calendar container (spinning loader) */}
      <div className="relative">
        {loading && (
          <div
            aria-live="polite"
            className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center">
              {/* Circular spinner */}
              <svg
                className="animate-spin h-12 w-12 text-teal-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Loading"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              <div className="mt-3 text-sm text-gray-700">Loading availability…</div>
            </div>
          </div>
        )}

        {loading && (
          // while loading, hide the calendar content underneath by reducing opacity (keeps layout)
          <div className="opacity-40 pointer-events-none">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="p-6 bg-white rounded-xl border-2 flex-1 min-w-[280px] h-[360px]" />
              <div className="p-6 bg-white rounded-xl border-2 flex-1 min-w-[280px] h-[360px]" />
            </div>
          </div>
        )}

        {/* actual content (shows even when loading but visually subdued by overlay) */}
        <div className={`${loading ? "opacity-100" : ""}`}>
          <div className="flex flex-col lg:flex-row gap-6">
            <CalendarMonth monthDate={startMonthDate} />
            <CalendarMonth monthDate={secondMonthDate} />
          </div>
        </div>
      </div>

      {fetchError && <div className="mb-4 text-sm text-red-600 mt-4">Error: {fetchError}</div>}

      <div className="mt-6 flex items-center gap-4">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> Available (read-only)</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Booked</div>
      </div>
    </div>
  );
};

export default Calendar;
