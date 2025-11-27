// src/features/Properties/AdminPropertiesSales.tsx
import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Search,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  LucideTableProperties,
} from "lucide-react";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store"; // optional typed root state

import {
  fetchProperties,
  updateProperty,
  deleteProperty,
} from "../../../features/Properties/PropertiesSlice";

/* ---------- small inline toast ---------- */
const ToastNotification: React.FC<{
  message: string;
  type?: "success" | "error";
  visible: boolean;
}> = ({ message, type = "success", visible }) => {
  if (!visible) return null;
  const baseClass =
    "fixed bottom-4 right-4 p-4 rounded-lg shadow-xl text-white transition-opacity duration-300 z-50";
  const typeClass = type === "success" ? "bg-green-500" : "bg-red-500";
  const Icon = type === "success" ? CheckCircle : AlertTriangle;
  return (
    <div className={`${baseClass} ${typeClass} flex items-center space-x-2`}>
      <Icon className="h-5 w-5" />
      <span className="font-medium">{message}</span>
    </div>
  );
};

/* ---------- normalize payload helper ---------- */
function toArray(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (payload.results && Array.isArray(payload.results)) return payload.results;
  if (payload.items && Array.isArray(payload.items)) return payload.items;
  return [];
}

const availableStatuses = ["All Status", "published", "pending", "draft"];

/* ---------- helper to decide if property is a "sale" listing ---------- */
function isSaleProperty(p: any): boolean {
  if (!p) return false;
  const val =
    (p.listing_type ?? p.listingType ?? p.property_type ?? p.type ?? p.rateType) ??
    "";
  if (!val) return false;
  const normalized = String(val).toLowerCase();
  // treat common variants as sale
  return ["sale", "sell", "for sale", "sales"].includes(normalized);
}

/* ---------- small helper: truncate description to 20 chars with ellipsis ---------- */
const truncate = (maybeStr: any, maxLen = 20) => {
  const s =
    typeof maybeStr === "string"
      ? maybeStr
      : maybeStr === null || maybeStr === undefined
      ? ""
      : String(maybeStr);
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen) + "...";
};

const AdminPropertiesSales: React.FC = () => {
  const dispatch: any = useDispatch();
  const slice: any = useSelector((s: any) => s.propertyBooking);
  const rawProperties = slice?.properties;
  const loading = slice?.loading;
  const error = slice?.error;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [toast, setToast] = useState({
    message: "",
    type: "" as "success" | "error" | "",
    visible: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // normalized array from redux
  const reduxArray = useMemo(() => toArray(rawProperties), [rawProperties]);

  // local copy for instant UI updates (only sale items)
  const [localProperties, setLocalProperties] = useState<any[]>([]);

  // sync localProperties whenever redux array changes, but include only sale listings
  useEffect(() => {
    const saleOnly = reduxArray.filter((p: any) => isSaleProperty(p));
    // copy objects so local edits won't mutate redux objects directly
    setLocalProperties(saleOnly.map((p: any) => ({ ...p })));
  }, [reduxArray]);

  useEffect(() => {
    // dispatch and log the thunk result to console
    const p = dispatch(fetchProperties());
    p
      .then((res: any) => {
        console.log("[fetchProperties] dispatched result:", res);
        console.log("[fetchProperties] payload:", res?.payload ?? res);
      })
      .catch((err: any) => {
        console.error("[fetchProperties] dispatch error:", err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log("[propertyBooking.properties] rawProperties changed:", rawProperties);
    console.log("[localProperties] length:", localProperties.length);
  }, [rawProperties, localProperties]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast({ message: "", type: "", visible: false }), 3000);
  };

  const handleEdit = (id: number) => {
    const found = localProperties.find((d) => Number(d.id) === Number(id));
    if (found) {
      setEditItem({ ...found });
      setIsModalOpen(true);
    }
  };

  const handleDelete = (id: number) => {
    const found = localProperties.find((d) => Number(d.id) === Number(id));
    Swal.fire({
      title: "Are you sure?",
      html: `<div>Delete property <strong>${found?.title ?? `#${id}`}</strong>?</div>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setDeletingId(id);

          // dispatch thunk to delete on server
          // @ts-ignore unwrap
          await dispatch(deleteProperty(id)).unwrap();

          // remove locally
          setLocalProperties((prev) => prev.filter((x) => Number(x.id) !== Number(id)));

          showToast(`Property ${id} deleted successfully!`, "success");

          // refresh redux list to be safe/in-sync
          dispatch(fetchProperties());
        } catch (err: any) {
          console.error("Delete property error:", err);
          Swal.fire({
            title: "Error",
            text: err?.detail || err?.message || "Failed to delete property",
            icon: "error",
          });
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const handleModalSave = async () => {
    if (!editItem) return;
    const id = Number(editItem.id);

    // build updates object — include only fields you expect to update
    const updates: any = {
      title: editItem.title,
      price: editItem.price,
      status: editItem.status,
      location: editItem.location ?? editItem.city,
    };

    try {
      setIsSaving(true);
      // call thunk
      // @ts-ignore unwrap
      const resp = await dispatch(updateProperty({ propertyId: id, updates })).unwrap();

      // resp is the updated object returned by server
      // Update localProperties instantly using spread operator
      setLocalProperties((prev) =>
        prev.map((p) => (Number(p.id) === Number(id) ? { ...p, ...resp } : p))
      );

      showToast(`Property ${id} updated successfully!`, "success");

      // close modal
      setIsModalOpen(false);
      setEditItem(null);

      // refresh redux store
      dispatch(fetchProperties());
    } catch (err: any) {
      console.error("Update error:", err);
      Swal.fire({
        title: "Error",
        text: err?.detail || err?.message || "Failed to update property",
        icon: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filteredProjects = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    return localProperties.filter((project: any) => {
      const statusMatch =
        statusFilter === "All Status" ||
        String(project.status ?? "").toLowerCase() === statusFilter.toLowerCase();
      const searchMatch =
        !searchLower ||
        String(project.title ?? "").toLowerCase().includes(searchLower) ||
        String(project.location ?? "").toLowerCase().includes(searchLower) ||
        String(project.type ?? "").toLowerCase().includes(searchLower);
      return statusMatch && searchMatch;
    });
  }, [localProperties, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
  };

  return (
    <div>
      <ToastNotification message={toast.message} type={toast.type as any} visible={toast.visible} />

      <div className="flex justify-between items-center mt-5">
        <div>
          <h1 className="text-3xl font-semibold">Properties - Sales (Sale only)</h1>
          <p className="text-gray-500">Your sale properties, beautifully organized.</p>
        </div>
        <Link
          to="/dashboard/sales/admin-create-property-sales"
          className="bg-[#009689] text-white flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-colors duration-150"
        >
          <LucideTableProperties className="h-5 w-5" /> Create Property
        </Link>
      </div>

      <div className="min-h-screen font-sans">
        {/* Search & Filter */}
        <div className="mb-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
          <div className="relative flex items-center w-full sm:max-w-sm border border-gray-300 rounded-lg bg-white shadow-sm">
            <Search className="h-4 w-4 text-gray-400 ml-3" />
            <input
              type="text"
              placeholder="Search properties, Agents, or listing..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 text-sm rounded-lg focus:outline-none placeholder-gray-500"
            />
          </div>

          <div className="relative w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none block w-full p-3 text-sm border border-gray-300 rounded-lg bg-white shadow-sm pr-10 focus:ring-blue-500 cursor-pointer"
            >
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/(\b\w)/g, (char) => char.toUpperCase())}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 w-4">
                    <input type="checkbox" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Project Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Update
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {currentProjects.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input type="checkbox" />
                    </td>
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img
                        src={
                          item?.main_image_url ||
                          item?.imageUrl ||
                          item?.media_images?.[0]?.image ||
                          "https://placehold.co/64x64"
                        }
                        alt={item.title || item.name || `Property ${item.id}`}
                        className="h-16 w-16 rounded object-cover"
                      />
                      <div>
                        <div className="text-sm font-medium">
                          {item.title ?? item.name ?? `Untitled #${item.id}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {truncate(item.details ?? item.description ?? "", 20)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.location ?? item.city ?? item.address}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.price_display ?? item.price ?? item.total_price ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {String(item.listing_type ?? item.rateType ?? item.property_type ?? item.type ?? "-")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.updated_at ?? item.updateDate ?? "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          (item.status ?? "draft").toLowerCase() === "published"
                            ? "bg-blue-100 text-blue-700"
                            : (item.status ?? "draft").toLowerCase() === "pending"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {(item.status ?? "draft").toString().charAt(0).toUpperCase() +
                          (item.status ?? "draft").toString().slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-start gap-3">
                        <Button
                          onClick={() => handleEdit(item.id)}
                          className="p-2 border text-green-500 bg-white hover:bg-gray-100 flex items-center justify-center"
                        >
                          <img
                            src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1761000758/Edit_hejj0l.png"
                            alt="Edit"
                          />
                        </Button>
                        <Button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 border text-red-500 bg-white hover:bg-gray-100 flex items-center justify-center"
                          disabled={deletingId === item.id}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      {loading ? "Loading..." : error ? `Failed to load: ${String(error)}` : "No sale properties found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t">
              <Button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="bg-white border text-gray-900 hover:text-blue-600 disabled:opacity-50"
              >
                &larr; Previous
              </Button>

              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <span
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={`px-3 py-1 text-sm font-medium rounded cursor-pointer ${
                      currentPage === i + 1
                        ? "border border-blue-500 text-blue-600 bg-blue-100"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {i + 1}
                  </span>
                ))}
              </div>

              <Button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="bg-white border text-gray-600 hover:text-blue-600 disabled:opacity-50"
              >
                Next &rarr;
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {isModalOpen && editItem && (
        <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg p-6 w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-semibold mb-4">Edit Property (ID: {editItem.id})</h2>
            <div className="space-y-3">
              <label className="block text-sm font-medium">Title</label>
              <input
                type="text"
                value={editItem.title ?? ""}
                onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                className="w-full border rounded p-2"
              />

              <label className="block text-sm font-medium">Price</label>
              <input
                type="text"
                value={editItem.price ?? editItem.price_display ?? ""}
                onChange={(e) => setEditItem({ ...editItem, price: e.target.value })}
                className="w-full border rounded p-2"
              />

              <label className="block text-sm font-medium">Location</label>
              <input
                type="text"
                value={editItem.location ?? editItem.city ?? ""}
                onChange={(e) => setEditItem({ ...editItem, location: e.target.value })}
                className="w-full border rounded p-2"
              />

              <label className="block text-sm font-medium">Status</label>
              <select
                value={editItem.status ?? "draft"}
                onChange={(e) => setEditItem({ ...editItem, status: e.target.value })}
                className="w-full border rounded p-2"
              >
                <option value="published">Published</option>
                <option value="pending">Pending</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button onClick={() => { setIsModalOpen(false); setEditItem(null); }} className="bg-gray-200 text-gray-700">
                Cancel
              </Button>
              <Button onClick={handleModalSave} className="bg-blue-600 text-white" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPropertiesSales;
