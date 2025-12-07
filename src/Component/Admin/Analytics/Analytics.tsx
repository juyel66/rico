// File: Analytics.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Download } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.eastmondvillas.com';
const ANALYTICS_URL = `${API_BASE}/villas/analytics/`;
const PROPERTIES_URL = `${API_BASE}/villas/properties/`;

const Analytics = () => {
  const [selectedRange, setSelectedRange] = useState('Last 7 Days');

  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiData, setApiData] = useState(null);

  // NEW: store full properties list fetched separately when analytics doesn't include it
  const [allProperties, setAllProperties] = useState(null);
  const [propsLoading, setPropsLoading] = useState(false);
  const [propsError, setPropsError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadAnalytics() {
      setApiLoading(true);
      setApiError(null);
      try {
        const rangeMap = {
          'Last 7 Days': '7d',
          'Last 30 Days': '30',
          'Last 90 Days': '90',
        };
        const range = rangeMap[selectedRange] ?? '30';
        const url = new URL(ANALYTICS_URL);
        url.searchParams.set('range', range);

        const res = await fetch(url.toString(), { signal: controller.signal });
        if (!res.ok) {
          if (res.status === 404) throw new Error('HTTP 404 — analytics resource not found on backend');
          const txt = await res.text().catch(() => '');
          throw new Error(txt || `HTTP ${res.status}`);
        }
        const json = await res.json();
        setApiData(json);
      } catch (err) {
        if (err.name !== 'AbortError') setApiError(String(err.message || err));
      } finally {
        setApiLoading(false);
      }
    }
    loadAnalytics();
    return () => controller.abort();
  }, [selectedRange]);

  // If analytics doesn't include a properties array, fetch the properties endpoint
  useEffect(() => {
    if (apiData && Array.isArray(apiData.properties) && apiData.properties.length) {
      // analytics includes properties — we don't need a separate fetch
      setAllProperties(null);
      setPropsError(null);
      setPropsLoading(false);
      return;
    }

    // otherwise fetch properties list once
    let mounted = true;
    const controller = new AbortController();
    async function fetchPropertiesList() {
      setPropsLoading(true);
      setPropsError(null);
      try {
        const res = await fetch(PROPERTIES_URL + '?page_size=1000', { signal: controller.signal }); // try to get many items
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(txt || `HTTP ${res.status}`);
        }
        const json = await res.json();
        // many APIs return {results: [...]}; normalize
        const list = Array.isArray(json) ? json : (Array.isArray(json.results) ? json.results : []);
        if (mounted) setAllProperties(list);
      } catch (err) {
        if (err.name !== 'AbortError' && mounted) setPropsError(String(err.message || err));
      } finally {
        if (mounted) setPropsLoading(false);
      }
    }

    fetchPropertiesList();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [apiData]);

  // ---------- Helpers: determine sale / rent ----------
  const isSaleProperty = (p) => {
    if (!p) return false;
    const val = (p?.listing_type ?? p?.listingType ?? p?.property_type ?? p?.type ?? p?.rateType) ?? '';
    const normalized = String(val).toLowerCase();
    return ['sale', 'sell', 'for sale', 'sales'].includes(normalized);
  };

  const isRentProperty = (p) => {
    if (!p) return false;
    const val = (p?.listing_type ?? p?.listingType ?? p?.property_type ?? p?.type ?? p?.rateType) ?? '';
    const normalized = String(val).toLowerCase();
    return ['rent', 'rental', 'rentals'].includes(normalized);
  };

  // Defensive mapping helpers
  const performanceChartData = useMemo(() => {
    if (apiData && Array.isArray(apiData.performance) && apiData.performance.length) {
      return apiData.performance.map((r) => ({
        name: r.name ?? r.label ?? r.date ?? '',
        downloads: Number(r.downloads ?? r.total_downloads ?? 0),
        inquiries: Number(r.inquiries ?? r.total_inquiries ?? r.inquiries ?? 0),
        views: Number(r.views ?? r.total_views ?? 0),
        bookings: Number(r.bookings ?? r.total_bookings ?? 0),
      }));
    }
    return [];
  }, [apiData]);

  // ---------- compute properties by type using analytics.properties OR allProperties fetched from /properties/ ----------
  const propertiesByTypeData = useMemo(() => {
    const source =
      (apiData && Array.isArray(apiData.properties) && apiData.properties.length ? apiData.properties : null) ||
      (Array.isArray(allProperties) ? allProperties : null) ||
      (apiData && Array.isArray(apiData.properties_by_type) ? apiData.properties_by_type : null);

    // If we have a normalized array of property objects, count directly using helpers
    if (Array.isArray(source) && source.length && typeof source[0] === 'object' && ('listing_type' in source[0] || 'type' in source[0] || 'rateType' in source[0] || 'property_type' in source[0])) {
      let sales = 0;
      let rents = 0;
      for (const p of source) {
        if (isSaleProperty(p)) sales++;
        else if (isRentProperty(p)) rents++;
      }
      return [
        { name: 'Sales', value: sales, color: '#3B82F6' },
        { name: 'Rentals', value: rents, color: '#10B981' },
      ];
    }

    // If api returned properties_by_type style entries like [{name, value}], try to infer counts by matching names
    if (Array.isArray(source) && source.length && typeof source[0] === 'object' && ('name' in source[0] && ('value' in source[0] || 'count' in source[0]))) {
      let sales = 0;
      let rents = 0;
      for (const entry of source) {
        const name = String(entry.name ?? '').toLowerCase();
        const val = Number(entry.value ?? entry.count ?? 0) || 0;
        if (name.includes('sale') || name.includes('sell')) sales += val;
        else if (name.includes('rent')) rents += val;
      }
      return [
        { name: 'Sales', value: sales, color: '#3B82F6' },
        { name: 'Rentals', value: rents, color: '#10B981' },
      ];
    }

    // If we reach here we don't have data yet — show zeros rather than sample numbers
    return [
      { name: 'Sales', value: 0, color: '#3B82F6' },
      { name: 'Rentals', value: 0, color: '#10B981' },
    ];
  }, [apiData, allProperties]);

  const agentsChartData = useMemo(() => {
    if (apiData && Array.isArray(apiData.agents) && apiData.agents.length) {
      return apiData.agents.map((a) => ({
        id: a.id ?? undefined,
        name: a.name ?? a.agent ?? `Agent ${a.id ?? ''}`,
        total_views: Number(a.total_views ?? 0) || 0,
        total_properties: Number(a.total_properties ?? 0) || 0,
      }));
    }
    return [];
  }, [apiData]);

  const totals = useMemo(() => {
    const t = apiData && apiData.totals ? apiData.totals : null;
    return {
      views: t && typeof t.views !== 'undefined' ? t.views : '—',
      downloads: t && typeof t.downloads !== 'undefined' ? t.downloads : '—',
      bookings: t && typeof t.bookings !== 'undefined' ? t.bookings : '—',
      inquiries: t && typeof t.inquiries !== 'undefined' ? t.inquiries : '—',
    };
  }, [apiData]);

  // Chart components (unchanged styling)
  const PerformanceOverviewChart = () => (
    <div className="bg-white border border-re-200 rounded-xl shadow-sm pl-4 pr-4 pt-2 h-full">
      <h2 className="text-xl font-semibold text-gray-800">Performance Overview</h2>
      <p className="text-gray-500 text-sm mb-2">
        Views, bookings, downloads and inquiries
        {apiData && apiData.start_date && apiData.end_date ? (
          <span className="text-xs text-gray-400 ml-2"> ({apiData.start_date} → {apiData.end_date})</span>
        ) : null}
      </p>

      {apiLoading ? (
        <div className="text-sm text-gray-500 p-6">Loading analytics...</div>
      ) : apiError ? (
        <div className="text-sm text-red-600 p-6">Error loading analytics: {apiError}</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend wrapperStyle={{ position: 'relative', marginTop: '20px' }} />
            <Line type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="bookings" stroke="#10B981" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
            <Line type="monotone" dataKey="downloads" stroke="#9333EA" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
            <Line type="monotone" dataKey="inquiries" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );

  const PropertiesByTypeChart = () => (
    <div className="bg-white border lg:mt-0 md:mt-0 mt-10 border-gray-200 rounded-xl shadow-sm p-6 h-full">
      <h2 className="text-xl font-semibold text-gray-800">Properties by Type</h2>
      <p className="text-gray-500 text-sm mb-4">Distribution across Sales vs Rentals</p>

      {/* show small loader or error for properties fetch if needed */}
      {(!apiData || (Array.isArray(apiData.properties) && apiData.properties.length === 0)) && propsLoading ? (
        <div className="text-sm text-gray-500 p-6">Loading properties...</div>
      ) : propsError ? (
        <div className="text-sm text-red-600 p-6">Error loading properties: {propsError}</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={propertiesByTypeData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              fill="#8884d8"
              paddingAngle={2}
              dataKey="value"
              labelLine={false}
              label={({ index }) => {
                const e = propertiesByTypeData[index];
                return e ? `${e.name} (${e.value})` : '';
              }}
            >
              {propertiesByTypeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );

  const AgentPerformanceChart = () => (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm pl-4 pt-4 mt-6 pb-4">
      <h2 className="text-xl font-semibold text-gray-800">Agent Performance</h2>
      <p className="text-gray-500 text-sm mb-4">Properties assigned & views</p>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={agentsChartData.map((a) => ({ name: a.name, views: a.total_views || 0, properties: a.total_properties || 0 }))}
          margin={{ top: 5, right: 30, left: -20, bottom: 5 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} />
          <Tooltip />
          <Legend layout="horizontal" verticalAlign="top" align="center" wrapperStyle={{ position: 'relative', marginTop: '20px' }} />
          <Bar dataKey="views" fill="#10B981" name="views" radius={[4, 4, 0, 0]} />
          <Bar dataKey="properties" fill="#3B82F6" name="properties" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <div>
        <div className="flex justify-between items-center mt-5">
          <div>
            <h1 className="text-3xl font-semibold">Properties</h1>
            <p className="text-gray-500">Your portfolio, beautifully organized.</p>
          </div>

          <div className="lg:flex items-center gap-4  relative">
            <div className="bg-gray-100 border-2 border-gray-300 text-black flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-colors duration-150 cursor-pointer relative">
              <select value={selectedRange} onChange={(e) => setSelectedRange(e.target.value)} className="bg-transparent outline-none text-black text-sm cursor-pointer">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
              </select>
            </div>

            <div className="bg-gray-100 lg:mt-0 mt-2 border-2 border-gray-300 text-black flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-colors duration-150">
              <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1761005671/Icon_43_rivr8o.png" alt="" /> Export
            </div>
          </div>
        </div>

        {/* --- Stats Cards (use API totals) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex justify-between items-center hover:shadow-md transition-shadow duration-300">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Views</p>
              <h2 className="text-3xl font-bold text-gray-800 mt-1">{totals.views}</h2>
              <p className="text-green-600 text-sm font-medium mt-1">Summary</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Eye className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex justify-between items-center hover:shadow-md transition-shadow duration-300">
            <div>
              <p className="text-gray-500 text-sm font-medium">Downloads</p>
              <h2 className="text-3xl font-bold text-gray-800 mt-1">{totals.downloads}</h2>
              <p className="text-green-600 text-sm font-medium mt-1">Summary</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-green-600">
              <Download className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex justify-between items-center hover:shadow-md transition-shadow duration-300">
            <div>
              <p className="text-gray-500 text-sm font-medium">Inquiries / Bookings</p>
              <h2 className="text-3xl font-bold text-gray-800 mt-1">{totals.inquiries} / {totals.bookings}</h2>
              <p className="text-green-600 text-sm font-medium mt-1">Summary</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
              <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1761004601/Icon_42_ycz89k.png" alt="" />
            </div>
          </div>
        </div>
      </div>

      {/* --- Charts --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
        <div className="lg:col-span-2">
          <PerformanceOverviewChart />
        </div>
        <div className="lg:col-span-1">
          <PropertiesByTypeChart />
        </div>
      </div>

      <div className="mt-6">
        <AgentPerformanceChart />
      </div>
    </div>
  );
};

export default Analytics;
