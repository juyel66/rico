// File: AdminAnnouncements.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  Clock,
  Download,
  ChevronDown,
  ChevronUp,
  FileText,
  Plus,
  X,
  UploadCloud,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../../store"; // adjust path to your store types if available
import {
  fetchAnnouncements,
  createAnnouncement,
} from "../../../features/Properties/PropertiesSlice";
import { unwrapResult } from "@reduxjs/toolkit";
// Import API_BASE only for file URL transformation
import { API_BASE } from "../../../features/Auth/authSlice";

/* ----------------------
  Helper: auth header (used only for legacy behavior; not used now but kept)
------------------------*/
const getAuthToken = () => {
  try {
    return localStorage.getItem("auth_access");
  } catch {
    return null;
  }
};

/* ----------------------
  Helper: full file URL
------------------------*/
const getFileUrl = (filePath: string) => {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  try {
    const root = API_BASE.replace(/\/api\/?$/, "");
    return `${root}${filePath}`;
  } catch {
    return filePath;
  }
};

/* ----------------------
  Priority badge
------------------------*/
const PriorityBadge = ({ priority }: { priority: string }) => {
  let bgColor, textColor;
  switch (priority) {
    case "high":
      bgColor = "bg-red-100";
      textColor = "text-red-700";
      break;
    case "medium":
      bgColor = "bg-amber-100";
      textColor = "text-amber-700";
      break;
    default:
      bgColor = "bg-blue-100";
      textColor = "text-blue-700";
      break;
  }
  return (
    <span className={`text-xs font-semibold py-1 px-3 rounded-full ${bgColor} ${textColor}`}>
      {priority} priority
    </span>
  );
};

/* ----------------------
  Attachment Item
  — only this component's download behavior changed
------------------------*/
const AttachmentItem = ({ attachment }: { attachment: any }) => {
  // helper to trigger download by fetching blob and using object URL
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = attachment.downloadUrl || attachment.file || attachment;
    const filename = attachment.name || (url && url.split("/").pop()) || "download";

    if (!url) {
      // nothing to download
      return;
    }

    try {
      // Try to fetch the resource as blob so we can force a download
      const res = await fetch(url, { method: "GET", mode: "cors" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      // Append to DOM to make click work in some browsers
      document.body.appendChild(a);
      a.click();
      a.remove();

      // clean up
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      // If fetch fails (CORS, network, HTML response, etc.), fallback to opening the URL in a new tab
      // which allows the user to manually save the image/file.
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-teal-500 transition">
      <div className="flex items-center space-x-3">
        <FileText className="w-5 h-5 text-blue-500" />
        <div>
          <p className="text-sm font-medium text-gray-800 truncate">{attachment.name}</p>
          <p className="text-xs text-gray-500">{attachment.size}</p>
        </div>
      </div>

      {/* Keep visual exactly same — replace anchor with button that triggers download logic */}
      <button
        onClick={handleDownload}
        className="flex items-center text-sm font-medium text-white bg-teal-500 rounded-lg px-3 py-1.5 hover:bg-teal-600 transition"
        aria-label={`Download ${attachment.name}`}
        type="button"
      >
        <Download className="w-4 h-4 mr-1" /> Download
      </button>
    </div>
  );
};

/* ----------------------
  Update Card
------------------------*/
const UpdateCard = ({ update }: { update: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const attachmentCount = update.attachments?.length ?? 0;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-4 transition-all overflow-hidden">
      <div
        className="flex justify-between items-center p-5 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-4">
          <img
            src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760910352/Container_3_l81okq.png"
            alt=""
            className="w-8 h-8"
          />
          <span className="text-base font-medium text-gray-800">{update.title}</span>
          <PriorityBadge priority={update.priority} />
          <span
            className={`text-xs font-medium py-1 px-3 rounded-full ${
              attachmentCount > 0 ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {attachmentCount > 0 ? `${attachmentCount} attachment(s)` : "No attachments"}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500 hidden md:block">{update.date}</span>
          {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </div>
      </div>

      {isOpen && (
        <div className="p-5 pt-0 border-t border-gray-100">
          <p className="text-sm text-gray-700 mb-4 leading-relaxed">{update.details}</p>
          {attachmentCount > 0 && (
            <>
              <h4 className="text-sm font-semibold text-gray-800 mb-3 border-t pt-4">Attachments</h4>
              <div className="space-y-3">
                {update.attachments.map((att: any, index: number) => (
                  <AttachmentItem key={index} attachment={att} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ----------------------
  Announcement Modal (uses dispatch(createAnnouncement))
------------------------*/
const AnnouncementModal = ({
  onClose,
  onAddLocal, // optional callback (local UI), new item will be available via Redux anyway
}: {
  onClose: () => void;
  onAddLocal?: (item: any) => void;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [details, setDetails] = useState("");
  const [date, setDate] = useState("");
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    const previewObjs = selected.map((f) => ({
      name: f.name,
      size: `${(f.size / 1024 / 1024).toFixed(2)} MB`,
      downloadUrl: URL.createObjectURL(f),
    }));
    setRawFiles((prev) => [...prev, ...selected]);
    setFilePreviews((prev) => [...prev, ...previewObjs]);
  };

  useEffect(() => {
    return () => {
      for (const p of filePreviews) {
        if (p.downloadUrl) URL.revokeObjectURL(p.downloadUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const announcementData = {
        title,
        date,
        priority,
        description: details,
      };

      // dispatch createAnnouncement thunk — thunk knows how to send FormData if `files` provided
      const action = dispatch(createAnnouncement({ announcementData, files: rawFiles }));
      // unwrap to get the created object or throw
      const created: any = await (action as any).unwrap();

      // Modal will close; Redux already updated state via reducer (createAnnouncement.fulfilled pushes)
      // Optionally notify parent (local update), though Redux contains the new item
      if (onAddLocal) {
        // map created to UI-friendly shape (like before)
        const mapped = {
          id: created.id,
          title: created.title,
          date: created.date,
          priority: created.priority,
          details: created.description ?? details,
          created_at: created.created_at,
          updated_at: created.updated_at,
          attachments: (created.files ?? []).map((f: any) => ({
            id: f.id,
            name: f.file?.split("/").pop() ?? `file_${f.id}`,
            size: "",
            downloadUrl: getFileUrl(f.file),
          })),
        };
        onAddLocal(mapped);
      }

      onClose();
    } catch (err: any) {
      setError(err?.message ? String(err.message) : "Failed to create announcement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Announcement</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border rounded-md px-3 py-2 mt-1 text-sm focus:ring-2 focus:ring-teal-500"
              placeholder="Enter announcement title"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full border rounded-md px-3 py-2 mt-1 text-sm"
              />
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border rounded-md px-3 py-2 mt-1 text-sm"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Details</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              className="w-full border rounded-md px-3 py-2 mt-1 text-sm"
              placeholder="Enter announcement details"
            ></textarea>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Attachments</label>
            <label
              htmlFor="file-upload"
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
            >
              <UploadCloud className="w-5 h-5 text-gray-500" />
              Upload Files
            </label>
            <input id="file-upload" type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            {filePreviews.length > 0 && (
              <ul className="mt-3 space-y-2">
                {filePreviews.map((f, i) => (
                  <li key={i} className="flex justify-between text-sm text-gray-700 border-b pb-1">
                    <span>{f.name}</span>
                    <a href={f.downloadUrl} download={f.name} className="text-teal-600 hover:underline text-xs">
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-md text-sm font-semibold disabled:opacity-60">
            {loading ? "Adding..." : "Add Announcement"}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ----------------------
  Main component (reads from Redux)
------------------------*/
const AdminAnnouncements = () => {
  const dispatch = useDispatch<AppDispatch>();
  const announcementsFromStore = useSelector((s: RootState) => s.propertyBooking.announcements);
  const loading = useSelector((s: RootState) => s.propertyBooking.loading);
  const fetchError = useSelector((s: RootState) => s.propertyBooking.error);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // dispatch fetchAnnouncements on mount
    dispatch(fetchAnnouncements());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map backend announcement objects to UI-shape used by UpdateCard (details/attachments)
  const mappedAnnouncements = (Array.isArray(announcementsFromStore) ? announcementsFromStore : []).map((item: any) => ({
    id: item.id,
    title: item.title,
    date: item.date,
    priority: item.priority,
    details: item.description ?? item.details ?? "",
    created_at: item.created_at,
    updated_at: item.updated_at,
    attachments: (item.files ?? []).map((f: any) => ({
      id: f.id,
      name: f.file?.split("/").pop() ?? `file_${f.id}`,
      size: "",
      downloadUrl: getFileUrl(f.file),
    })),
  }));

  // Optional local add callback (not strictly necessary since Redux will update)
  const handleAddAnnouncementLocal = (createdMapped: any) => {
    // no-op: Redux will already have the created item in state
  };

  return (
    <div className="bg-gray-50 font-sans p-4 md:p-8 min-h-screen">
      <div className="">
        <div className="flex justify-between mb-8">
          <header>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Announcements</h1>
            <p className="text-gray-600 text-sm">Stay informed with the latest company updates and news</p>
          </header>

          <button onClick={() => setIsModalOpen(true)} className="flex hidden items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg shadow">
            <Plus className="w-4 h-4" /> Add Announcement
          </button>
        </div>

        <main>
          {/* Loading — centered in the content area (shows first, then data) */}
          {loading && (
            <div className="min-h-[40vh] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <span className="loading loading-spinner loading-xl" />
              </div>
            </div>
          )}

          {/* show fetchError as a small inline message but keep UI usable */}
          {!loading && fetchError && (
            <div className="text-sm text-red-600 mb-3">{String(fetchError)}</div>
          )}

          {/* If not loading and there are no announcements, show friendly empty card */}
          {!loading && mappedAnnouncements.length === 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No announcements</h3>
              <p className="text-sm text-gray-500 mb-4">
                There are no announcements available right now. Check back later or add a new announcement.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => dispatch(fetchAnnouncements())}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Retry
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Add Announcement
                </button>
              </div>
            </div>
          )}

          {/* Render announcements only after loading finished */}
          {!loading && mappedAnnouncements.map((update: any) => (
            <UpdateCard key={update.id} update={update} />
          ))}
        </main>

        {isModalOpen && (
          <AnnouncementModal
            onClose={() => setIsModalOpen(false)}
            onAddLocal={handleAddAnnouncementLocal}
          />
        )}
      </div>
    </div>
  );
};

export default AdminAnnouncements;
