// File: ManageProperties.tsx
import React, { useEffect, useState } from 'react';
import { ChevronLeft, Check, Save, Home, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * ManageProperties.tsx
 * - UI/design preserved exactly from your provided component
 * - Fetches all properties pages from: https://api.eastmondvillas.com/api/villas/properties/?page=1
 * - Pre-selects items where assigned_agent === agentId
 * - PATCHes changed properties using FormData (multipart) to avoid 415 Unsupported Media Type
 * - On Save: logs full API responses to console and shows user-friendly summary alert
 *
 * Usage:
 *  <ManageProperties agentId={87} agentName="John Smith" />
 */

// ---------- CONFIG ----------
const API_BASE = 'https://api.eastmondvillas.com';
const PROPERTIES_PATH = '/api/villas/properties/'; // used with ?page=1
const PROPERTY_PATCH = (id: number | string) =>
  `${API_BASE.replace(/\/+$/, '')}/api/villas/properties/${id}/`;
const AGENT_ID_DEFAULT = 87; // override by passing prop

// ---------- SMALL UI HELPERS (unchanged look) ----------
const PropertyStatusBadge = ({ status }: { status?: string }) => {
  let classes = '';
  const st = String(status ?? '').toLowerCase();
  switch (st) {
    case 'published':
      classes = 'bg-green-100 text-green-700';
      break;
    case 'pending':
    case 'pending review':
      classes = 'bg-yellow-100 text-yellow-700';
      break;
    case 'draft':
      classes = 'bg-gray-100 text-gray-700';
      break;
    default:
      classes = 'bg-gray-100 text-gray-700';
  }
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${classes} whitespace-nowrap capitalize`}
    >
      {status}
    </span>
  );
};

const PropertyListItem = ({ property, isSelected, onToggle }: any) => (
  <div
    className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition duration-150 border w-full ${
      isSelected
        ? 'border-gray-500 bg-blue-50 shadow-md'
        : 'border-gray-200 bg-white hover:bg-gray-50'
    }`}
    onClick={() => onToggle(property.id)}
  >
    <div className="flex items-center flex-grow min-w-0">
      <div
        className={`w-5 h-5 mr-4 flex items-center justify-center border-2 rounded-full transition duration-150 ${
          isSelected
            ? 'bg-gray-600 border-gray-600'
            : 'bg-white border-gray-400'
        }`}
      >
        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
      </div>

      <img
        src={property.imageUrl}
        alt={property.name}
        className="w-28 h-20 object-cover rounded-md mr-4 flex-shrink-0"
        onError={(e: any) => {
          e.target.onerror = null;
          e.target.src = 'https://placehold.co/120x80/cccccc/333333?text=N/A';
        }}
      />

      <div className="flex-grow min-w-0">
        <p className="text-lg font-semibold text-gray-800 truncate">
          {property.name}
        </p>
        <p className="text-sm text-gray-500 truncate">{property.location}</p>
      </div>
    </div>

    <PropertyStatusBadge status={property.status} />
  </div>
);

// ---------- MAIN COMPONENT ----------
type ManagePropertiesProps = {
  agentId?: number;
  agentName?: string;
};

export default function ManageProperties({
  agentId = AGENT_ID_DEFAULT,
  agentName = 'John Smith',
}: ManagePropertiesProps) {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'sales' | 'rentals'>('sales');
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<number[]>([]);
  const [initialAssignedIds, setInitialAssignedIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  // If you have an auth token in localStorage, include Authorization header
  function authHeaders(): Record<string, string> {
    try {
      const token =
        localStorage.getItem('auth_access') ||
        localStorage.getItem('access_token') ||
        localStorage.getItem('token');
      if (token) return { Authorization: `Bearer ${token}` };
    } catch (e) {
      // ignore
    }
    return {};
  }

  // normalize API property into the UI shape (keeps your design)
  function normalizeProperty(p: any) {
    return {
      id: p.id,
      name: p.title ?? p.name ?? `Untitled #${p.id}`,
      location: p.address ?? p.city ?? '',
      status: p.status ?? 'draft',
      type: (p.listing_type ?? p.type ?? '')
        .toString()
        .toLowerCase()
        .includes('rent')
        ? 'rentals'
        : 'sales',
      imageUrl:
        (p.media_images && p.media_images[0] && p.media_images[0].image) ||
        p.main_image_url ||
        p.imageUrl ||
        'https://placehold.co/120x80/cccccc/333333?text=N/A',
      raw: p,
      assigned_agent: p.assigned_agent ?? null,
    };
  }

  // Fetch all pages of properties following `next`
  async function fetchAllPropertiesPages() {
    setLoading(true);
    setError(null);
    try {
      let url: string | null = `${API_BASE}${PROPERTIES_PATH}?page=1`;
      const acc: any[] = [];
      while (url) {
        const res = await fetch(url, { headers: { ...authHeaders() } });
        if (!res.ok)
          throw new Error(`Failed to fetch properties (${res.status})`);
        const json = await res.json();
        const list = Array.isArray(json.results)
          ? json.results
          : (json.data ?? []);
        acc.push(...list);

        if (json.next) {
          url = json.next.startsWith('http')
            ? json.next
            : `${API_BASE}${json.next}`;
        } else {
          url = null;
        }
      }

      const normalized = acc.map(normalizeProperty);
      setProperties(normalized);

      // Pre-select those assigned to this agent
      const preselected = normalized
        .filter((p) => Number(p.assigned_agent) === Number(agentId))
        .map((p) => p.id);
      setSelectedPropertyIds(preselected);
      setInitialAssignedIds(preselected);
    } catch (err: any) {
      console.error('fetchAllPropertiesPages error:', err);
      setError(err?.message || 'Failed to load properties');
      setProperties([]);
      setSelectedPropertyIds([]);
      setInitialAssignedIds([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAllPropertiesPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // toggle selection
  const handleToggleProperty = (propertyId: number) => {
    setSelectedPropertyIds((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  // Use FormData for PATCH body to avoid 415 Unsupported Media Type
  // Return a detailed object: { propertyId, ok, status, bodyText, bodyJson? }
  async function patchAssignedAgent(
    propertyId: number,
    assignedValue: number | null
  ) {
    const fd = new FormData();
    // Many backends accept empty value to clear; adjust if your backend expects 'null' string instead
    fd.append(
      'assigned_agent',
      assignedValue === null ? '' : String(assignedValue)
    );

    const headers = { ...authHeaders() }; // DO NOT set Content-Type manually
    const res = await fetch(PROPERTY_PATCH(propertyId), {
      method: 'PATCH',
      headers,
      body: fd,
    });

    const result: any = { propertyId, ok: res.ok, status: res.status };

    // attempt to parse JSON, otherwise grab text
    try {
      const text = await res.text();
      // try parse JSON from text
      try {
        result.bodyJson = JSON.parse(text);
        result.bodyText = JSON.stringify(result.bodyJson);
      } catch {
        result.bodyText = text;
      }
    } catch (e) {
      result.bodyText = '';
    }

    if (!res.ok) {
      // throw with the result attached so Promise.allSettled captures useful info
      const err = new Error(`Patch ${propertyId} failed (${res.status})`);
      (err as any).detail = result;
      throw err;
    }

    return result;
  }

  // Save only changed properties
  async function handleSaveAssignments() {
    setSaving(true);
    try {
      const before = new Set(initialAssignedIds);
      const after = new Set(selectedPropertyIds);

      const toAssign = Array.from(after).filter((id) => !before.has(id));
      const toUnassign = Array.from(before).filter((id) => !after.has(id));

      const requests: Promise<any>[] = [];

      for (const id of toAssign)
        requests.push(patchAssignedAgent(id, Number(agentId)));
      for (const id of toUnassign) requests.push(patchAssignedAgent(id, null));

      if (requests.length === 0) {
        alert('No changes to save.');
        setSaving(false);
        return;
      }

      const settled = await Promise.allSettled(requests);

      // Build detailed result arrays
      const successes: any[] = [];
      const failures: any[] = [];

      settled.forEach((s) => {
        if (s.status === 'fulfilled') {
          successes.push(s.value);
        } else {
          // promise rejected; reason may be Error with .detail attached
          const reason = (s as PromiseRejectedResult).reason;
          if (reason && reason.detail) {
            failures.push(reason.detail);
          } else {
            failures.push({ message: String(reason) });
          }
        }
      });

      // Log full API responses to console
      console.group('ManageProperties · SaveAssignments Results');
      console.log('Assigned (successful):', successes);
      console.log('Failed:', failures);
      console.groupEnd();

      // Show user-friendly summary and point to console for full details
      if (failures.length === 0) {
        alert(
          `Assignments updated successfully. ${successes.length} request(s) succeeded. Full responses logged to console.`
        );
      } else {
        alert(
          `Completed with errors. ${successes.length} succeeded, ${failures.length} failed. Check console for full responses.`
        );
      }

      // Refresh to canonical server state (and re-select accordingly)
      await fetchAllPropertiesPages();
    } catch (err: any) {
      console.error('handleSaveAssignments error:', err);
      alert('Failed to save assignments: ' + (err?.message || 'Unknown'));
    } finally {
      setSaving(false);
    }
  }

  const handleCancel = () => {
    // revert to initial assigned ids
    setSelectedPropertyIds([...initialAssignedIds]);
    alert('Assignment Cancelled.');
  };

  // Filter properties for UI tabs (sales/rentals) — design unchanged
  const filteredProperties = properties.filter((p) => {
    if (activeTab === 'sales') return (p.type ?? 'sales') === 'sales';
    return (p.type ?? 'sales') === 'rentals';
  });

  const selectedCount = selectedPropertyIds.length;

  return (
    <div className="p-6 md:p-10 flex flex-col items-center">
      <div className="w-full bg-white rounded-xl p-6 md:p-8">
        {/* Header */}
        <header className="mb-8 border-b border-gray-100 pb-4">
          <Link
            to="/dashboard/admin-agent"
            className="flex items-center text-gray-500 w-15 hover:text-gray-800 transition-colors mb-4"
            aria-label="Back to Agent List"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">Back</span>
          </Link>

          <h1 className="text-2xl font-bold text-gray-800">
            Assign Properties to Agent
          </h1>
          <p className="text-xl font-medium text-gray-500 mt-1">{agentName}</p>
        </header>

        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Select Properties
        </h2>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${activeTab === 'sales' ? 'bg-[#009689] text-white border-[#009689]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('sales')}
          >
            <Home className="w-4 h-4" /> Properties Sales
          </button>

          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${activeTab === 'rentals' ? 'bg-[#009689] text-white border-[#009689]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('rentals')}
          >
            <Building2 className="w-4 h-4" /> Properties Rentals
          </button>
        </div>

        {/* Property Selection List */}
        <main className="space-y-4 mb-8">
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {loading && (
              <div className="text-sm text-gray-500">Loading properties…</div>
            )}
            {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

            {filteredProperties.map((property) => (
              <PropertyListItem
                key={property.id}
                property={property}
                isSelected={selectedPropertyIds.includes(property.id)}
                onToggle={handleToggleProperty}
              />
            ))}

            {!loading && filteredProperties.length === 0 && (
              <p className="text-center text-gray-500 py-6">
                No properties available in this category.
              </p>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="flex justify-between items-center pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 font-medium">
            {selectedCount} property{selectedCount !== 1 ? 's' : ''} selected
          </p>
          <div className="flex space-x-3">
            <button
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 flex items-center bg-teal-600 text-white rounded-lg font-medium shadow-md hover:bg-teal-700 transition"
              onClick={handleSaveAssignments}
              disabled={saving}
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Saving...' : 'Save Assignments'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
