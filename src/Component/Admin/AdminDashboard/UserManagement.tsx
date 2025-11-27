import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import toast from 'react-hot-toast';

/**
 * UserManagement.jsx
 *
 * - Current user is always shown at top (sortUsers).
 * - Current user may edit their NAME only. Other fields are read-only for them.
 * - Any attempt to change other fields for current user shows a meaningful Swal/toast.
 * - Delete/Update use Swal confirmation and dual toast feedback (react-hot-toast + Swal fallback).
 * - Roles available: customer, agent, admin.
 */

const initialUsers = [
  {
    id: 1,
    name: 'Ayesha Khan',
    email: 'ayesha.khan@example.com',
    role: 'manager',
  },
  { id: 2, name: 'Rafi Ahmed', email: 'rafi.ahmed@example.com', role: 'agent' },
  { id: 3, name: 'Minu Roy', email: 'minu.roy@example.com', role: 'customer' },
  {
    id: 4,
    name: 'Sabbir Hossain',
    email: 'sabbir.hossain@example.com',
    role: 'agent',
  },
  {
    id: 5,
    name: 'Kamal Uddin',
    email: 'kamal.uddin@example.com',
    role: 'manager',
  },
];

const ROLE_FILTERS = ['all', 'customer', 'agent', 'admin'];
const ALL_ROLES = ['customer', 'agent', 'admin'];
const API_BASE =
  import.meta.env.VITE_API_BASE || 'https://api.eastmondvillas.com/api';

/* Small helper to show a SweetAlert2 toast fallback */
const showToast = (title, icon = 'success', timer = 2500) => {
  Swal.fire({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    icon,
    title,
  });
};

export default function UserManagement() {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState({});
  const [editing, setEditing] = useState({});
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all'); // dropdown filter

  // Try to derive current user's email from common localStorage keys
  const getCurrentUserEmail = () => {
    try {
      const raw =
        localStorage.getItem('auth_user') ||
        localStorage.getItem('user') ||
        localStorage.getItem('current_user');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.email) return parsed.email;
        } catch (e) {
          if (raw.includes('@')) return raw;
        }
      }
      const keys = ['auth_user_email', 'user_email', 'email', 'auth_email'];
      for (const k of keys) {
        const v = localStorage.getItem(k);
        if (v && v.includes('@')) return v;
      }
    } catch (e) {
      // ignore
    }
    return null;
  };

  const currentUserEmail = getCurrentUserEmail();

  // Helper to move current user to top (preserves order otherwise)
  const sortUsers = (list) => {
    if (!currentUserEmail) return list;
    const lower = currentUserEmail.toLowerCase();
    const copy = Array.isArray(list) ? [...list] : [];
    const idx = copy.findIndex(
      (u) => u && u.email && u.email.toLowerCase() === lower
    );
    if (idx > -1) {
      const [me] = copy.splice(idx, 1);
      return [me, ...copy];
    }
    return copy;
  };

  const getAuthHeader = () => {
    try {
      const t = localStorage.getItem('auth_access');
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
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          const msg =
            (data && (data.detail || JSON.stringify(data))) ||
            `Error ${res.status}`;
          throw new Error(msg);
        }
        const data = await res.json();
        if (isMounted && Array.isArray(data)) setUsers(sortUsers(data));
      } catch (err) {
        console.error('Failed to fetch users:', err);
        if (isMounted) setError(err.message || 'Failed to fetch users');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchUsers();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // currentUserEmail not included intentionally (derived from localStorage on mount)

  // Apply both text search and role filter
  const filtered = users.filter((u) => {
    const matchesQuery =
      (u.name || '').toLowerCase().includes(query.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(query.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(query.toLowerCase());
    const matchesFilter = roleFilter === 'all' ? true : u.role === roleFilter;
    return matchesQuery && matchesFilter;
  });

  function startEdit(user) {
    const isCurrentUser =
      currentUserEmail &&
      user.email &&
      currentUserEmail.toLowerCase() === user.email.toLowerCase();

    if (isCurrentUser) {
      // allow name editing only
      setEditing((s) => ({ ...s, [user.id]: { name: user.name } }));
      return;
    }

    // normal full-editable user
    setEditing((s) => ({
      ...s,
      [user.id]: { name: user.name, email: user.email, role: user.role },
    }));
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

    const user = users.find((u) => u.id === id);
    if (!user) return;

    const isCurrentUser =
      currentUserEmail &&
      user.email &&
      currentUserEmail.toLowerCase() === user.email.toLowerCase();

    // Validation
    if (!edits.name || edits.name.trim() === '') {
      Swal.fire({
        icon: 'error',
        title: 'Validation',
        text: 'Name is required.',
      });
      return;
    }

    // If current user, ensure only name changed — reject other field changes
    if (isCurrentUser) {
      // if edits contain any key other than name and it's different from original => block
      const otherKeys = Object.keys(edits).filter((k) => k !== 'name');
      if (otherKeys.length > 0) {
        // If any other key changed, reject
        for (const k of otherKeys) {
          if ((edits[k] ?? '') !== (user[k] ?? '')) {
            Swal.fire({
              icon: 'warning',
              title: 'Action not allowed',
              text: 'You may only update your name here. To change email or role, use profile or contact an admin.',
            });
            toast.error(
              'Cannot update email or role for your own account here.'
            );
            return;
          }
        }
      }
    }

    setActionInProgress((s) => ({ ...s, [id]: true }));
    const old = users.find((x) => x.id === id);
    const oldData = old
      ? { name: old.name, email: old.email, role: old.role }
      : null;

    // optimistic update
    setUsers((prev) =>
      sortUsers(prev.map((u) => (u.id === id ? { ...u, ...edits } : u)))
    );

    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(
          isCurrentUser
            ? // only send name change for current user for safety
              { name: edits.name }
            : { name: edits.name, email: edits.email, role: edits.role }
        ),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg =
          (data && (data.detail || JSON.stringify(data))) ||
          `Error ${res.status}`;
        throw new Error(msg);
      }

      const updated = await res.json().catch(() => null);
      if (updated) {
        // merge server response and ensure current user stays top
        setUsers((prev) =>
          sortUsers(prev.map((u) => (u.id === id ? { ...u, ...updated } : u)))
        );
      }

      cancelEdit(id);

      // SUCCESS: show both react-hot-toast and SweetAlert2 fallback for reliability
      toast.success('User updated successfully', { duration: 3000 });
      showToast('User updated successfully', 'success', 2500);
    } catch (err) {
      console.error('Failed to save user:', err);
      const message = err && err.message ? err.message : 'Unknown error';
      Swal.fire({ icon: 'error', title: 'Update failed', text: message });
      // fallback toast
      toast.error('Update failed');
      showToast('Update failed', 'error', 3000);

      if (oldData)
        setUsers((prev) =>
          sortUsers(prev.map((u) => (u.id === id ? { ...u, ...oldData } : u)))
        );
    } finally {
      setActionInProgress((s) => {
        const clone = { ...s };
        delete clone[id];
        return clone;
      });
    }
  }

  // delete with Swal confirmation
  async function handleDelete(id) {
    const u = users.find((x) => x.id === id);
    if (!u) return;

    // prevent deleting own account
    if (
      currentUserEmail &&
      u.email &&
      currentUserEmail.toLowerCase() === u.email.toLowerCase()
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Action not allowed',
        text: 'You cannot delete your own account from here.',
      });
      toast.error('Cannot delete your own account.');
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (!result.isConfirmed) return;

    setActionInProgress((s) => ({ ...s, [id]: true }));
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      });

      if (res.status === 204) {
        setUsers((prev) => {
          const updated = prev.filter((x) => x.id !== id);
          return sortUsers(updated);
        });
        cancelEdit(id);

        await Swal.fire({
          title: 'Deleted!',
          text: 'User has been deleted.',
          icon: 'success',
        });

        // dual toast on delete success as well
        toast.success('User deleted');
        showToast('User deleted', 'success', 2500);
      } else {
        const data = await res.json().catch(() => null);
        const msg =
          (data && (data.detail || JSON.stringify(data))) ||
          `Error ${res.status}`;
        throw new Error(msg);
      }
    } catch (err) {
      console.error('Delete failed:', err);
      const message = err && err.message ? err.message : 'Unknown error';
      Swal.fire({ icon: 'error', title: 'Delete failed', text: message });
      toast.error('Delete failed');
      showToast('Delete failed', 'error', 3000);
    } finally {
      setActionInProgress((s) => {
        const clone = { ...s };
        delete clone[id];
        return clone;
      });
    }
  }

  const pretty = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div>
        {/* TOP ROW: role filter, centered search, title + total count */}
        <div className="mb-6 flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-semibold mb-1">
            User Management
          </h1>

          {/* total count */}
          <div className="text-sm text-gray-600 mb-1">
            Total users: <strong>{users.length}</strong>
          </div>

          <div className="w-full max-w-lg">
            <input
              type="search"
              placeholder="Search name, email or role"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 text-center"
            />
          </div>

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
                  {rf === 'all' ? 'All' : pretty(rf)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="mb-3 text-xs text-gray-500">Loading users...</div>
        )}
        {error && (
          <div className="mb-3 text-xs text-red-600">Error: {error}</div>
        )}

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
                const isCurrentUser =
                  currentUserEmail &&
                  user.email &&
                  currentUserEmail.toLowerCase() === user.email.toLowerCase();

                return (
                  <tr key={user.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>

                    {/* Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editVals.name}
                          onChange={(e) =>
                            setEditField(user.id, 'name', e.target.value)
                          }
                          className="w-56 px-2 py-1 border rounded-md text-sm"
                        />
                      ) : (
                        <div>{user.name}</div>
                      )}
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {isEditing ? (
                        // if current user, show disabled email input; otherwise editable
                        isCurrentUser ? (
                          <input
                            type="email"
                            value={user.email}
                            disabled
                            className="w-64 px-2 py-1 border rounded-md text-sm bg-gray-50 cursor-not-allowed text-gray-500"
                          />
                        ) : (
                          <input
                            type="email"
                            value={editVals.email}
                            onChange={(e) =>
                              setEditField(user.id, 'email', e.target.value)
                            }
                            className="w-64 px-2 py-1 border rounded-md text-sm"
                          />
                        )
                      ) : (
                        user.email
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        isCurrentUser ? (
                          <select
                            value={user.role}
                            disabled
                            className="px-3 py-2 border rounded-md text-sm bg-gray-50 cursor-not-allowed text-gray-500"
                          >
                            <option>{pretty(user.role)}</option>
                          </select>
                        ) : (
                          <select
                            value={editVals.role}
                            onChange={(e) =>
                              setEditField(user.id, 'role', e.target.value)
                            }
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
                        )
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
                            style={{ backgroundColor: '#059669' }}
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
                            className={`px-3 py-2 rounded-md text-sm font-medium border`}
                            aria-label={`Edit ${user.name}`}
                            title={
                              isCurrentUser
                                ? 'You can edit your name here only.'
                                : `Edit ${user.name}`
                            }
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="flex items-center justify-center gap-2 px-3 py-2 rounded-md text-white text-sm"
                            style={{ backgroundColor: '#DC2626' }}
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
                  <td
                    colSpan={5}
                    className="px-6 py-6 text-center text-gray-500"
                  >
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
            const isCurrentUser =
              currentUserEmail &&
              user.email &&
              currentUserEmail.toLowerCase() === user.email.toLowerCase();

            return (
              <div
                key={user.id}
                className="bg-white border rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={editVals.name}
                          onChange={(e) =>
                            setEditField(user.id, 'name', e.target.value)
                          }
                          className="w-full px-2 py-1 border rounded-md text-sm mb-1"
                        />

                        {isCurrentUser ? (
                          <input
                            type="email"
                            value={user.email}
                            disabled
                            className="w-full px-2 py-1 border rounded-md text-sm bg-gray-50 cursor-not-allowed text-gray-500"
                          />
                        ) : (
                          <input
                            type="email"
                            value={editVals.email}
                            onChange={(e) =>
                              setEditField(user.id, 'email', e.target.value)
                            }
                            className="w-full px-2 py-1 border rounded-md text-sm"
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-semibold">{user.name}</div>
                        <div className="text-xs text-gray-600">
                          {user.email}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-gray-500">Role</div>

                    {isEditing ? (
                      isCurrentUser ? (
                        <select
                          value={user.role}
                          disabled
                          className="mt-1 px-2 py-1 border rounded-md text-sm bg-gray-50 cursor-not-allowed text-gray-500"
                        >
                          <option>{pretty(user.role)}</option>
                        </select>
                      ) : (
                        <select
                          value={editVals.role}
                          onChange={(e) =>
                            setEditField(user.id, 'role', e.target.value)
                          }
                          className="mt-1 px-2 py-1 border rounded-md text-sm"
                          disabled={Boolean(actionInProgress[user.id])}
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {pretty(r)}
                            </option>
                          ))}
                        </select>
                      )
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
                        style={{ backgroundColor: '#059669' }}
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
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-md text-white text-sm"
                        style={{ backgroundColor: '#DC2626' }}
                        disabled={Boolean(actionInProgress[user.id])}
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

          {filtered.length === 0 && (
            <div className="text-center text-sm text-gray-500">
              No users found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
