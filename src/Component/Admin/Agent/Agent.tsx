// Agent.jsx
import React, { useEffect, useState } from 'react';
import AgentCard from './AgentCard';
import { CgProfile } from 'react-icons/cg';
import { IoMdClose } from 'react-icons/io';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const API_BASE =
  import.meta.env.VITE_API_BASE || 'https://api.eastmondvillas.com/api';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'agent',
  permission: 'download',
  address: '',
  is_active: true,
};

const safe = (v, fallback = '') =>
  v === null || v === undefined ? fallback : v;

export default function Agent() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const navigate = useNavigate();

  // helper for auth header
  const getAuthHeader = () => {
    const t = localStorage.getItem('auth_access');
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  // 🔄 fetch list from /api/agents/
  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/agents/`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          (data && (data.detail || JSON.stringify(data))) ||
            `Error ${res.status}`
        );
      }

      const data = await res.json();

      // 🔍 FULL API response log
      console.log('Agents API raw response (/api/agents/):', data);

      const rawList = Array.isArray(data)
        ? data
        : data?.results ?? data?.items ?? [];

      const list = rawList
        // in case backend somehow returns non-agent users too
        .filter((u) => (u.role ?? 'agent') === 'agent')
        .map((u) => {
          const assignedTotal =
            Number(u.assigned_total_property ?? 0) || 0;

          // per-agent debug
          console.log('Mapped agent item:', {
            id: u.id,
            name: u.name,
            email: u.email,
            assigned_total_property: u.assigned_total_property,
            used_assigned_total_property: assignedTotal,
          });

          return {
            id: u.id ?? u.pk,
            name: u.name ?? '',
            email: u.email ?? '',
            phone: u.phone ?? '',
            role: (u.role ?? 'agent').toString(),
            permission: u.permission ?? u.permissions ?? 'download',
            // 🔥 properties based on assigned_total_property
            propertiesCount: assignedTotal,
            assigned_total_property: assignedTotal,
            is_active:
              typeof u.is_active === 'boolean'
                ? u.is_active
                : true,
            status:
              typeof u.is_active === 'boolean' && !u.is_active
                ? 'inactive'
                : 'active',
            lastLogin: u.lastLogin ?? u.last_login ?? null,
            address: u.address ?? null,
            __raw: u,
          };
        });

      setAgents(list);
    } catch (err) {
      console.error('Fetch agents failed:', err);
      toast.error(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  // Add agent
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email || !addForm.password) {
      Swal.fire({
        icon: 'error',
        title: 'Validation',
        text: 'Name, email and password are required.',
      });
      return;
    }

    const payload = {
      email: addForm.email,
      name: addForm.name,
      phone: addForm.phone || null,
      role: addForm.role,
      permission: addForm.permission,
      password: addForm.password,
      address: addForm.address || null,
      is_active: Boolean(addForm.is_active),
    };

    try {
      // NOTE: still using admin endpoint for create
      const res = await fetch(`${API_BASE}/admin/users/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          (data && (data.detail || JSON.stringify(data))) ||
            `Error ${res.status}`
        );
      }
      await res.json();
      toast.success('Agent added');
      setIsAddOpen(false);
      setAddForm(emptyForm);
      await fetchAgents();
    } catch (err) {
      console.error('Add agent failed:', err);
      Swal.fire({
        icon: 'error',
        title: 'Add failed',
        text: String(err.message || err),
      });
    }
  };

  // Open edit modal
  const openEdit = (agent) => {
    setEditForm({
      ...agent,
      name: safe(agent.name, ''),
      email: safe(agent.email, ''),
      phone: safe(agent.phone, ''),
      role: safe(agent.role, 'agent'),
      permission: safe(agent.permission, 'download'),
      address: safe(agent.address, ''),
      is_active: !!agent.is_active,
    });
    setIsEditOpen(true);
  };

  // Save edit (PUT to admin/users/:id/)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm) return;
    const payload = {
      email: editForm.email,
      name: editForm.name,
      phone: editForm.phone || null,
      role: editForm.role,
      permission: editForm.permission,
      address: editForm.address || null,
      is_active: Boolean(editForm.is_active),
    };

    try {
      const res = await fetch(`${API_BASE}/admin/users/${editForm.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          (data && (data.detail || JSON.stringify(data))) ||
            `Error ${res.status}`
        );
      }
      await res.json().catch(() => null);
      toast.success('Agent updated');
      setIsEditOpen(false);
      setEditForm(null);
      await fetchAgents();
    } catch (err) {
      console.error('Edit failed:', err);
      Swal.fire({
        icon: 'error',
        title: 'Update failed',
        text: String(err.message || err),
      });
    }
  };

  // Toggle active/inactive (PATCH only is_active)
  const toggleActive = async (agent) => {
    const newState = !Boolean(agent.is_active);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${agent.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ is_active: newState }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          (data && (data.detail || JSON.stringify(data))) ||
            `Error ${res.status}`
        );
      }

      await res.json().catch(() => null);
      toast.success(newState ? 'Activated' : 'Deactivated');
      await fetchAgents();
    } catch (err) {
      console.error('Toggle failed:', err);
      Swal.fire({
        icon: 'error',
        title: 'Action failed',
        text: String(err.message || err),
      });
    }
  };

  // Delete with Swal
  const deleteAgent = async (agent) => {
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

    try {
      const res = await fetch(`${API_BASE}/admin/users/${agent.id}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      });

      if (res.status === 204) {
        await Swal.fire({
          title: 'Deleted!',
          text: 'User deleted.',
          icon: 'success',
        });
        toast.success('Deleted');
        await fetchAgents();
      } else {
        const data = await res.json().catch(() => null);
        throw new Error(
          (data && (data.detail || JSON.stringify(data))) ||
            `Error ${res.status}`
        );
      }
    } catch (err) {
      console.error('Delete failed:', err);
      Swal.fire({
        icon: 'error',
        title: 'Delete failed',
        text: String(err.message || err),
      });
    }
  };

  // Manage properties -> navigate to route with query param
  const manageProperties = (agent) => {
    navigate(
      `/dashboard/admin-manage-property?agent=${encodeURIComponent(agent.id)}`
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mt-5">
        <div>
          <h1 className="text-3xl font-semibold">Agent</h1>
          <p className="text-gray-500">Manage agent and admin accounts</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-[#009689] text-white flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-colors duration-150"
        >
          <CgProfile className="h-5 w-5" /> Add Agent
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 p-6 rounded-lg shadow-lg flex flex-col items-center pointer-events-auto">
            <svg
              className="animate-spin h-10 w-10 text-teal-600 mb-3"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <div className="text-sm text-gray-700">Loading Agents...</div>
          </div>
        </div>
      )}

      {/* Add modal */}
      {isAddOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-black/40">
          <div className="bg-white border-2 rounded-lg p-6 w-full max-w-2xl shadow-lg relative">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <IoMdClose className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-semibold mb-2">Add New Agent</h2>
            <form
              onSubmit={handleAddSubmit}
              className="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="md:col-span-2">
                <label className="block text-gray-700 text-sm font-medium">
                  Name
                </label>
                <input
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium">
                  Email
                </label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, email: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text.sm font-medium">
                  Phone
                </label>
                <input
                  value={addForm.phone}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="Enter your phone number"
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium">
                  Role
                </label>
                <select
                  value={addForm.role}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, role: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="agent">Agent</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium">
                  Permission
                </label>
                <select
                  value={addForm.permission}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, permission: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="download">Download</option>
                  <option value="only_view">View Only</option>
                  <option value="full_access">Full Access</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium">
                  Password
                </label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder="Enter your password"
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={Boolean(addForm.is_active)}
                  onChange={(e) =>
                    setAddForm((p) => ({
                      ...p,
                      is_active: e.target.checked,
                    }))
                  }
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Active
                </label>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full bg-[#009689] text-white py-2 rounded"
                >
                  Create Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {isEditOpen && editForm && (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-black/40">
          <div className="bg-white border-2 rounded-lg p-6 w-full max-w-2xl shadow-lg relative">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <IoMdClose className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-semibold mb-2">Edit Agent</h2>
            <form
              onSubmit={handleEditSubmit}
              className="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="md:col-span-2">
                <label className="block text-gray-700 text-sm font-medium">
                  Name
                </label>
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium">
                  Email
                </label>
                <input
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, email: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium">
                  Phone
                </label>
                <input
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium">
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, role: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="agent">Agent</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium">
                  Permission
                </label>
                <select
                  value={editForm.permission}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      permission: e.target.value,
                    }))
                  }
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="download">Download</option>
                  <option value="only_view">View Only</option>
                  <option value="full_access">Full Access</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium">
                  Address
                </label>
                <input
                  value={editForm.address || ''}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, address: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="edit_active"
                  type="checkbox"
                  checked={Boolean(editForm.is_active)}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      is_active: e.target.checked,
                    }))
                  }
                />
                <label htmlFor="edit_active" className="text-sm text-gray-700">
                  Active
                </label>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full bg-[#009689] text-white py-2 rounded"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onEdit={(a) => openEdit(a)}
            onManageProperties={(a) => manageProperties(a)}
            onToggleActive={(a) => toggleActive(a)}
            onDelete={(a) => deleteAgent(a)}
          />
        ))}
      </div>
    </div>
  );
}
