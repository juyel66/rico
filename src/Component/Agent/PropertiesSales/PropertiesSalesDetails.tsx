// src/features/Properties/PropertiesSalesDetails.tsx
import React, { FC, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface Property {
  id?: number;
  title: string;
  status: string;
  listing_type?: 'rent' | 'sale' | 'other';
  location: string;
  image_url: string;
  description: string;

  // numbers / booking stats
  add_guest?: number;
  bedrooms?: number;
  bathrooms?: number;
  pool?: number;
  price?: number;
  price_display?: string;

  // financials
  commission_rate?: string;
  security_deposit?: string;
  damage_deposit?: string;

  // amenities
  outdoor_amenities: string[];
  interior_amenities: string[];
  signature_distinctions: string[];

  // SEO
  seo_info: {
    meta_title: string;
    meta_description: string;
    keywords: string[];
  };

  viewing_link: string;

  // misc
  staff_name?: string;
  concierge_services: string[];

  _raw?: any;
}

// --- API base (use env var if available) ---
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE?.replace(/\/+$/, '') ||
  'http://localhost:8888/api';

// --- HELPER FUNCTIONS ---
const showActionMessage = (message: string) => {
  console.log(message);
  alert(message);
};

const copyToClipboard = (text: string, successMessage: string) => {
  try {
    if (!text) {
      showActionMessage('Nothing to copy.');
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showActionMessage(successMessage));
    } else {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showActionMessage(successMessage);
    }
  } catch (e) {
    console.error('copy failed', e);
    showActionMessage('Copy failed');
  }
};

const downloadImage = async (imgUrl?: string | null, title = 'image') => {
  if (!imgUrl) {
    showActionMessage('No image available to download.');
    return;
  }
  try {
    const url =
      String(imgUrl).startsWith('http') || String(imgUrl).startsWith('//')
        ? String(imgUrl)
        : `${API_BASE.replace(/\/api\/?$/, '')}${
            imgUrl.startsWith('/') ? imgUrl : '/' + imgUrl
          }`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    const ext = blob.type.split('/')[1] || 'jpg';
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Download error:', err);
    showActionMessage('Failed to download image.');
  }
};

// --- QUICK ACTION BUTTON ---
interface QuickActionButtonProps {
  imgSrc: string;
  label: string;
  onClick?: () => void;
}
const QuickActionButton: FC<QuickActionButtonProps> = ({ imgSrc, label, onClick }) => (
  <button
    onClick={onClick}
    type="button"
    className="flex items-center space-x-2 px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg shadow-sm hover:bg-gray-100 transition duration-150 border border-gray-200 cursor-pointer"
  >
    <img src={imgSrc} alt={label} className="w-5 h-5" />
    <span>{label}</span>
  </button>
);

const formatMoney = (value?: string | number) => {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!n || Number.isNaN(n)) return '';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const PropertiesSalesDetails: FC = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [localStatus, setLocalStatus] = useState<string>('draft');

  useEffect(() => {
    if (!id) {
      setError('Property ID missing from URL.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchProperty = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${API_BASE.replace(/\/+$/, '')}/villas/properties/${encodeURIComponent(
          id
        )}/`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) {
          if (res.status === 404) throw new Error('Property not found (404).');
          throw new Error(`Failed to fetch property (status ${res.status}).`);
        }
        const p = await res.json();

        // --- Normalize listing_type from backend ---
        const rawLt = String(p.listing_type ?? p.listingType ?? '')
          .toLowerCase()
          .trim();
        let normalizedLt: 'rent' | 'sale' | 'other' = 'other';
        if (rawLt === 'sale' || rawLt === 'sales') {
          normalizedLt = 'sale';
        } else if (rawLt === 'rent' || rawLt === 'rental' || rawLt === 'rentals') {
          normalizedLt = 'rent';
        } else {
          normalizedLt = 'other';
        }

        // --- Normalize arrays that sometimes come as {} ---
        const normalizeStringArray = (val: any): string[] => {
          if (!val) return [];
          if (Array.isArray(val)) return val.map(String);
          if (typeof val === 'object') return Object.values(val).map((v) => String(v));
          return [];
        };

        const outdoorAmenities = normalizeStringArray(p.outdoor_amenities);
        const interiorAmenities = normalizeStringArray(p.interior_amenities);
        const signatureDistinctions = normalizeStringArray(p.signature_distinctions);
        const conciergeServices = normalizeStringArray(p.concierge_services);
        // staff might be object or array
        let staffName: string | undefined;
        if (Array.isArray(p.staff) && p.staff.length > 0) {
          staffName = p.staff[0]?.name ?? '';
        } else if (p.staff && typeof p.staff === 'object') {
          staffName = p.staff.name ?? '';
        }

        // map server object to local Property shape (safe fallbacks)
        let img = p.main_image_url ?? p.image_url ?? p.imageUrl ?? null;
        if (!img && Array.isArray(p.media_images) && p.media_images.length > 0) {
          img = p.media_images[0]?.image ?? null;
        }
        if (img && img.startsWith('/')) {
          img = `${API_BASE.replace(/\/api\/?$/, '')}${img}`;
        }

        const address =
          p.address ??
          (p.location ? (typeof p.location === 'string' ? p.location : '') : '') ??
          p.city ??
          '—';

        const mapped: Property = {
          id: Number(p.id ?? p.pk ?? NaN),
          title: p.title ?? p.name ?? 'Untitled',
          status: String(p.status ?? 'draft'),
          listing_type: normalizedLt,
          location: address,
          image_url:
            img ||
            'https://placehold.co/800x600/6b7280/ffffff?text=Image+Unavailable',
          description: p.description ?? p.short_description ?? '',

          add_guest: Number(p.add_guest ?? 0) || 0,
          bedrooms: Number(p.bedrooms ?? 0) || 0,
          bathrooms: Number(p.bathrooms ?? 0) || 0,
          pool: Number(p.pool ?? 0) || 0,
          price: Number(p.price ?? p.price_display ?? 0) || 0,
          price_display: String(p.price_display ?? p.price ?? ''),

          commission_rate: p.commission_rate ?? p.agent_commission ?? '',
          security_deposit: p.security_deposit ?? '',
          damage_deposit: p.damage_deposit ?? '',

          outdoor_amenities: outdoorAmenities,
          interior_amenities: interiorAmenities,
          signature_distinctions: signatureDistinctions,

          seo_info: {
            meta_title: p.seo_title ?? p.seo_info?.meta_title ?? '',
            meta_description:
              p.seo_description ?? p.seo_info?.meta_description ?? '',
            keywords:
              p.signature_distinctions?.slice?.(0, 4)?.map((k: string) =>
                String(k)
              ) ?? p.seo_keywords ?? [],
          },

          viewing_link: p.calendar_link ?? p.viewing_link ?? p.calendar_url ?? '',
          staff_name: staffName,
          concierge_services: conciergeServices,
          _raw: p,
        };

        if (!cancelled) {
          setProperty(mapped);
          setLocalStatus(mapped.status ?? 'draft');
        }
      } catch (err: any) {
        console.error('Fetch property error:', err);
        if (!cancelled) setError(err?.message ?? 'Failed to load property.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProperty();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-700 text-lg">
        Loading property...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-red-600">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-center mb-4">{error}</p>
      <Link
          to="/dashboard/agent-properties-sales"
          className="flex w-15 items-center text-gray-500 hover:text-gray-800 transition-colors mb-4"
          aria-label="Back to Agent List"
        >
          <ChevronLeft className=" h-5 mr-1" />
          <span className="text-sm font-medium">Back</span>
        </Link>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-700">
        No property data available.
      </div>
    );
  }

  // allow both rent & sale, block only "other"
  const listingTypeSafe = String(property.listing_type || '').toLowerCase();
  if (listingTypeSafe !== 'rent' && listingTypeSafe !== 'sale') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 text-center">
          <h2 className="text-xl font-semibold mb-2">Not a sales listing</h2>
          <p className="text-gray-600 mb-4">
            This page only shows properties listed for <strong>sale</strong>.
          </p>
          <Link
            to="/dashboard/agent-properties-sales"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Sales
          </Link>
        </div>
      </div>
    );
  }

  const getStatusStyle = (status: string) => {
    switch (String(status).toLowerCase()) {
      case 'published':
        return 'bg-green-100 text-green-700';
      case 'sold':
        return 'bg-gray-200 text-gray-600';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // --- Quick Action Handlers (matching screenshot labels) ---
  const handleShowAmenities = () => {
    const el = document.getElementById('outdoor-amenities-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      showActionMessage('Amenities section not found on page.');
    }
  };

  const handleShowStaff = () => {
    if (property.staff_name) {
      showActionMessage(`Staff: ${property.staff_name}`);
    } else {
      showActionMessage('No staff information available.');
    }
  };

  const handleShowAvailability = () => {
    if (property.viewing_link) {
      window.open(property.viewing_link, '_blank', 'noopener');
    } else {
      showActionMessage('No viewing / calendar link set for this property.');
    }
  };

  const handleCopyDescription = () =>
    copyToClipboard(property.description ?? '', 'Description copied!');

  const handleCopyCalendarLink = () =>
    copyToClipboard(property.viewing_link ?? '', 'Calendar link copied!');

  const handleDownloadImages = () =>
    downloadImage(property.image_url, property.title);

  const handleMarkAsSold = () => {
    setLocalStatus('sold');
    showActionMessage('This property has been marked as SOLD (local state only).');
  };

  return (
    <div className="min-h-screen p-4 bg-gray-50 font-sans">
      <div className="">
        {/* Back */}
        <Link
          to="/dashboard/agent-properties-sales"
          className="flex w-15 items-center text-gray-500 hover:text-gray-800 transition-colors mb-4"
          aria-label="Back to Agent List"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span className="text-sm font-medium">Back</span>
        </Link>

        {/* Quick Actions - styled similar to screenshot */}
        <div className="p-4 bg-white rounded-xl shadow-lg mb-6 border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <QuickActionButton
              imgSrc="https://res.cloudinary.com/dqkczdjjs/image/upload/v1765151030/verified-badge-line_gyst1a.png"
              label="Amenities"
              onClick={handleShowAmenities}
            />
            <QuickActionButton
              imgSrc="https://res.cloudinary.com/dqkczdjjs/image/upload/v1765151081/user-community-line_sodsbc.png"
              label="Show Staff"
              onClick={handleShowStaff}
            />
            <QuickActionButton
              imgSrc="https://res.cloudinary.com/dqkczdjjs/image/upload/v1765151122/search-eye-line_w28zd9.png"
              label="Show Availability"
              onClick={handleShowAvailability}
            />
            <QuickActionButton
              imgSrc="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760999922/Icon_41_fxo3ap.png"
              label="Copy Description"
              onClick={handleCopyDescription}
            />
            <QuickActionButton
              imgSrc="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760915210/Icon_31_evyeki.png"
              label="Copy Calendar Link"
              onClick={handleCopyCalendarLink}
            />
            <QuickActionButton
              imgSrc="https://res.cloudinary.com/dqkczdjjs/image/upload/v1765151173/Icon_8_kvhjox.png"
              label="Download Images"
              onClick={handleDownloadImages}
            />
            <QuickActionButton
              imgSrc="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920087/Icon_35_dskkg0.png"
              label="Mark as Sold"
              onClick={handleMarkAsSold}
            />
          </div>
        </div>

        {/* Property card - same style as screenshot */}
        <h2 className="text-xl font-bold text-gray-800 mb-3">Property</h2>
        <div className="bg-white shadow-xl rounded-xl overflow-hidden p-6 mb-8 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left image */}
            <div className="lg:w-1/3 flex-shrink-0">
              <div className="relative h-56 rounded-lg overflow-hidden">
                <img
                  src={property.image_url}
                  alt={property.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://placehold.co/800x600/6b7280/ffffff?text=Image+Unavailable';
                  }}
                />
              </div>
            </div>

            {/* Right info */}
            <div className="lg:w-2/3 flex flex-col">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                    {property.title}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {property.location}
                  </p>
                 
                </div>
                <span
                  className={`text-xs md:text-sm font-semibold px-3 py-1 rounded-full ${getStatusStyle(
                    localStatus
                  )}`}
                >
                  {localStatus}
                </span>
              </div>


              {/* Guests / beds / baths / pools */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-700">
                <div className="flex items-center gap-1">
                  <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1765152495/user-fill_tqy1wd.png" alt="" />
                  <span>
                    {property.add_guest ?? 0} Guests
                  </span>
                </div>
                <div className="flex items-center gap-1">
                 <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1765152495/Frame_nlg3eb.png" alt="" />
                  <span>{property.bedrooms ?? 0} Beds</span>
                </div>
                <div className="flex items-center gap-1">
                 <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1765152494/Frame_1_ivr5pt.png" alt="" />
                  <span>{property.bathrooms ?? 0} Baths</span>
                </div>
                <div className="flex items-center gap-1">
                  <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1765152494/Frame_2_wnawev.png" alt="" />
                  <span>{property.pool ?? 0} Pools</span>
                </div>
              </div>

              {/* Commission & Damage deposit */}
              <div className="flex flex-wrap items-center gap-6 mt-4 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <img
                    src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920561/discount-percent-fill_fc6s5e.png"
                    alt="Commission"
                    className="w-4 h-4"
                  />
                  <span>
                    {property.commission_rate
                      ? `${property.commission_rate}% Commission offered to agent`
                      : 'Commission rate not set'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <img
                    src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920087/Icon_35_dskkg0.png"
                    alt="Damage Deposit"
                    className="w-4 h-4"
                  />
                  <span>
                    {property.damage_deposit
                      ? `US$ ${formatMoney(property.damage_deposit)} Damage Deposit`
                      : 'No Damage Deposit'}
                  </span>
                </div>
              </div>

              {/* Booking status + calendar accuracy */}
              <div className="flex flex-wrap items-center gap-6 mt-4 text-xs md:text-sm text-gray-600">
                <div className="flex items-center gap-2">
                 <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1765152494/shake-hands-fill_1_sthkzu.png" alt="" />
                  <span>Booking TBC by Owner</span>
                </div>
                <div className="flex items-center gap-2">
                 <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1765152493/calendar-fill_h12equ.png" alt="" />
                  <span>100% Calendar accuracy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <h2 className="text-xl font-bold text-gray-800 mb-3">Description</h2>
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-200">
          <div
            className={`text-gray-700 leading-relaxed transition-all duration-300 ${
              isExpanded ? 'max-h-full' : 'max-h-[150px] overflow-hidden'
            }`}
            style={{ whiteSpace: 'pre-line' }}
          >
            {property.description}
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition"
          >
            {isExpanded ? 'See less…' : 'See more…'}
          </button>
        </div>

        {/* Outdoor Amenities (match screenshot section title) */}
        <h2
          id="outdoor-amenities-section"
          className="text-xl font-bold text-gray-800 mb-3"
        >
          Outdoor Amenities
        </h2>
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-200">
          {property.outdoor_amenities.length === 0 &&
          property.interior_amenities.length === 0 ? (
            <p className="text-gray-500 text-sm">No amenities added yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
              {[...property.outdoor_amenities, ...property.interior_amenities].map(
                (amenity, index) => (
                  <div
                    key={index}
                    className="flex items-center text-gray-700 text-sm md:text-base"
                  >
                    <img
                      src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760921593/Frame_1000004304_lba3o7.png"
                      alt=""
                      className="mr-2"
                    />
                    <span>{amenity}</span>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* SEO & Marketing Information */}
        <h2 className="text-xl font-bold text-gray-800 mb-3">
          SEO & Marketing Information
        </h2>
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-200 space-y-4">
          <div>
            <p className="text-gray-500 text-sm font-medium">Meta Title</p>
            <p className="text-gray-800 font-semibold">
              {property.seo_info?.meta_title}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">
              Meta Description
            </p>
            <p className="text-gray-700  font-semibold">
              {property.seo_info?.meta_description}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium mb-2">Keywords</p>
            <div className="flex flex-wrap gap-2">
              {property.seo_info?.keywords?.map((keyword, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Viewing Calendar / Schedule a Viewing */}
        <h2 className="text-xl font-bold text-gray-800 mb-3">
          Viewing Calendar
        </h2>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <p className="text-gray-500 text-sm font-medium mb-1">
            Schedule a Viewing
          </p>
        
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          
            <span className="text-xs text-gray-500 break-all">
              {property.viewing_link || 'No link available'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesSalesDetails;
