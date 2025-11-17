import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import toast from "react-hot-toast";

/**
 * UserManagement.jsx
 *
 * Changes in this version:
 * 1. Total user count display added.
 * 2. 'manager' role removed from initial data and role lists.
 * 3. Self-editing prevention added: The logged-in user (simulated as ID 1) cannot click 'Edit'.
 * 4. Self-edit attempt results in a SweetAlert2 error toast.
 * 5. Save and Delete confirmation/success messages use Swal/Toast as before.
 */

// --- Simulating current user ID (MUST be dynamic in a real app) ---
// For the purpose of this example, we assume the current logged-in user has ID 1.
// In a real application, this value would come from your auth context/state.
const CURRENT_USER_ID = 1;
// -----------------------------------------------------------------

const initialUsers = [
  { id: 1, name: "Ayesha Khan", email: "ayesha.khan@example.com", role: "admin" }, // ID 1 is now 'admin'
  { id: 2, name: "Rafi Ahmed", email: "rafi.ahmed@example.com", role: "agent" },
  { id: 3, name: "Minu Roy", email: "minu.roy@example.com", role: "customer" },
  { id: 4, name: "Sabbir Hossain", email: "sabbir.hossain@example.com", role: "agent" },
  { id: 5, name: "Kamal Uddin", email: "kamal.uddin@example.com", role: "customer" }, // Changed from manager
];

// Removed 'manager' from all role lists
const ROLE_FILTERS = ["all", "customer", "agent", "admin"];
const ALL_ROLES = ["customer", "agent", "admin"];
const API_BASE = import.meta.env.VITE_API_BASE || "http://10.10.13.60:8000/api";

/* Small helper to show a SweetAlert2 toast (used for self-edit error and success) */
const showToast = (title, icon = "success", timer = 2500) => {
  Swal.fire({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    icon,
    title,
  });
};

export default function UserManagement() {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState({});
  const [editing, setEditing] = useState({});
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all"); // dropdown filter

  const getAuthHeader = () => {
    try {
      const t = localStorage.getItem("auth_access");
      return t ? { Authorization: `Bearer ${t}` } : {};
    } catch (e) {
      return {};
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/admin/users/`, {
          headers: { "Content-Type": "application/json", ...getAuthHeader() },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          const msg = (data && (data.detail || JSON.stringify(data))) || `Error ${res.status}`;
          throw new Error(msg);
        }
        const data = await res.json();
        // Filter out 'manager' role from fetched data for consistency
        const filteredData = data.filter(u => u.role !== 'manager');
        if (isMounted) setUsers(filteredData);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        if (isMounted) setError(err.message || "Failed to fetch users");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  // Apply both text search and role filter
  const filtered = users.filter((u) => {
    const matchesQuery =
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      (u.role || "").toLowerCase().includes(query.toLowerCase());
    // Ensure only roles in ALL_ROLES are considered for filter logic (though data should already be clean)
    const matchesFilter = roleFilter === "all" ? true : u.role === roleFilter;
    return matchesQuery && matchesFilter;
  });

  function startEdit(user) {
    // 1. Self-editing prevention logic
    if (user.id === CURRENT_USER_ID) {
        showToast("🚫 You cannot update your own data.", "error", 4000);
        return;
    }
    
    setEditing((s) => ({ ...s, [user.id]: { name: user.name, email: user.email, role: user.role } }));
  }

  function cancelEdit(id) {
    setEditing((s) => {
      const clone = { ...s };
      delete clone[id];
      return clone;
    });
  }

  function setEditField(id, field, value) {
    setEditing((s) => ({ ...s, [id]: { ...(s[id] || {}), [field]: value } }));
  }

  async function saveEdit(id) {
    const edits = editing[id];
    if (!edits) return;
    if (!edits.name || !edits.email) {
      Swal.fire({ icon: "error", title: "Validation", text: "Name and email are required." });
      return;
    }

    setActionInProgress((s) => ({ ...s, [id]: true }));
    const old = users.find((x) => x.id === id);
    const oldData = old ? { name: old.name, email: old.email, role: old.role } : null;

    // optimistic update
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...edits } : u)));

    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ name: edits.name, email: edits.email, role: edits.role }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = (data && (data.detail || JSON.stringify(data))) || `Error ${res.status}`;
        throw new Error(msg);
      }

      const updated = await res.json().catch(() => null);
      if (updated) setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));

      cancelEdit(id);

      // success toast
      showToast("User updated successfully");
    } catch (err) {
      console.error("Failed to save user:", err);
      Swal.fire({ icon: "error", title: "Update failed", text: err.message || "Unknown error" });
      if (oldData) setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...oldData } : u)));
    } finally {
      setActionInProgress((s) => {
        const clone = { ...s };
        delete clone[id];
        return clone;
      });
    }
  }

  // delete with Swal confirmation (your provided pattern), do API call only if confirmed
  async function handleDelete(id) {
    // 1. Self-deletion prevention logic
    if (id === CURRENT_USER_ID) {
        Swal.fire({ 
            icon: "error", 
            title: "Action Forbidden", 
            text: "You cannot delete your own user account.",
            confirmButtonColor: "#3085d6",
        });
        return;
    }

    const u = users.find((x) => x.id === id);
    if (!u) return;

    // show confirmation using the exact pattern you provided (colors reused)
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${u.name}. You won't be able to revert this!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    // user confirmed — perform delete
    setActionInProgress((s) => ({ ...s, [id]: true }));
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
      });

      if (res.status === 204) {
        setUsers((prev) => prev.filter((x) => x.id !== id));
        cancelEdit(id);

        // show success Swal (as in your snippet)
        await Swal.fire({
          title: "Deleted!",
          text: "The user has been deleted.",
          icon: "success",
          confirmButtonColor: "#3085d6",
        });

        // also show toast for consistency (optional)
        showToast("User deleted successfully");
      } else {
        const data = await res.json().catch(() => null);
        const msg = (data && (data.detail || JSON.stringify(data))) || `Error ${res.status}`;
        throw new Error(msg);
      }
    } catch (err) {
      console.error("Delete failed:", err);
      Swal.fire({ icon: "error", title: "Delete failed", text: err.message || "Unknown error" });
    } finally {
      setActionInProgress((s) => {
        const clone = { ...s };
        delete clone[id];
        return clone;
      });
    }
  }

  const pretty = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div>
        {/* TOP ROW: title, total count, search, filter */}
      <div className="mb-6 flex flex-col items-center justify-center gap-4">
  
            {/* CENTER: User Management Title & Count */}
  <h1 className="text-lg sm:text-xl font-semibold mb-1 text-center">
    User Management <span className="text-gray-500 text-base font-normal">({users.length} Total)</span>
  </h1>

            {/* CENTER: Search Bar Input Field */}
  <div className="w-full max-w-lg">
    <input
      type="search"
      placeholder="Search name, email or role"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 text-center"
    />
  </div>

            {/* LEFT: role filter dropdown (moved to left within its own container) */}
  <div className="flex items-center gap-2">
    <label htmlFor="roleFilter" className="sr-only">
      Role filter
    </label>
    <select
      id="roleFilter"
      value={roleFilter}
      onChange={(e) => setRoleFilter(e.target.value)}
      className="px-3 py-1 border rounded-md text-sm"
    >
      {ROLE_FILTERS.map((rf) => (
        <option key={rf} value={rf}>
          {rf === "all" ? "All" : pretty(rf)}
        </option>
      ))}
    </select>
  </div>
</div>

        {loading && <div className="mb-3 text-xs text-gray-500">Loading users...</div>}
        {error && <div className="mb-3 text-xs text-red-600">Error: {error}</div>}

        {/* Unified table */}
        <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-700">No</th>
                <th className="px-6 py-3 font-medium text-gray-700">Name</th>
                <th className="px-6 py-3 font-medium text-gray-700">Email</th>
                <th className="px-6 py-3 font-medium text-gray-700">Role</th>
                <th className="px-6 py-3 font-medium text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, index) => {
                const isEditing = Boolean(editing[user.id]);
                const editVals = editing[user.id] || {};
                const isCurrentUser = user.id === CURRENT_USER_ID;

                return (
                  <tr key={user.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>

                    {/* Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editVals.name}
                          onChange={(e) => setEditField(user.id, "name", e.target.value)}
                          className="w-56 px-2 py-1 border rounded-md text-sm"
                        />
                      ) : (
                        <div>{user.name} {isCurrentUser && <span className="text-xs text-red-500">(You)</span>}</div>
                      )}
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {isEditing ? (
                        <input
                          type="email"
                          value={editVals.email}
                          onChange={(e) => setEditField(user.id, "email", e.target.value)}
                          className="w-64 px-2 py-1 border rounded-md text-sm"
                        />
                      ) : (
                        user.email
                      )}
                    </td>

                    {/* Role: badge in non-edit, select only in edit */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <select
                          value={editVals.role}
                          onChange={(e) => setEditField(user.id, "role", e.target.value)}
                          className="px-3 py-2 border rounded-md text-sm"
                          aria-label={`Change role for ${user.name}`}
                          disabled={Boolean(actionInProgress[user.id])}
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {pretty(r)}
                            </option>
                          ))}
                        </select>

                         
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                            {pretty(user.role)}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveEdit(user.id)}
                            className="px-3 py-2 rounded-md text-sm font-medium text-white"
                            style={{ backgroundColor: "#059669" }}
                            disabled={Boolean(actionInProgress[user.id])}
                            aria-label={`Save ${user.name}`}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => cancelEdit(user.id)}
                            className="px-3 py-2 rounded-md text-sm font-medium border"
                            disabled={Boolean(actionInProgress[user.id])}
                            aria-label={`Cancel edit ${user.name}`}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(user)}
                            className="px-3 py-2 rounded-md text-sm font-medium border"
                            aria-label={`Edit ${user.name}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="flex items-center justify-center gap-2 px-3 py-2 rounded-md text-white text-sm"
                            style={{ backgroundColor: "#DC2626" }}
                            disabled={Boolean(actionInProgress[user.id])}
                            aria-label={`Delete ${user.name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden mt-6 space-y-4">
          {filtered.map((user) => {
            const isEditing = Boolean(editing[user.id]);
            const editVals = editing[user.id] || {};
                const isCurrentUser = user.id === CURRENT_USER_ID;

            return (
              <div key={user.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={editVals.name}
                          onChange={(e) => setEditField(user.id, "name", e.target.value)}
                          className="w-full px-2 py-1 border rounded-md text-sm mb-1"
                        />
                        <input
                          type="email"
                          value={editVals.email}
                          onChange={(e) => setEditField(user.id, "email", e.target.value)}
                          className="w-full px-2 py-1 border rounded-md text-sm"
                        />
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-semibold">{user.name} {isCurrentUser && <span className="text-xs text-red-500">(You)</span>}</div>
                        <div className="text-xs text-gray-600">{user.email}</div>
                      </>
                    )}
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-gray-500">Role</div>
                    {isEditing ? (
                      <select
                        value={editVals.role}
                        onChange={(e) => setEditField(user.id, "role", e.target.value)}
                        className="mt-1 px-2 py-1 border rounded-md text-sm"
                        disabled={Boolean(actionInProgress[user.id])}
                      >
                        {ALL_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {pretty(r)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="mt-1 flex items-center gap-2 justify-end">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                          {pretty(user.role)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(user.id)}
                        className="flex-1 px-3 py-2 rounded-md text-sm font-medium text-white"
                        style={{ backgroundColor: "#059669" }}
                        disabled={Boolean(actionInProgress[user.id])}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => cancelEdit(user.id)}
                        className="flex-1 px-3 py-2 rounded-md text-sm font-medium border"
                        disabled={Boolean(actionInProgress[user.id])}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button
                        onClick={() => startEdit(user)}
                        className="mb-2 w-full px-3 py-2 rounded-md text-sm font-medium border"
                        aria-label={`Edit ${user.name}`}
                        disabled={isCurrentUser} // Disable edit button for current user
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-md text-white text-sm"
                        style={{ backgroundColor: "#DC2626" }}
                        disabled={Boolean(actionInProgress[user.id]) || isCurrentUser} // Disable delete button for current user
                        aria-label={`Delete ${user.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && <div className="text-center text-sm text-gray-500">No users found.</div>}
        </div>
      </div>
    </div>
  );
}