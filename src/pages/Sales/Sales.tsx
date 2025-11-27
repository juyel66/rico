import React, { useEffect, useState } from 'react';
import FilterSystem from '@/shared/FilterSystem';
import SalesCard from './SalesCard';

interface VillaType {
  id: number;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviewCount: number;
  beds: number;
  baths: number;
  pool: number;
  amenities: string[];
  rateType: string;
  imageUrl: string;
  listing_type?: string; // added so filter can check sale/rent
}

interface PaginationProps {
  totalResults: number;
  resultsPerPage: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  totalResults,
  resultsPerPage,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const start = (currentPage - 1) * resultsPerPage + 1;
  const end = Math.min(currentPage * resultsPerPage, totalResults);

  const pagesToShow: number[] = [];
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 3);

  if (currentPage > totalPages - 3) startPage = Math.max(1, totalPages - 5);
  if (currentPage < 3) endPage = Math.min(totalPages, 6);

  for (let i = startPage; i <= endPage; i++) pagesToShow.push(i);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center py-6 container mx-auto">
      <div className="text-sm font-medium p-5 text-gray-600 mb-4 sm:mb-0">
        Showing {start} to {end} of {totalResults} results
      </div>
      <div className="flex items-center">
        <button
          className="px-4 py-2 mx-1 rounded-lg border hover:bg-gray-100 disabled:text-gray-500"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          ← Previous
        </button>

        {pagesToShow.map((page) => (
          <button
            key={page}
            className={`w-10 h-10 mx-1 flex items-center justify-center rounded-lg text-sm font-semibold ${
              page === currentPage
                ? 'bg-white text-gray-900 border shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => onPageChange(page)}
          >
            {String(page).padStart(2, '0')}
          </button>
        ))}

        <button
          className="px-4 py-2 mx-1 rounded-lg border hover:bg-gray-100 disabled:text-gray-500"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

const API_BASE =
  import.meta.env.VITE_API_BASE || 'https://api.eastmondvillas.com/api';
const PLACEHOLDER_IMG =
  'https://res.cloudinary.com/dqkczdjjs/image/upload/v1760924064/img_5_sd6ueh.png';

const Sales: React.FC = () => {
  const resultsPerPage = 2;

  // master list from API (only sale items will be passed to filter via allowedType, but we still store listing_type)
  const [villas, setVillas] = useState<VillaType[]>([]);
  // filtered results produced by FilterSystem
  const [filtered, setFiltered] = useState<VillaType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    const fetchVillas = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/villas/properties/`);
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`API error: ${res.status} ${text}`);
        }
        const data = await res.json();
        const items: any[] = Array.isArray(data)
          ? data
          : (data.results ?? data.items ?? []);

        // Map every item but include listing_type on the object so FilterSystem can check it.
        const mapped: VillaType[] = items.map((it) => {
          const firstImage =
            (it.media_images &&
              Array.isArray(it.media_images) &&
              it.media_images[0]?.image) ||
            (it.bedrooms_images &&
              Array.isArray(it.bedrooms_images) &&
              it.bedrooms_images[0]?.image) ||
            PLACEHOLDER_IMG;

          const amenities: string[] = [];
          if (it.signature_distinctions) {
            if (Array.isArray(it.signature_distinctions))
              amenities.push(...it.signature_distinctions);
            else
              amenities.push(
                ...Object.values(it.signature_distinctions || {}).map(String)
              );
          }
          if (it.outdoor_amenities) {
            if (Array.isArray(it.outdoor_amenities))
              amenities.push(...it.outdoor_amenities);
            else
              amenities.push(
                ...Object.values(it.outdoor_amenities || {}).map(String)
              );
          }
          if (it.interior_amenities) {
            if (Array.isArray(it.interior_amenities))
              amenities.push(...it.interior_amenities);
            else
              amenities.push(
                ...Object.values(it.interior_amenities || {}).map(String)
              );
          }

          return {
            id: Number(it.id),
            title: it.title || it.slug || it.name || 'Untitled',
            location:
              (it.city && String(it.city).replace(/(^"|"$)/g, '')) ||
              it.address ||
              'Unknown location',
            price:
              Number(it.price) ||
              parseFloat(
                String(it.price_display || '0').replace(/[^0-9.-]/g, '')
              ) ||
              0,
            rating: Number(it.property_stats?.average_rating) || 0,
            reviewCount: Number(it.property_stats?.total_bookings) || 0,
            beds: Number(it.bedrooms) || 0,
            baths: Number(it.bathrooms) || 0,
            pool: Number(it.pool) || 0,
            amenities: amenities.filter(Boolean),
            rateType:
              String(it.listing_type || '').toLowerCase() === 'rent'
                ? 'per night'
                : 'sale',
            imageUrl: firstImage,
            listing_type: it.listing_type ?? '',
          } as VillaType;
        });

        if (!cancelled) {
          // keep full mapped list but filtered state will be controlled by FilterSystem
          setVillas(mapped);
          // pre-filter to only show sale items initially (sales page)
          const onlySales = mapped.filter(
            (m) => String(m.listing_type ?? '').toLowerCase() === 'sale'
          );
          setFiltered(onlySales);
          setCurrentPage(1);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Failed to fetch villas:', err);
          setError(err?.message || 'Failed to load properties');
          setVillas([]);
          setFiltered([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchVillas();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalResults = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / resultsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const currentVillas = filtered.slice(
    (currentPage - 1) * resultsPerPage,
    currentPage * resultsPerPage
  );

  return (
    <div
      className="relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          "url('https://res.cloudinary.com/dqkczdjjs/image/upload/v1760812885/savba_k7kol1.png')",
        marginBottom: '620px',
      }}
    >
      <div className="container mx-auto mb-10">
        {/* Pass full mapped data into FilterSystem and tell it allowedType="sale" */}
        <FilterSystem
          data={villas}
          allowedType="sale"
          onResults={(results) => {
            // results from FilterSystem are already filtered to allowedType
            setFiltered(results ?? []);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Top pagination */}
      <Pagination
        totalResults={totalResults}
        resultsPerPage={resultsPerPage}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(p) => setCurrentPage(p)}
      />

      <div className="space-y-8 container mx-auto">
        {loading && (
          <div className="py-12 flex justify-center">
            <div className="text-gray-600">Loading properties…</div>
          </div>
        )}

        {error && (
          <div className="py-6">
            <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded">
              <div className="font-semibold">Failed to load properties</div>
              <div className="text-sm mt-1">{error}</div>
            </div>
          </div>
        )}

        {!loading && !error && currentVillas.length === 0 && (
          <div className="py-12 flex justify-center">
            <div className="text-gray-600">No properties found.</div>
          </div>
        )}

        {!loading &&
          !error &&
          currentVillas.map((villa) => (
            <div key={villa.id} className="pl-5 pr-5">
              <SalesCard property={villa} />
            </div>
          ))}
      </div>

      {/* Bottom pagination */}
      <Pagination
        totalResults={totalResults}
        resultsPerPage={resultsPerPage}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(p) => setCurrentPage(p)}
      />
    </div>
  );
};

export default Sales;
