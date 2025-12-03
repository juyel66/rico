// // File: ActivityLogsExactPDF_NoBorders.jsx
// import React, { useState, useEffect } from "react";
// import { Search } from "lucide-react";
// import { jsPDF } from "jspdf";

// const SAMPLE_LOGS = [
//   { timestamp: "2025-10-09 10:15", user: "Sarah Johnson", action: "Downloaded property pack", details: "Luxury Modern Villa with Pool", type: "download" },
//   { timestamp: "2025-10-09 10:15", user: "Michael Chen", action: "Edited property", details: "Downtown Penthouse with City Views", type: "edit" },
//   { timestamp: "2025-10-09 10:15", user: "Admin Emily", action: "Published property", details: "Luxury Modern Villa with Pool", type: "upload" },
//   { timestamp: "2025-10-09 10:15", user: "Rodriguez Sarah", action: "Logged in", details: "Successful login from IP 192.168.1.1", type: "login" },
//   { timestamp: "2025-10-09 10:15", user: "Johnson", action: "Shared property link", details: "Downtown Penthouse with City Views", type: "share" },
// ];

// async function urlToDataUrl(url) {
//   if (!url) return null;
//   if (url.startsWith("data:")) return url;
//   try {
//     const res = await fetch(url, { mode: "cors" });
//     if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
//     const blob = await res.blob();
//     return await new Promise((resolve, reject) => {
//       const fr = new FileReader();
//       fr.onload = () => resolve(fr.result);
//       fr.onerror = (e) => reject(e);
//       fr.readAsDataURL(blob);
//     });
//   } catch (err) {
//     console.warn("Header image load failed:", err);
//     return null;
//   }
// }

// function typeBadgeColor(type) {
//   switch (type) {
//     case "download": return { bg: "#5b21b6", txt: "#ffffff" };
//     case "edit": return { bg: "#6b7280", txt: "#ffffff" };
//     case "upload": return { bg: "#0f172a", txt: "#ffffff" };
//     case "login": return { bg: "#1d4ed8", txt: "#ffffff" };
//     case "share": return { bg: "#6b7280", txt: "#ffffff" };
//     case "delete": return { bg: "#dc2626", txt: "#ffffff" };
//     default: return { bg: "#374151", txt: "#ffffff" };
//   }
// }

// export default function ActivityLogsExactPDF_NoBorders({ headerImageUrl }) {
//   const [logs] = useState(SAMPLE_LOGS);
//   const [search, setSearch] = useState("");
//   const [filtered, setFiltered] = useState(logs);
//   const [selectedSet, setSelectedSet] = useState(new Set());
//   const [headerDataUrl, setHeaderDataUrl] = useState(null);

//   useEffect(() => {
//     const term = search.trim().toLowerCase();
//     const f = logs.filter(l =>
//       (l.timestamp || "").toLowerCase().includes(term) ||
//       (l.user || "").toLowerCase().includes(term) ||
//       (l.action || "").toLowerCase().includes(term) ||
//       (l.details || "").toLowerCase().includes(term) ||
//       (l.type || "").toLowerCase().includes(term)
//     );
//     setFiltered(f);
//     setSelectedSet(new Set());
//   }, [search, logs]);

//   useEffect(() => {
//     (async () => {
//       if (!headerImageUrl) { setHeaderDataUrl(null); return; }
//       const d = await urlToDataUrl(headerImageUrl);
//       setHeaderDataUrl(d);
//     })();
//   }, [headerImageUrl]);

//   function toggleRow(index) {
//     setSelectedSet(prev => {
//       const next = new Set(prev);
//       if (next.has(index)) next.delete(index);
//       else next.add(index);
//       return next;
//     });
//   }
//   function toggleSelectAllVisible() {
//     const indices = filtered.map((_, i) => i);
//     const allSelected = indices.every(i => selectedSet.has(i));
//     setSelectedSet(allSelected ? new Set() : new Set(indices));
//   }

//   async function exportExactPDF_NoBorders() {
//     if (selectedSet.size === 0) {
//       alert("Select rows (click rows) or use Select all visible before exporting.");
//       return;
//     }

//     const indices = Array.from(selectedSet).sort((a, b) => a - b);
//     const rows = indices.map(i => filtered[i]).filter(Boolean);

//     const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
//     const pageW = pdf.internal.pageSize.getWidth();
//     const pageH = pdf.internal.pageSize.getHeight();
//     const margin = 16; // more balanced padding on both sides
//     const contentW = pageW - margin * 2;

//     const colTimestamp = 32;
//     const colUser = 48;
//     const colAction = 55;
//     const colType = 28;
//     const colDetails = contentW - (colTimestamp + colUser + colAction + colType);

//     const lineHeight = 6;
//     const rowPadding = 2;
//     const footerHeight = 10;

//     let headerImg = headerDataUrl;
//     if (!headerImg && headerImageUrl) headerImg = await urlToDataUrl(headerImageUrl);

//     const drawHeader = (doc, pageIndex) => {
//       const headerTop = margin;
//       const headerHeight = headerImg ? 18 : 12;

//       doc.setFontSize(18);
//       doc.setFont("helvetica", "bold");
//       doc.setTextColor("#0f172a");
//       const title = "Activity Log";
//       const titleWidth = doc.getTextWidth(title);
//       doc.text(title, pageW / 2 - titleWidth / 2, headerTop + 6);

//       // gray subtitle centered under it
//       doc.setFontSize(10);
//       doc.setFont("helvetica", "normal");
//       doc.setTextColor("#6b7280");
//       const sub = "Track all system activities and user actions";
//       const subWidth = doc.getTextWidth(sub);
//       doc.text(sub, pageW / 2 - subWidth / 2, headerTop + 12);

//       return headerTop + headerHeight + 8;
//     };

//     const drawTableHeader = (doc, yStart) => {
//       const y = yStart;
//       doc.setFontSize(10);
//       doc.setFont("helvetica", "bold");
//       doc.setTextColor("#6b7280");

//       doc.setFillColor("#f8fafc");
//       doc.rect(margin - 1, y - 5, contentW + 2, 9, "F");

//       doc.text("TIMESTAMP", margin + 2, y);
//       doc.text("USER", margin + colTimestamp + 6, y);
//       doc.text("ACTION", margin + colTimestamp + colUser + 10, y);
//       doc.text("DETAILS", margin + colTimestamp + colUser + colAction + 10, y);
//       doc.text("TYPE", margin + colTimestamp + colUser + colAction + colDetails + 8, y);

//       return y + 6;
//     };

//     let currentY;
//     for (let r = 0, pageIndex = 0; r < rows.length; r++) {
//       const row = rows[r];
//       if (r === 0) {
//         currentY = drawHeader(pdf, pageIndex);
//         currentY = drawTableHeader(pdf, currentY);
//       }

//       const tsLines = pdf.splitTextToSize(String(row.timestamp || "-"), colTimestamp - 4);
//       const userLines = pdf.splitTextToSize(String(row.user || "-"), colUser - 4);
//       const actionLines = pdf.splitTextToSize(String(row.action || "-"), colAction - 4);
//       const detailsLines = pdf.splitTextToSize(String(row.details || "-"), colDetails - 4);
//       const typeLines = pdf.splitTextToSize(String(row.type || "-"), colType - 4);

//       const maxLines = Math.max(tsLines.length, userLines.length, actionLines.length, detailsLines.length, typeLines.length);
//       const rowHeight = maxLines * lineHeight + rowPadding;

//       if (currentY + rowHeight + footerHeight > pageH - margin) {
//         pdf.addPage();
//         pageIndex++;
//         currentY = drawHeader(pdf, pageIndex);
//         currentY = drawTableHeader(pdf, currentY);
//       }

//       const textYStart = currentY;
//       const textXTimestamp = margin + 2;
//       const textXUser = margin + colTimestamp + 6;
//       const textXAction = margin + colTimestamp + colUser + 10;
//       const textXDetails = margin + colTimestamp + colUser + colAction + 10;
//       const textXType = margin + colTimestamp + colUser + colAction + colDetails + 8;

//       pdf.setFontSize(10);
//       pdf.setFont("helvetica", "normal");
//       pdf.setTextColor("#111827");

//       pdf.text(tsLines, textXTimestamp, textYStart + 4);
//       pdf.text(userLines, textXUser, textYStart + 4);
//       pdf.text(actionLines, textXAction, textYStart + 4);
//       pdf.text(detailsLines, textXDetails, textYStart + 4);

//       const badge = typeBadgeColor(row.type);
//       pdf.setFillColor(badge.bg);
//       const txtUpper = String(row.type || "-").toUpperCase();
//       const txtWidth = pdf.getTextWidth(txtUpper);
//       const padX = 3;
//       const badgeW = Math.max(colType - 6, txtWidth + padX * 2);
//       const badgeH = 6;
//       const badgeX = textXType - 2;
//       const badgeY = textYStart + 1.5;
//       pdf.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, "F");
//       pdf.setFontSize(9);
//       pdf.setFont("helvetica", "bold");
//       pdf.setTextColor(badge.txt);
//       pdf.text(txtUpper, badgeX + 1.5, badgeY + 4.5);

//       currentY += rowHeight;
//     }

//     const pageCount = pdf.getNumberOfPages();
//     for (let i = 1; i <= pageCount; i++) {
//       pdf.setPage(i);
//       pdf.setFontSize(9);
//       pdf.setFont("helvetica", "normal");
//       pdf.setTextColor("#6b7280");
//       pdf.text(`Page ${i} of ${pageCount}`, pageW - margin - 30, pageH - 8);
//     }

//     const filename = `activity-logs-exact-centered-${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`;
//     pdf.save(filename);
//   }

//   function isSelected(i) { return selectedSet.has(i); }

//   return (
//     <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
//       <div className="bg-white p-6 rounded-xl shadow-md">
//         {/* Centered Header */}
//         <div className="text-center mb-8">
//           <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
//           <p className="text-gray-500 text-sm mt-1">Track all system activities and user actions</p>
//         </div>

//         <div className="flex justify-between items-center mb-6">
//           <div></div>
//           <div className="flex items-center gap-3">
//             <button onClick={toggleSelectAllVisible} className="px-3 py-2 bg-white rounded text-sm shadow-sm hover:bg-gray-50">Select all visible</button>
//             <button onClick={exportExactPDF_NoBorders} className="px-4 py-2 bg-teal-600 text-white rounded shadow hover:bg-teal-700">Export PDF</button>
//           </div>
//         </div>

//         <div className="flex gap-4 mb-4">
//           <div className="relative flex-grow">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//             <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by any field..." className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none" />
//           </div>
//         </div>

//         <div className="overflow-x-auto px-2">
//           <table className="min-w-full">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white">
//               {filtered.length ? filtered.map((row, i) => (
//                 <tr
//                   key={i}
//                   onClick={() => toggleRow(i)}
//                   className={`transition cursor-pointer ${isSelected(i) ? "bg-indigo-50" : "hover:bg-gray-50"}`}
//                 >
//                   <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.timestamp}</td>
//                   <td className="px-6 py-4 text-sm text-gray-700">{row.user}</td>
//                   <td className="px-6 py-4 text-sm text-gray-700">{row.action}</td>
//                   <td className="px-6 py-4 text-sm text-gray-700">{row.details}</td>
//                   <td className="px-6 py-4 text-sm">
//                     <span style={{ background: typeBadgeColor(row.type).bg, color: typeBadgeColor(row.type).txt, padding: "6px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
//                       {row.type}
//                     </span>
//                   </td>
//                 </tr>
//               )) : (
//                 <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No activities found</td></tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }


























// File: ActivityLogsExactPDF_NoBorders.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { jsPDF } from "jspdf";
import { useDispatch, useSelector } from "react-redux";
import { fetchActivityLogs } from "../../../features/Properties/PropertiesSlice";
import type { AppDispatch, RootState } from "../../../store";

/* ----------------------
  Helpers (unchanged)
------------------------*/
async function urlToDataUrl(url) {
  if (!url) return null;
  if (typeof url !== "string") return null;
  if (url.startsWith("data:")) return url;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = (e) => reject(e);
      fr.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("Header image load failed:", err);
    return null;
  }
}

function typeBadgeColor(type) {
  switch (String(type ?? "").toLowerCase()) {
    case "download":
      return { bg: "#5b21b6", txt: "#ffffff" };
    case "edit":
    case "update":
      return { bg: "#6b7280", txt: "#ffffff" };
    case "upload":
      return { bg: "#0f172a", txt: "#ffffff" };
    case "login":
      return { bg: "#1d4ed8", txt: "#ffffff" };
    case "share":
      return { bg: "#6b7280", txt: "#ffffff" };
    case "delete":
      return { bg: "#dc2626", txt: "#ffffff" };
    default:
      return { bg: "#374151", txt: "#ffffff" };
  }
}

/* ----------------------
  Map activity log API item -> table row shape used in PDF/table
  Row shape: { timestamp, user, action, details, type }
------------------------*/
function mapActivityItemToRow(item) {
  if (!item) return null;

  // timestamp: many possible keys
  const timestampRaw =
    item.created_at ??
    item.timestamp ??
    item.time ??
    item.date ??
    (item.changes && (item.changes.created_at ?? item.changes.timestamp)) ??
    "-";
  const timestamp = String(timestampRaw ?? "-");

  // user: many possible places (changes.user, user, user_name, created_by, object_repr)
  let user = "-";
  try {
    if (item.changes && item.changes.user) {
      const u = item.changes.user;
      user = Array.isArray(u) ? String(u[1] ?? u[0]) : String(u);
    } else if (item.user) {
      user = String(item.user);
    } else if (item.user_name) {
      user = String(item.user_name);
    } else if (item.created_by) {
      user = String(item.created_by);
    } else if (item.created_by_name) {
      user = String(item.created_by_name);
    } else if (item.object_repr) {
      const repr = String(item.object_repr);
      const emailMatch = repr.match(/[\w.+-]+@[\w-]+\.[\w-.]+/);
      if (emailMatch) user = emailMatch[0];
      else user = repr.split(":")[0] ?? repr;
    }
  } catch (e) {
    user = item.object_repr ?? "-";
  }
  user = String(user ?? "-");

  // action: prefer explicit action fields, fallback to type/object_repr
  let action = item.action ?? item.action_text ?? item.type ?? item.object_repr ?? (typeof item.action !== "undefined" ? `Action ${item.action}` : "-");
  action = String(action ?? "-");

  // determine type: numeric action map OR check strings
  let type = "info";
  if (typeof item.action === "number") {
    switch (item.action) {
      case 0: type = "create"; break;
      case 1: type = "update"; break;
      case 2: type = "delete"; break;
      default: type = "info";
    }
  } else if (item.type && typeof item.type === "string") {
    type = String(item.type).toLowerCase();
  } else {
    const low = String(action).toLowerCase();
    if (low.includes("delete")) type = "delete";
    else if (low.includes("edit") || low.includes("updated")) type = "edit";
    else if (low.includes("download")) type = "download";
    else if (low.includes("upload")) type = "upload";
    else type = "info";
  }

  // details: many fallbacks, also tolerate misspelling "detials"
  let details = "";
  if (item.details) details = item.details;
  else if (item.detials) details = item.detials; // handle misspelling
  else if (item.changes_text) details = item.changes_text;
  else if (item.changes && item.changes.data) {
    try {
      const dataVal = item.changes.data[1] ?? item.changes.data;
      if (typeof dataVal === "string" && dataVal.trim().startsWith("{")) {
        const parsed = JSON.parse(dataVal);
        const parts = [];
        if (parsed.name) parts.push(`Name: ${parsed.name}`);
        if (parsed.email) parts.push(`Email: ${parsed.email}`);
        if (parsed.phone) parts.push(`Phone: ${parsed.phone}`);
        if (parsed.message) parts.push(`Message: ${parsed.message}`);
        details = parts.join(" — ") || JSON.stringify(parsed);
      } else if (Array.isArray(dataVal)) {
        details = JSON.stringify(dataVal);
      } else {
        details = String(dataVal);
      }
    } catch (e) {
      details = String(item.changes.data);
    }
  } else if (item.serialized_data) {
    try {
      details = typeof item.serialized_data === "string" ? item.serialized_data : JSON.stringify(item.serialized_data);
    } catch {
      details = String(item.serialized_data);
    }
  } else {
    details = item.object_repr ?? item.action_text ?? "";
  }
  details = String(details ?? "");

  return {
    timestamp,
    user,
    action,
    details,
    type,
  };
}

/* ----------------------
  Small helper to render fetchError nicely
------------------------*/
function renderErrorMessage(fetchError) {
  if (!fetchError) return null;
  if (typeof fetchError === "string") return fetchError;
  if (fetchError.message) return fetchError.message;
  if (fetchError.detail) return fetchError.detail;
  try {
    return JSON.stringify(fetchError, null, 2);
  } catch {
    return String(fetchError);
  }
}

/* ----------------------
  Component
------------------------*/
export default function ActivityLogsExactPDF_NoBorders({ headerImageUrl }) {
  const dispatch = useDispatch<AppDispatch>();
  const activityLogs = useSelector((s: RootState) => s.propertyBooking.activityLogs);
  const loading = useSelector((s: RootState) => s.propertyBooking.loading);
  const fetchError = useSelector((s: RootState) => s.propertyBooking.error);

  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [selectedSet, setSelectedSet] = useState(new Set());
  const [headerDataUrl, setHeaderDataUrl] = useState(null);

  // IMPORTANT: memoize mappedRows so the reference is stable between renders
  const mappedRows = useMemo(() => {
    if (!activityLogs || !Array.isArray(activityLogs)) return [];
    return activityLogs.map((it) => mapActivityItemToRow(it)).filter(Boolean);
  }, [activityLogs]);

  useEffect(() => {
    // dispatch fetchActivityLogs on mount (dependency is stable: dispatch)
    dispatch(fetchActivityLogs())
      .unwrap?.()
      .catch(() => {
        /* ignore here: we'll show fetchError from store */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    const term = (search || "").trim().toLowerCase();

    // make sure we coerce all fields to String before calling .toLowerCase()
    const f = (mappedRows || []).filter((l) => {
      try {
        const ts = String(l.timestamp ?? "").toLowerCase();
        const user = String(l.user ?? "").toLowerCase();
        const action = String(l.action ?? "").toLowerCase();
        const details = String(l.details ?? "").toLowerCase();
        const type = String(l.type ?? "").toLowerCase();

        return ts.includes(term) || user.includes(term) || action.includes(term) || details.includes(term) || type.includes(term);
      } catch (err) {
        // if something unexpected happens for an item, exclude it from results
        console.warn("filtering error for item:", l, err);
        return false;
      }
    });

    setFiltered(f);
    // reset selectedSet safely
    setSelectedSet(new Set());
  }, [search, mappedRows]);

  useEffect(() => {
    (async () => {
      if (!headerImageUrl) { setHeaderDataUrl(null); return; }
      const d = await urlToDataUrl(headerImageUrl);
      setHeaderDataUrl(d);
    })();
  }, [headerImageUrl]);

  function toggleRow(index) {
    setSelectedSet((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }
  function toggleSelectAllVisible() {
    const indices = filtered.map((_, i) => i);
    const allSelected = indices.every((i) => selectedSet.has(i));
    setSelectedSet(allSelected ? new Set() : new Set(indices));
  }

  async function exportExactPDF_NoBorders() {
    if (selectedSet.size === 0) {
      alert("Select rows (click rows) or use Select all visible before exporting.");
      return;
    }

    const indices = Array.from(selectedSet).sort((a, b) => a - b);
    const rows = indices.map((i) => filtered[i]).filter(Boolean);

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 16; // balanced padding
    const contentW = pageW - margin * 2;

    const colTimestamp = 32;
    const colUser = 48;
    const colAction = 55;
    const colType = 28;
    const colDetails = contentW - (colTimestamp + colUser + colAction + colType);

    const lineHeight = 6;
    const rowPadding = 2;
    const footerHeight = 10;

    let headerImg = headerDataUrl;
    if (!headerImg && headerImageUrl) headerImg = await urlToDataUrl(headerImageUrl);

    const drawHeader = (doc, pageIndex) => {
      const headerTop = margin;
      const headerHeight = headerImg ? 18 : 12;

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor("#0f172a");
      const title = "Activity Log";
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, pageW / 2 - titleWidth / 2, headerTop + 6);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor("#6b7280");
      const sub = "Track all system activities and user actions";
      const subWidth = doc.getTextWidth(sub);
      doc.text(sub, pageW / 2 - subWidth / 2, headerTop + 12);

      return headerTop + headerHeight + 8;
    };

    const drawTableHeader = (doc, yStart) => {
      const y = yStart;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor("#6b7280");

      doc.setFillColor("#f8fafc");
      doc.rect(margin - 1, y - 5, contentW + 2, 9, "F");

      doc.text("TIMESTAMP", margin + 2, y);
      doc.text("USER", margin + colTimestamp + 6, y);
      doc.text("ACTION", margin + colTimestamp + colUser + 10, y);
      doc.text("DETAILS", margin + colTimestamp + colUser + colAction + 10, y);
      doc.text("TYPE", margin + colTimestamp + colUser + colAction + colDetails + 8, y);

      return y + 6;
    };

    let currentY;
    for (let r = 0, pageIndex = 0; r < rows.length; r++) {
      const row = rows[r];
      if (r === 0) {
        currentY = drawHeader(pdf, pageIndex);
        currentY = drawTableHeader(pdf, currentY);
      }

      const tsLines = pdf.splitTextToSize(String(row.timestamp || "-"), colTimestamp - 4);
      const userLines = pdf.splitTextToSize(String(row.user || "-"), colUser - 4);
      const actionLines = pdf.splitTextToSize(String(row.action || "-"), colAction - 4);
      const detailsLines = pdf.splitTextToSize(String(row.details || "-"), colDetails - 4);
      const typeLines = pdf.splitTextToSize(String(row.type || "-"), colType - 4);

      const maxLines = Math.max(tsLines.length, userLines.length, actionLines.length, detailsLines.length, typeLines.length);
      const rowHeight = maxLines * lineHeight + rowPadding;

      if (currentY + rowHeight + footerHeight > pageH - margin) {
        pdf.addPage();
        pageIndex++;
        currentY = drawHeader(pdf, pageIndex);
        currentY = drawTableHeader(pdf, currentY);
      }

      const textYStart = currentY;
      const textXTimestamp = margin + 2;
      const textXUser = margin + colTimestamp + 6;
      const textXAction = margin + colTimestamp + colUser + 10;
      const textXDetails = margin + colTimestamp + colUser + colAction + 10;
      const textXType = margin + colTimestamp + colUser + colAction + colDetails + 8;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor("#111827");

      pdf.text(tsLines, textXTimestamp, textYStart + 4);
      pdf.text(userLines, textXUser, textYStart + 4);
      pdf.text(actionLines, textXAction, textYStart + 4);
      pdf.text(detailsLines, textXDetails, textYStart + 4);

      const badge = typeBadgeColor(row.type);
      pdf.setFillColor(badge.bg);
      const txtUpper = String(row.type || "-").toUpperCase();
      const txtWidth = pdf.getTextWidth(txtUpper);
      const padX = 3;
      const badgeW = Math.max(colType - 6, txtWidth + padX * 2);
      const badgeH = 6;
      const badgeX = textXType - 2;
      const badgeY = textYStart + 1.5;
      pdf.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, "F");
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(badge.txt);
      pdf.text(txtUpper, badgeX + 1.5, badgeY + 4.5);

      currentY += rowHeight;
    }

    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor("#6b7280");
      pdf.text(`Page ${i} of ${pageCount}`, pageW - margin - 30, pageH - 8);
    }

    const filename = `activity-logs-exact-centered-${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`;
    pdf.save(filename);
  }

  function isSelected(i) {
    return selectedSet.has(i);
  }

  const visibleError = renderErrorMessage(fetchError);

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-gray-500 text-sm mt-1">Track all system activities and user actions</p>
        </div>

        {/* Visible error box (helpful for dev) */}
        {visibleError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded text-sm whitespace-pre-wrap">
            {visibleError}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div></div>
          <div className="flex items-center gap-3">
            <button onClick={toggleSelectAllVisible} className="px-3 py-2 bg-white rounded text-sm shadow-sm hover:bg-gray-50">Select all visible</button>
            <button onClick={exportExactPDF_NoBorders} className="px-4 py-2 bg-teal-600 text-white rounded shadow hover:bg-teal-700">Export PDF</button>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by any field..." className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none" />
          </div>
        </div>

        <div className="overflow-x-auto px-2">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filtered.length ? filtered.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => toggleRow(i)}
                  className={`transition cursor-pointer ${isSelected(i) ? "bg-indigo-50" : "hover:bg-gray-50"}`}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.timestamp}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{row.user}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{row.action}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{row.details}</td>
                  <td className="px-6 py-4 text-sm">
                    <span style={{ background: typeBadgeColor(row.type).bg, color: typeBadgeColor(row.type).txt, padding: "6px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                      {row.type}
                    </span>
                  </td>
                </tr>
              )) : (
                  <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="bg-white/95 p-6 rounded-lg shadow-lg flex flex-col items-center pointer-events-auto">
              <svg className="animate-spin h-10 w-10 text-teal-600 mb-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <div className="text-sm text-gray-700">Loading activity</div>
            </div>
          </div>

                
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
