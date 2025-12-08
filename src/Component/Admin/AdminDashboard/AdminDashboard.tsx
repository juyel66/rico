// File: AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, UploadCloud } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProperties, fetchActivityLogs } from "../../../features/Properties/PropertiesSlice";
import type { AppDispatch, RootState } from "../../../store";
import { Link } from "react-router";

/**
 * AdminDashboard
 * - Uses API data only (no fake data).
 * - Shows first image from media_images (or bedrooms_images) for each property.
 * - Formats activity time to human-friendly relative strings (e.g. "5 hours ago").
 *
 * Change: implements progressive "View All" -> show 30 -> "View more" (+10 below list) -> "View Less".
 * Change: fetch agents list from API and compute Active Agents count from agents where is_active === true.
 */

const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23888' font-family='Arial' font-size='18'>No image</text></svg>`
  );

/* ---------------------------
   Small helpers: timeAgo + agent formatting
   ---------------------------*/
function timeAgo(isoOrDate) {
  if (!isoOrDate) return "—";
  const date = typeof isoOrDate === "string" || typeof isoOrDate === "number" ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(date.getTime())) return String(isoOrDate);

  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // seconds

  if (diff < 5) return "just now";
  if (diff < 60) return `${diff} second${diff === 1 ? "" : "s"} ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

/**
 * Format agent display:
 * - Keep simple: show provided name, or "System" if none.
 * - Also try to extract email if that's present inside details.
 */
function extractEmail(text) {
  if (!text || typeof text !== "string") return null;
  const m = text.match(/[\w.+-]+@[\w-]+\.[\w-.]+/);
  return m ? m[0] : null;
}
function formatAgentDisplay(agent, details) {
  if (agent && typeof agent === "string" && agent.trim()) return agent;
  if (agent && typeof agent === "object") {
    if (agent.name) return String(agent.name);
    if (agent.full_name) return String(agent.full_name);
    if (agent.email) return String(agent.email);
  }
  // try to extract email from details text
  const e = extractEmail(details);
  if (e) return e;
  return "System";
}

const AdminDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();

  // UI toggles and visible counts
  const [showAllProperties, setShowAllProperties] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);

  // visible counts for progressive load
  const [propertiesVisibleCount, setPropertiesVisibleCount] = useState(5); // collapsed initial
  const [activityVisibleCount, setActivityVisibleCount] = useState(4); // collapsed initial

  // handlers for toggles
  const handleViewAllProperties = () => {
    if (!showAllProperties) {
      setShowAllProperties(true);
      setPropertiesVisibleCount(30); // initial expansion to 30
    } else {
      setShowAllProperties(false);
      setPropertiesVisibleCount(5); // collapse
    }
  };
  const handleViewAllActivity = () => {
    if (!showAllActivity) {
      setShowAllActivity(true);
      setActivityVisibleCount(30); // initial expansion to 30
    } else {
      setShowAllActivity(false);
      setActivityVisibleCount(4); // collapse
    }
  };

  // progressive "view more" handlers (add +10)
  const loadMoreProperties = (total) => {
    setPropertiesVisibleCount((cur) => Math.min(total, cur + 10));
  };
  const loadMoreActivity = (total) => {
    setActivityVisibleCount((cur) => Math.min(total, cur + 10));
  };

  // collapse helpers (used when "View Less" pressed at bottom)
  const collapseProperties = () => {
    setShowAllProperties(false);
    setPropertiesVisibleCount(5);
  };
  const collapseActivity = () => {
    setShowAllActivity(false);
    setActivityVisibleCount(4);
  };

  // Redux state
  const properties = useSelector((s: RootState) => s.propertyBooking.properties) ?? [];
  const propertiesLoading = useSelector((s: RootState) => s.propertyBooking.loading);
  const propertiesError = useSelector((s: RootState) => s.propertyBooking.error);

  const activityLogs = useSelector((s: RootState) => s.propertyBooking.activityLogs) ?? [];
  const activityLoading = useSelector((s: RootState) => s.propertyBooking.loading);
  const activityError = useSelector((s: RootState) => s.propertyBooking.error);

  // Local agents state (NEW)
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentsError, setAgentsError] = useState(null);

  // Fetch API data on mount
  useEffect(() => {
    dispatch(fetchProperties());
    dispatch(fetchActivityLogs());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper: make candidate agent URLs robust (try both /api/agents/ and /agents/)
  const buildAgentUrlCandidates = () => {
    const rawBase = import.meta.env.VITE_API_BASE || "https://api.eastmondvillas.com";
    const b = String(rawBase).replace(/\/+$/, ""); // trim trailing slash
    const candidates = [];
    // If base already contains "/api", add both b + "/agents/" and b + "/api/agents/"
    if (b.toLowerCase().includes("/api")) {
      candidates.push(`${b}/agents/`);
      candidates.push(`${b.replace(/\/api.*$/i, "")}/api/agents/`); // fallback to base root + /api/agents/
    } else {
      // base has no /api: try both b + '/api/agents/' and b + '/agents/'
      candidates.push(`${b}/api/agents/`);
      candidates.push(`${b}/agents/`);
    }
    // make unique and return
    return Array.from(new Set(candidates));
  };

  // Fetch agents list from API (NEW — robust, tries candidates)
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const token = (() => {
      try {
        return localStorage.getItem("auth_access");
      } catch {
        return null;
      }
    })();

    const candidates = buildAgentUrlCandidates();

    (async () => {
      setAgentsLoading(true);
      setAgentsError(null);
      try {
        let success = false;
        let lastErr = null;

        for (const url of candidates) {
          if (!mounted) break;
          try {
            const headers: Record<string, string> = { Accept: "application/json" };
            if (token) headers.Authorization = `Bearer ${token}`;
            const res = await fetch(url, { signal: controller.signal, headers });
            if (!res.ok) {
              // record and try next
              const txt = await res.text().catch(() => "");
              lastErr = `Attempt ${url} → HTTP ${res.status} ${txt ? `: ${txt}` : ""}`;
              console.warn("[agents fetch] candidate failed:", url, res.status, txt);
              continue;
            }
            // ok
            const json = await res.json();
            const list = Array.isArray(json) ? json : (Array.isArray(json.results) ? json.results : []);
            if (mounted) setAgents(list);
            success = true;
            break;
          } catch (err) {
            lastErr = err;
            if (err && err.name === "AbortError") {
              // aborted — stop
              break;
            }
            console.warn("[agents fetch] candidate threw:", url, err);
            continue; // try next
          }
        }

        if (!success) {
          // both attempts failed
          const message = typeof lastErr === "string" ? lastErr : (lastErr && lastErr.message) ? lastErr.message : "Failed to fetch agents";
          if (mounted) setAgentsError(message);
          console.error("[agents fetch] all candidates failed:", candidates, lastErr);
        }
      } catch (err) {
        if (err && err.name !== "AbortError") {
          console.error("[agents fetch] unexpected error:", err);
          if (mounted) setAgentsError(String(err.message || err));
        }
      } finally {
        if (mounted) setAgentsLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  // Normalize properties (API-driven) and extract first image
  const normalizedProperties = useMemo(() => {
    if (!properties || properties.length === 0) return [];

    const extractUrl = (m) => {
      if (!m) return null;
      if (typeof m === "string") return m;
      if (m.image) return m.image;
      if (m.url) return m.url;
      if (m.file) return m.file;
      return null;
    };

    return properties.map((p) => {
      let image = null;
      if (Array.isArray(p.media_images) && p.media_images.length > 0) {
        image = extractUrl(p.media_images[0]);
      }
      if (!image && Array.isArray(p.bedrooms_images) && p.bedrooms_images.length > 0) {
        image = extractUrl(p.bedrooms_images[0]);
      }

      image = image || p.main_image_url || p.image || p.thumbnail || null;

      return {
        id: p.id ?? p.pk ?? Math.random(),
        image,
        title: p.title ?? p.name ?? p.address ?? `Property ${p.id ?? ""}`,
        price: (typeof p.price === "number" ? `$${p.price}` : p.price) ?? p.price_display ?? "—",
        status: (p.status ?? p.state ?? (p.published ? "Published" : "Draft")) || "Draft",
        created_at: p.created_at ?? p.created ?? null,
        agent: p.created_by_name ?? p.agent_name ?? null,
      };
    });
  }, [properties]);

  // Activity normalized
  const normalizedActivity = useMemo(() => {
    if (!activityLogs || activityLogs.length === 0) return [];

    return activityLogs.map((a, idx) => {
      const rawDetails = a.detials ?? a.details ?? a.changes_text ?? a.object_repr ?? "";
      const timestamp = a.timestamp ?? a.created_at ?? a.time ?? "—";
      const agentDisplay = formatAgentDisplay(a.user ?? a.created_by_name ?? a.agent, rawDetails);

      // status mapping: prefer explicit field else fallback
      const status = a.status ?? (a.is_read === false ? "Pending" : "Live");

      return {
        id: a.id ?? idx,
        type: a.type ?? a.action ?? a.object_repr ?? "Activity",
        propertyName:
          (a.changes && a.changes.title && a.changes.title[1]) ??
          a.target_object ??
          a.object_repr ??
          (a.property_name ?? a.property_title) ??
          "—",
        agent: agentDisplay,
        time: timestamp,
        status,
        details: rawDetails,
        raw: a,
      };
    });
  }, [activityLogs]);

  // Dashboard counters - compute totalsFromPropertiesFallback first
  const totalsFromPropertiesFallback = useMemo(() => {
    const all = normalizedProperties;
    const totalProperties = all.length;
    const activeListings = all.filter((p) => String(p.status).toLowerCase().includes("publish")).length;
    const pendingReviews = all.filter((p) => String(p.status).toLowerCase().includes("pending")).length;
    const agentsSet = new Set(all.map((p) => (p.agent ? String(p.agent).trim() : null)).filter(Boolean));
    const activeAgentsFallback = agentsSet.size || 0;
    return { totalProperties, activeListings, pendingReviews, activeAgentsFallback };
  }, [normalizedProperties]);

  // Compute active agents using fetched agents list if available (NEW)
  const activeAgentsCount = useMemo(() => {
    if (Array.isArray(agents) && agents.length > 0) {
      // Accept both boolean and string "true" forms, also accept `active` field
      return agents.filter((a) => {
        if (!a) return false;
        if (a.is_active === true) return true;
        if (a.active === true) return true;
        if (typeof a.is_active === "string" && a.is_active.toLowerCase() === "true") return true;
        if (typeof a.active === "string" && a.active.toLowerCase() === "true") return true;
        return false;
      }).length;
    }
    // fallback to property-derived estimate
    return totalsFromPropertiesFallback.activeAgentsFallback;
  }, [agents, totalsFromPropertiesFallback]);

  // Use totals object but replace activeAgents with activeAgentsCount
  const totals = useMemo(() => {
    return {
      totalProperties: totalsFromPropertiesFallback.totalProperties,
      activeListings: totalsFromPropertiesFallback.activeListings,
      pendingReviews: totalsFromPropertiesFallback.pendingReviews,
      activeAgents: activeAgentsCount,
    };
  }, [totalsFromPropertiesFallback, activeAgentsCount]);

  // recent items (sorted)
  const recentProperties = useMemo(() => {
    const copy = [...normalizedProperties];
    copy.sort((a, b) => {
      const ad = a.created_at ? Date.parse(a.created_at) : 0;
      const bd = b.created_at ? Date.parse(b.created_at) : 0;
      return bd - ad;
    });
    return copy;
  }, [normalizedProperties]);

  // ensure propertiesVisibleCount does not exceed total, keep behavior when toggling
  useEffect(() => {
    const total = recentProperties.length;
    if (showAllProperties) {
      setPropertiesVisibleCount((cur) => Math.min(Math.max(cur, 30), total));
    } else {
      setPropertiesVisibleCount(5);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAllProperties, recentProperties.length]);

  const recentToShow = recentProperties.slice(0, Math.min(propertiesVisibleCount, recentProperties.length));

  // activity
  const recentActivity = useMemo(() => {
    const copy = [...normalizedActivity];
    // sort by time if available (newest first)
    copy.sort((a, b) => {
      const at = a.time ? Date.parse(a.time) || 0 : 0;
      const bt = b.time ? Date.parse(b.time) || 0 : 0;
      return bt - at;
    });
    return copy;
  }, [normalizedActivity]);

  useEffect(() => {
    const total = recentActivity.length;
    if (showAllActivity) {
      setActivityVisibleCount((cur) => Math.min(Math.max(cur, 30), total));
    } else {
      setActivityVisibleCount(4);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAllActivity, recentActivity.length]);

  const recentActivityToShow = recentActivity.slice(0, Math.min(activityVisibleCount, recentActivity.length));

  // helper classes
  const getPropertyStatusClass = (status) => {
    const normalizedStatus = String(status ?? "").toLowerCase();
    return normalizedStatus === "published"
      ? "border bg-green-50 text-green-600 border-green-500"
      : normalizedStatus === "pending review"
      ? "border bg-orange-50  text-orange-600 border-orange-500"
      : normalizedStatus === "draft"
      ? "border border-gray-400"
      : normalizedStatus === "sold"
      ? "border border-red-500"
      : "border border-blue-500";
  };

  const getActivityStatusClass = (status) => {
    const normalizedStatus = String(status ?? "").toLowerCase();
    return normalizedStatus === "live"
      ? "border bg-teal-50 text-teal-600 border-teal-500"
      : normalizedStatus === "pending"
      ? "border bg-orange-50 text-orange-600 border-orange-500"
      : normalizedStatus === "updated"
      ? "border bg-blue-50 text-blue-600 border-blue-500"
      : "border border-gray-400";
  };

  return (
    <div>
      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 py-6">
        <Link to="/dashboard/rentals/admin-create-property" className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm">
          <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760922664/Icon_36_ptz5ii.png" alt="" /> Create Property
        </Link>
        <Link to="/dashboard/admin-agent" className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm">
          <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760922664/Icon_38_h9ps9e.png" alt="" /> Add Agent
        </Link>
        {/* <Link to="/dashboard/admin-dashboard" className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm">
          <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760922664/Icon_37_ajwrle.png" alt="" /> Bulk Upload
        </Link> */}
      </div>

      {/* Dashboard cards */}
      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border-2 border-gray-200 p-5 flex flex-col items-start shadow-sm" style={{ minHeight: "120px" }}>
            <div className="mb-3">
              <img className=" bg-[#00968915] p-3 rounded-lg " src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760834371/Icon_4_vocxhj.png" alt="" />
            </div>
            <div className="text-3xl font-semibold text-gray-800 mb-1">{totals.totalProperties}</div>
            <div className="text-gray-500 text-sm">Total Properties</div>
          </div>

          <div className="bg-white rounded-lg border-2 border-gray-200 p-5 flex flex-col items-start shadow-sm" style={{ minHeight: "120px" }}>
            <div className="mb-3">
              <img className="bg-[#00968915]  rounded-lg" src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760997613/DashboardView_1_hspyww.png" alt="" />
            </div>
            <div className="text-3xl font-semibold text-gray-800 mb-1">{totals.activeListings}</div>
            <div className="text-gray-500 text-sm">Active Listings</div>
          </div>

          <div className="bg-white rounded-lg border-2 border-gray-200 p-5 flex flex-col items-start shadow-sm" style={{ minHeight: "120px" }}>
            <div className="mb-3">
              <img className="bg-[#00968915]  rounded-lg" src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760997613/DashboardView_2_j5n7q7.png" alt="" />
            </div>
            <div className="text-3xl font-semibold text-gray-800 mb-1">{totals.pendingReviews}</div>
            <div className="text-gray-500 text-sm">Pending Reviews</div>
          </div>

          <div className="bg-white rounded-lg border-2 border-gray-200 p-5 flex flex-col items-start shadow-sm" style={{ minHeight: "120px" }}>
            <div className="mb-3">
              <img className="bg-[#00968915] rounded-lg" src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760997599/DashboardView_3_pfflqc.png" alt="" />
            </div>

            {/* Show loading state briefly if agents are being fetched */}
            <div className="text-3xl font-semibold text-gray-800 mb-1">
              {agentsLoading ? "…" : totals.activeAgents}
            </div>

            <div className="text-gray-500 text-sm">Active Agents</div>

            {/* show fetch error if exists (small) */}
            {agentsError && <div className="text-xs text-red-500 mt-2">Agents fetch error: {String(agentsError).slice(0, 80)}</div>}
          </div>
        </div>
      </div>

      {/* Recent Properties & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Recent Properties */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Recent Properties</h2>
            {normalizedProperties.length > 5 && (
              <Button onClick={handleViewAllProperties} variant="outline" className="text-gray-600 border-gray-400 hover:bg-blue-50">
                {showAllProperties ? "View Less" : "View All"}
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {propertiesLoading && normalizedProperties.length === 0 ? (
              <div className="text-sm text-gray-500">Loading properties...</div>
            ) : (
              recentToShow.map((property) => (
                <div key={property.id} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-200">
                  <img src={property.image || PLACEHOLDER_IMG} alt={property.title} className="w-20 h-20 object-cover rounded-md flex-shrink-0" />
                  <div className="flex-grow">
                    <h3 className="text-base font-medium text-gray-800 line-clamp-1">{property.title}</h3>
                    <p className="text-gray-600 text-sm">${property.price}</p>
                  </div>
                  <div className={`px-3 py-1 text-xs font-medium rounded-full ${getPropertyStatusClass(property.status)}`}>
                    {property.status}
                  </div>
                </div>
              ))
            )}

            {!propertiesLoading && normalizedProperties.length === 0 && (
              <div className="text-sm text-gray-500">No properties found.</div>
            )}

            {propertiesError && <div className="mt-3 text-sm text-red-600">Error loading properties: {String(propertiesError)}</div>}
          </div>

          {/* BOTTOM controls for progressive load (below the list) */}
          <div className="mt-4 flex justify-center">
            {showAllProperties && recentProperties.length > 0 && propertiesVisibleCount < recentProperties.length ? (
              <Button onClick={() => loadMoreProperties(recentProperties.length)} variant="outline" className="text-gray-600 border-gray-400 hover:bg-blue-50">
                View more
              </Button>
            ) : showAllProperties && recentProperties.length > 0 && propertiesVisibleCount >= recentProperties.length ? (
              <Button onClick={collapseProperties} variant="outline" className="text-gray-600 border-gray-400 hover:bg-blue-50">
                View Less
              </Button>
            ) : null}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
              <p className="text-gray-500 text-sm">Latest updates from your team</p>
            </div>
            {normalizedActivity.length > 4 && (
              <Button onClick={handleViewAllActivity} variant="outline" className="text-gray-600 border-gray-400 hover:bg-blue-50">
                {showAllActivity ? "View Less" : "View All"}
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {activityLoading && normalizedActivity.length === 0 ? (
              <div className="text-sm text-gray-500">Loading activity...</div>
            ) : (
              recentActivityToShow.map((activity) => (
                <div key={activity.id} className="flex justify-between items-start bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3 flex-grow">
                    <div className={`w-2.5 h-2.5 rounded-full mt-2 ${activity.status.toLowerCase() === "live" ? "bg-teal-500" : activity.status.toLowerCase() === "pending" ? "bg-orange-500" : "bg-blue-500"}`} />
                    <div>
                      {/* property / subject */}
                      <p className="text-base font-medium text-gray-800">{activity.details}</p>

                      {/* By <agent> on first line, then Last activity (human-friendly) on next line */}
                      <p className="text-gray-500 text-xs mt-1">
                        By <span className="font-medium text-gray-700">{activity.propertyName}</span>
                      </p>

                      <p className="text-gray-400 text-xs mt-0.5">Last activity: {timeAgo(activity.time)}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getActivityStatusClass(activity.status)}`}>
                    {activity.status}
                  </div>
                </div>
              ))
            )}

            {!activityLoading && normalizedActivity.length === 0 && (
              <div className="text-sm text-gray-500">No activity found.</div>
            )}

            {activityError && <div className="mt-3 text-sm text-red-600">Error loading activity: {String(activityError)}</div>}
          </div>

          {/* BOTTOM controls for progressive load (below the activity list) */}
          <div className="mt-4 flex justify-center">
            {showAllActivity && recentActivity.length > 0 && activityVisibleCount < recentActivity.length ? (
              <Button onClick={() => loadMoreActivity(recentActivity.length)} variant="outline" className="text-gray-600 border-gray-400 hover:bg-blue-50">
                View more
              </Button>
            ) : showAllActivity && recentActivity.length > 0 && activityVisibleCount >= recentActivity.length ? (
              <Button onClick={collapseActivity} variant="outline" className="text-gray-600 border-gray-400 hover:bg-blue-50">
                View Less
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
