// src/features/Properties/PropertiesSales.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * PropertiesSales.tsx
 * - Same UI/design as your Rentals page
 * - Fetches sale properties from: ${API_BASE}/villas/properties/?listing_type=sale
 * - Shows only assigned properties:
 *     - If agentId prop is provided -> shows properties where assigned_agent === agentId
 *     - If agentId prop is not provided -> shows properties where assigned_agent is present (any agent)
 * - Starts with empty data (no demo fallback). Shows friendly No-data card when backend not available or result empty.
 */

// --- TYPE DEFINITIONS ---
interface Property {
  id: number;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  pool: number;
  status: 'published' | 'draft' | 'pending';
  imageUrl: string;
  description?: string | null;
  calendar_link?: string | null;
  _raw?: any;
  listing_type?: 'sale' | 'rent' | 'other';
  assigned_agent?: number | null;
}

// --- API base (defaults to your server) ---
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE?.replace(/\/+$/, '') ||
  'https://api.eastmondvillas.com';

// --- PRICE FORMATTER ---
const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Placeholder image
const PLACEHOLDER_IMAGE =
  'https://placehold.co/400x300/D1D5DB/4B5563?text=NO+IMAGE';

// --- PROPERTY CARD (same look as Rentals card) ---
const PropertyCard: React.FC<{ property: Property }> = ({ property }) => {
  const {
    id,
    title,
    address,
    price,
    bedrooms,
    bathrooms,
    pool,
    status,
    imageUrl,
    assigned_agent,
  } = property;

  const StatusBadge = ({ status }: { status: Property['status'] }) => {
    let bgColor = 'bg-gray-100 text-gray-700';
    if (status === 'published') bgColor = 'bg-green-100 text-green-700';
    else if (status === 'draft') bgColor = 'bg-yellow-100 text-yellow-700';
    else if (status === 'pending') bgColor = 'bg-blue-100 text-blue-700';
    return (
      <span
        className={`text-xs font-semibold py-1 px-3 rounded-full ${bgColor}`}
      >
        {status}
      </span>
    );
  };

  const copyToClipboard = async (text: string, action: string) => {
    try {
      if (!text || String(text).trim() === '') {
        alert(`${action} is not available for ${title}`);
        return;
      }
      await navigator.clipboard.writeText(String(text));
      alert(`${action} copied for ${title}`);
    } catch (err) {
      try {
        const el = document.createElement('textarea');
        el.value = String(text);
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        alert(`${action} copied for ${title}`);
      } catch {
        alert(`Failed to copy ${action}`);
      }
    }
  };

  const downloadImage = async (imgUrl?: string | null) => {
    if (!imgUrl) {
      alert('No image available to download.');
      return;
    }
    try {
      const url =
        String(imgUrl).startsWith('http') || String(imgUrl).startsWith('//')
          ? String(imgUrl)
          : `${API_BASE.replace(/\/api\/?$/, '')}${imgUrl.startsWith('/') ? imgUrl : '/' + imgUrl}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const ext = blob.type.split('/')[1] || 'jpg';
      a.download = `${title.replace(/\s+/g, '-').toLowerCase() || 'image'}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download image.');
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row gap-5 mb-6 w-full">
      {/* Image */}
      <div className="w-full md:w-48 lg:w-52 h-44 md:h-auto flex-shrink-0">
        <img
          src={imageUrl ?? PLACEHOLDER_IMAGE}
          alt={title}
          className="w-full h-full object-cover rounded-xl"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://placehold.co/400x300/D1D5DB/4B5563?text=NO+IMAGE';
          }}
        />
      </div>

      {/* Details */}
      <div className="flex-grow flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-bold text-gray-900 truncate">
              {title}
            </h2>
            <div className="flex items-center gap-2">
              <StatusBadge status={status} />
              {typeof assigned_agent !== 'undefined' &&
                assigned_agent !== null && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 whitespace-nowrap">
                    Agent #{assigned_agent}
                  </span>
                )}
            </div>
          </div>

          <p className="text-sm text-gray-500 flex items-center mb-3">
            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
            {address}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 text-sm">
            <div>
              <p className="text-gray-500 text-xs uppercase">Price</p>
              <p className="font-semibold text-gray-800">
                {formatPrice(price)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase">Bedrooms</p>
              <p className="font-semibold text-gray-800">{bedrooms}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase">Bathrooms</p>
              <p className="font-semibold text-gray-800">{bathrooms}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase">Pools</p>
              <p className="font-semibold text-gray-800">{pool}</p>
            </div>
          </div>
        </div>

        {/* Inline Buttons */}
        <div
          className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100"
          style={{
            rowGap: '8px',
          }}
        >
          <Link
            to={`/dashboard/agent-property-sales-details/${id}`}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 w-full bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition whitespace-nowrap"
          >
            <img
              src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760915210/Icon_29_mqukty.png"
              alt=""
              className="h-4 w-4"
            />
            View Details
          </Link>

          <button
            onClick={() =>
              copyToClipboard(
                property.description ?? `${title} - ${address}`,
                'Description'
              )
            }
            className="flex w-full items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition whitespace-nowrap"
          >
            <img
              src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760915210/Icon_30_lfzqbf.png"
              alt=""
              className="h-4 w-4"
            />
            Copy Description
          </button>

          <button
            onClick={() =>
              copyToClipboard(property.calendar_link ?? '', 'Calendar Link')
            }
            className="flex w-full items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition whitespace-nowrap"
          >
            <img
              src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760915210/Icon_31_evyeki.png"
              alt=""
              className="h-4 w-4"
            />
            Copy Calendar Link
          </button>

          <button
            onClick={() => downloadImage(property.imageUrl)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 w-full bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition whitespace-nowrap"
          >
            <img
              src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760915210/Icon_32_a4vr39.png"
              alt=""
              className="h-4 w-4"
            />
            Download Images
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT (Sales) ---
type Props = {
  agentId?: number | null;
};

const PropertiesSales: React.FC<Props> = ({ agentId: propAgentId = null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [properties, setProperties] = useState<Property[]>([]); // start empty, use backend only
  const [loading, setLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastFetchAt, setLastFetchAt] = useState<number | null>(null);

  // Resolve agentId (prop first, then localStorage if available)
  const resolvedAgentId = useMemo(() => {
    if (typeof propAgentId === 'number' && !isNaN(propAgentId))
      return propAgentId;
    try {
      const fromLS =
        localStorage.getItem('agent_id') ??
        localStorage.getItem('assigned_agent') ??
        localStorage.getItem('agentId');
      if (fromLS) {
        const n = Number(fromLS);
        if (!isNaN(n)) return n;
      }
    } catch {
      // ignore
    }
    return null;
  }, [propAgentId]);

  const loadProperties = async (opts?: { ignoreResults?: { current: boolean } }) => {
    setLoading(true);
    setLoadError(null);

    try {
      const url = `${API_BASE.replace(/\/+$/, '')}/villas/properties/?listing_type=sale`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        // intentionally no signal to avoid AbortError logging in devtools
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Server returned ${res.status} ${text}`.trim());
      }

      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : (data?.results ?? data?.items ?? []);

      const mapped: Property[] = list.map((p: any) => {
        let img = p.main_image_url ?? p.imageUrl ?? null;
        if (!img && Array.isArray(p.media_images) && p.media_images.length > 0) {
          img = p.media_images[0]?.image ?? null;
        }
        if (img && img.startsWith('/')) {
          img = `${API_BASE.replace(/\/api\/?$/, '')}${img}`;
        }
        const priceVal =
          Number(p.price ?? p.price_display ?? p.total_price ?? 0) || 0;
        const address =
          p.address ??
          (p.location
            ? typeof p.location === 'string'
              ? p.location
              : ''
            : '') ??
          p.city ??
          '';
        return {
          id: Number(p.id ?? p.pk ?? Math.floor(Math.random() * 1e9)),
          title: p.title ?? p.name ?? p.slug ?? 'Untitled',
          address: address || '—',
          price: priceVal,
          bedrooms: Number(p.bedrooms ?? p.num_bedrooms ?? 0),
          bathrooms: Number(p.bathrooms ?? p.num_bathrooms ?? 0),
          pool: Number(p.pool ?? 0),
          status:
            (String(p.status ?? p.state ?? 'draft').toLowerCase() as
              | 'published'
              | 'draft'
              | 'pending') ?? 'draft',
          imageUrl: img || PLACEHOLDER_IMAGE,
          description: p.description ?? p.short_description ?? null,
          calendar_link: p.calendar_link ?? p.google_calendar_id ?? null,
          _raw: p,
          listing_type: p.listing_type ?? 'sale',
          assigned_agent: p.assigned_agent ?? null,
        };
      });

      if (opts?.ignoreResults?.current) return;

      setProperties(mapped);
      setLastFetchAt(Date.now());
    } catch (err: any) {
      console.error('Failed to load properties', err);
      if (opts?.ignoreResults?.current) return;
      setProperties([]); // ensure empty when backend not available
      setLoadError(err?.message ?? 'Failed to load properties.');
    } finally {
      if (!(opts?.ignoreResults?.current)) {
        setLoading(false);
      } else {
        try { setLoading(false); } catch {}
      }
    }
  };

  useEffect(() => {
    const ignore = { current: false };
    loadProperties({ ignoreResults: ignore });

    return () => {
      ignore.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = () => {
    const ignore = { current: false };
    loadProperties({ ignoreResults: ignore });
  };

  // Filter logic: only 'sale' listing_type, plus assigned_agent logic:
  const filteredProperties = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return properties.filter((p) => {
      if ((p.listing_type ?? 'sale') !== 'sale') return false;

      if (resolvedAgentId !== null) {
        if (Number(p.assigned_agent ?? -1) !== Number(resolvedAgentId))
          return false;
      } else {
        if (
          p.assigned_agent === null ||
          typeof p.assigned_agent === 'undefined'
        )
          return false;
      }

      if (!lower) return true;
      return (
        p.title.toLowerCase().includes(lower) ||
        p.address.toLowerCase().includes(lower)
      );
    });
  }, [searchTerm, properties, resolvedAgentId]);

  const shouldShowNoData =
    !loading && (Array.isArray(properties) && properties.length === 0 || filteredProperties.length === 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Properties - Sales
          </h1>
          <p className="text-gray-600 text-sm">
            Access assigned sales properties and marketing materials.
          </p>

          <div className="mt-3 text-sm text-gray-500">
            {resolvedAgentId !== null ? (
              <>
                Showing sales assigned to agent{' '}
                <strong>{resolvedAgentId}</strong>.
              </>
            ) : (
              <>Showing sales assigned to any agent.</>
            )}
          </div>
        </header>

        <div className="relative mb-8">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sales properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-base focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>

        {/* loading spinner (matching Rentals) */}
        {loading && (
          <div className="text-center text-gray-500 mb-6">
           
          </div>
        )}

        {/* No-data card (backend empty or filtering empty) */}
        {!loading && shouldShowNoData && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No sales properties available</h3>
            <p className="text-sm text-gray-500 mb-4">
              {loadError
                ? "We couldn't load properties from the server. Please check your connection or try again."
                : "There are no sales assigned to the selected agent or matching your search."}
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                <span className="loading loading-spinner loading-xl"></span>
              </button>

           
            </div>

            {loadError && (
              <div className="mt-4 text-xs text-gray-400">
                <strong>Details:</strong> {loadError}
              </div>
            )}

            {lastFetchAt && (
              <div className="mt-2 text-xs text-gray-300">
                Last attempt: {new Date(lastFetchAt).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {filteredProperties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}

        {!loading && filteredProperties.length === 0 && !shouldShowNoData && (
          <div className="text-center text-gray-500">
            {resolvedAgentId !== null
              ? 'No sales properties found assigned to this agent.'
              : 'No sales properties found that are assigned to any agent.'}
          </div>
        )}
      </div>

      {/* Responsive tweaks; keep design unchanged */}
      <style>
        {`
          @media (min-width: 1200px) and (max-width: 1450px) {
            .flex-wrap button,
            .flex-wrap a {
              padding: 0.5rem 0.7rem !important;
              font-size: 0.85rem !important;
            }
            .flex-wrap img {
              height: 14px !important;
              width: 14px !important;
            }
            .md\\:w-56, .lg\\:w-52 {
              width: 11rem !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default PropertiesSales;
