// File: ManageProperties.tsx
import React, { useEffect, useState, useMemo } from "react";
import { ChevronLeft, Check, Save, Home, Building2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

/**
 * ManageProperties.tsx
 * - Reads agent id from prop OR URL query (?agent=4 or ?agentId=4)
 * - Uses effectiveAgentId for preselecting, optimistic updates and saves
 * - PATCH logic: try JSON first; if server returns 415, retry with FormData
 * - Console logs actions and responses
 */

// ---------- CONFIG ----------
const API_BASE = "https://api.eastmondvillas.com";
const PROPERTIES_PATH = "/api/villas/properties/"; // used with ?page=1
const PROPERTY_PATCH = (id: number | string) => `${API_BASE.replace(/\/+$/, "")}/api/villas/properties/${id}/`;

// ---------- SMALL UI HELPERS ----------
const PropertyStatusBadge = ({ status }: { status?: string }) => {
  let classes = "";
  const st = String(status ?? "").toLowerCase();
  switch (st) {
    case "published":
      classes = "bg-green-100 text-green-700";
      break;
    case "pending":
    case "pending review":
      classes = "bg-yellow-100 text-yellow-700";
      break;
    case "draft":
      classes = "bg-gray-100 text-gray-700";
      break;
    default:
      classes = "bg-gray-100 text-gray-700";
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${classes} whitespace-nowrap capitalize`}>
      {status}
    </span>
  );
};

const PropertyListItem = ({ property, isSelected, onToggle }: any) => (
  <div
    className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition duration-150 border w-full ${
      isSelected ? "border-gray-500 bg-blue-50 shadow-md" : "border-gray-200 bg-white hover:bg-gray-50"
    }`}
    onClick={() => onToggle(property.id)}
  >
    <div className="flex items-center flex-grow min-w-0">
      <div
        className={`w-5 h-5 mr-4 flex items-center justify-center border-2 rounded-full transition duration-150 ${
          isSelected ? "bg-gray-600 border-gray-600" : "bg-white border-gray-400"
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
          e.target.src = "https://placehold.co/120x80/cccccc/333333?text=N/A";
        }}
      />

      <div className="flex-grow min-w-0">
        <p className="text-lg font-semibold text-gray-800 truncate">{property.name}</p>
        <p className="text-sm text-gray-500 truncate">{property.location}</p>
      </div>
    </div>

    <PropertyStatusBadge status={property.status} />
  </div>
);

// ---------- MAIN COMPONENT ----------
type ManagePropertiesProps = {
  agentId?: number; // optional; URL ?agent=4 will be used if prop not provided
  agentName?: string;
};

export default function ManageProperties({ agentId, agentName = "John Smith" }: ManagePropertiesProps) {
  const location = useLocation();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"sales" | "rentals">("sales");
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<number[]>([]);
  const [initialAssignedIds, setInitialAssignedIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  // parse agent from query (if present)
  const queryAgent = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search);
      const v = params.get("agent") ?? params.get("agentId");
      if (!v) return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    } catch {
      return undefined;
    }
  }, [location.search]);

  // effective agent: prop > query param
  const effectiveAgentId = agentId ?? queryAgent;
  useEffect(() => {
    console.log("Resolved effectiveAgentId:", { propAgentId: agentId, queryAgent, effectiveAgentId });
  }, [agentId, queryAgent, effectiveAgentId]);

  // --- helpers ---
  function authHeaders(): Record<string, string> {
    try {
      const token =
        localStorage.getItem("auth_access") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");
      if (token) return { Authorization: `Bearer ${token}` };
    } catch (e) {}
    return {};
  }

  function normalizeProperty(p: any) {
    return {
      id: p.id,
      name: p.title ?? p.name ?? `Untitled #${p.id}`,
      location: p.address ?? p.city ?? "",
      status: p.status ?? "draft",
      type: (p.listing_type ?? p.type ?? "").toString().toLowerCase().includes("rent") ? "rentals" : "sales",
      imageUrl:
        (p.media_images && p.media_images[0] && p.media_images[0].image) ||
        p.main_image_url ||
        p.imageUrl ||
        "https://placehold.co/120x80/cccccc/333333?text=N/A",
      raw: p,
      assigned_agent: p.assigned_agent ?? null,
    };
  }

  async function fetchAllPropertiesPages() {
    setLoading(true);
    setError(null);
    try {
      let url: string | null = `${API_BASE}${PROPERTIES_PATH}?page=1`;
      const acc: any[] = [];
      while (url) {
        const res = await fetch(url, { headers: { ...authHeaders() } });
        if (!res.ok) throw new Error(`Failed to fetch properties (${res.status})`);
        const json = await res.json();
        const list = Array.isArray(json.results) ? json.results : json.data ?? [];
        acc.push(...list);
        if (json.next) url = json.next.startsWith("http") ? json.next : `${API_BASE}${json.next}`;
        else url = null;
      }

      const normalized = acc.map(normalizeProperty);
      setProperties(normalized);

      // Preselect only when we have an effective agent
      if (effectiveAgentId != null) {
        const preselected = normalized
          .filter((p) => p.assigned_agent != null && Number(p.assigned_agent) === Number(effectiveAgentId))
          .map((p) => p.id);
        setSelectedPropertyIds(preselected);
        setInitialAssignedIds(preselected);
        console.log("Preselected IDs for effectiveAgentId", effectiveAgentId, preselected);
      } else {
        setSelectedPropertyIds([]);
        setInitialAssignedIds([]);
        console.log("No agent provided (prop or query) — selections start empty.");
      }
    } catch (err: any) {
      console.error("fetchAllPropertiesPages error:", err);
      setError(err?.message || "Failed to load properties");
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
  }, [effectiveAgentId]); // refresh when effective agent changes (prop or URL)

  // toggle selection — lightweight; only change assigned_agent locally if we know effectiveAgentId
  const handleToggleProperty = (propertyId: number) => {
    console.log("Property click", { propertyId, effectiveAgentId });

    setSelectedPropertyIds((prev) => {
      const isSelected = prev.includes(propertyId);
      const next = isSelected ? prev.filter((id) => id !== propertyId) : [...prev, propertyId];

      if (effectiveAgentId != null) {
        setProperties((old) =>
          old.map((o) => (o.id === propertyId ? { ...o, assigned_agent: !isSelected ? Number(effectiveAgentId) : null } : o))
        );
        console.log("Optimistic assigned_agent update:", { propertyId, assigned: !isSelected ? effectiveAgentId : null });
      } else {
        console.warn("No effectiveAgentId — selection toggled locally. Pass agentId prop or ?agent=ID in URL to enable save.");
      }

      return next;
    });
  };

  // ------------------------
  // PATCH helper (robust)
  // - try JSON first
  // - if server returns 415, retry with FormData (multipart)
  // - log everything
  // ------------------------
  async function patchAssignedAgent(propertyId: number, assignedValue: number | null) {
    const tryJson = async () => {
      const payload = { assigned_agent: assignedValue === null ? null : Number(assignedValue) };
      const headers = { ...authHeaders(), "Content-Type": "application/json" };
      console.log("PATCH (JSON) ->", PROPERTY_PATCH(propertyId), payload);
      const res = await fetch(PROPERTY_PATCH(propertyId), {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      });
      return { res, payloadMode: "json" as const, payload };
    };

    const tryForm = async () => {
      const fd = new FormData();
      // send empty string to clear, or numeric string to assign
      fd.append("assigned_agent", assignedValue === null ? "" : String(Number(assignedValue)));
      const headers = { ...authHeaders() }; // DO NOT set Content-Type; browser sets boundary
      console.log("PATCH (FormData) ->", PROPERTY_PATCH(propertyId), { assigned_agent: fd.get("assigned_agent") });
      const res = await fetch(PROPERTY_PATCH(propertyId), {
        method: "PATCH",
        headers,
        body: fd,
      });
      return { res, payloadMode: "form" as const, payloadFormValue: fd.get("assigned_agent") };
    };

    // 1) try JSON
    let attempt = await tryJson();
    let res = attempt.res;

    // 2) If JSON rejected due to unsupported media type, retry with form-data
    if (res.status === 415) {
      console.warn("Server returned 415 for JSON payload — retrying with multipart/form-data");
      attempt = await tryForm();
      res = attempt.res;
    }

    // parse result
    const result: any = { propertyId, ok: res.ok, status: res.status, payloadMode: attempt.payloadMode };
    try {
      const text = await res.text();
      try {
        result.bodyJson = JSON.parse(text);
        result.bodyText = JSON.stringify(result.bodyJson);
      } catch {
        result.bodyText = text;
      }
    } catch (e) {
      result.bodyText = "";
    }

    console.log("PATCH final response for", propertyId, result);

    if (!res.ok) {
      const err = new Error(`Patch ${propertyId} failed (${res.status})`);
      (err as any).detail = result;
      throw err;
    }

    return result;
  }

  // Save changes (batch)
  async function handleSaveAssignments() {
    if (effectiveAgentId == null) {
      alert("Cannot save: no agent specified. Pass agentId prop or use ?agent=ID in the URL.");
      return;
    }
    if (properties.length === 0) {
      alert("Cannot save: no properties loaded from API.");
      return;
    }

    setSaving(true);
    try {
      const before = new Set(initialAssignedIds);
      const after = new Set(selectedPropertyIds);
      const toAssign = Array.from(after).filter((id) => !before.has(id));
      const toUnassign = Array.from(before).filter((id) => !after.has(id));
      console.log("SaveAssignments -> toAssign:", toAssign, "toUnassign:", toUnassign, "effectiveAgentId:", effectiveAgentId);

      const requests: Promise<any>[] = [];
      for (const id of toAssign) requests.push(patchAssignedAgent(id, Number(effectiveAgentId)));
      for (const id of toUnassign) requests.push(patchAssignedAgent(id, null));

      if (requests.length === 0) {
        alert("No changes to save.");
        setSaving(false);
        return;
      }

      const settled = await Promise.allSettled(requests);
      const successes: any[] = [];
      const failures: any[] = [];
      settled.forEach((s) => {
        if (s.status === "fulfilled") successes.push(s.value);
        else {
          const reason = (s as PromiseRejectedResult).reason;
          if (reason && reason.detail) failures.push(reason.detail);
          else failures.push({ message: String(reason) });
        }
      });

      console.group("ManageProperties · SaveAssignments Results");
      console.log("Assigned (successful):", successes);
      console.log("Failed:", failures);
      console.groupEnd();

      if (failures.length === 0) {
        alert(`Assignments updated successfully. ${successes.length} request(s) succeeded. Full responses logged to console.`);
      } else {
        alert(`Completed with errors. ${successes.length} succeeded, ${failures.length} failed. Check console for full responses.`);
      }

      await fetchAllPropertiesPages();
    } catch (err: any) {
      console.error("handleSaveAssignments error:", err);
      alert("Failed to save assignments: " + (err?.message || "Unknown"));
    } finally {
      setSaving(false);
    }
  }

  const handleCancel = () => {
    setSelectedPropertyIds([...initialAssignedIds]);
    fetchAllPropertiesPages();
    console.log("Selection cancelled and refetched.");
  };

  const filteredProperties = properties.filter((p) => {
    if (activeTab === "sales") return (p.type ?? "sales") === "sales";
    return (p.type ?? "sales") === "rentals";
  });

  const selectedCount = selectedPropertyIds.length;

  return (
    <div className="p-6 md:p-10 flex flex-col items-center">
      <div className="w-full bg-white rounded-xl p-6 md:p-8">
        <header className="mb-8 border-b border-gray-100 pb-4">
          <Link to="/dashboard/admin-agent" className="flex items-center text-gray-500 w-15 hover:text-gray-800 transition-colors mb-4" aria-label="Back to Agent List">
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">Back</span>
          </Link>

          <h1 className="text-2xl font-bold text-gray-800">Assign Properties to Agent</h1>
          <p className="text-xl font-medium text-gray-500 mt-1">{agentName}{effectiveAgentId ? ` — agent ${effectiveAgentId}` : ""}</p>
        </header>

        <h2 className="text-lg font-semibold text-gray-700 mb-4">Select Properties</h2>

        <div className="flex gap-3 mb-6">
          <button className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${activeTab === "sales" ? "bg-[#009689] text-white border-[#009689]" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`} onClick={() => setActiveTab("sales")}>
            <Home className="w-4 h-4" /> Properties Sales
          </button>

          <button className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${activeTab === "rentals" ? "bg-[#009689] text-white border-[#009689]" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`} onClick={() => setActiveTab("rentals")}>
            <Building2 className="w-4 h-4" /> Properties Rentals
          </button>
        </div>

        <main className="space-y-4 mb-8">
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {loading && <div className="text-sm text-gray-500">Loading properties…</div>}
            {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

            {filteredProperties.map((property) => (
              <PropertyListItem key={property.id} property={property} isSelected={selectedPropertyIds.includes(property.id)} onToggle={handleToggleProperty} />
            ))}

            {(!loading && filteredProperties.length === 0) && <p className="text-center text-gray-500 py-6">No properties available in this category.</p>}
          </div>
        </main>

        <footer className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-100 gap-3">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600 font-medium">{selectedCount} property{selectedCount !== 1 ? "s" : ""} selected</p>
            {effectiveAgentId == null && <p className="text-sm text-yellow-600">Note: pass <code>agentId</code> prop or use <code>?agent=ID</code> in URL to enable assignment on save.</p>}
            {properties.length === 0 && !loading && <p className="text-sm text-gray-500">No properties loaded from API.</p>}
          </div>

          <div className="flex space-x-3">
            <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition" onClick={handleCancel}>Cancel</button>
            <button className="px-6 py-2 flex items-center bg-teal-600 text-white rounded-lg font-medium shadow-md hover:bg-teal-700 transition disabled:opacity-60 disabled:cursor-not-allowed" onClick={handleSaveAssignments} disabled={saving || properties.length === 0}>
              <Save className="w-5 h-5 mr-2" />
              {saving ? "Saving..." : "Save Assignments"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
