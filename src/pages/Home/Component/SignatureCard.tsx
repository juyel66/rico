// src/components/SignatureCard.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

import {
  FaFacebookF,
  FaWhatsapp,
  FaTwitter,
  FaLinkedinIn,
  FaPinterestP,
  FaRedditAlien,
  FaTelegramPlane,
  FaEnvelope,
  FaRegCopy,
} from 'react-icons/fa';
import { FaTiktok } from 'react-icons/fa6';

import {
  selectIsAuthenticated,
  selectCurrentUser,
  getAccessToken,
} from '@/features/Auth/authSlice';

// --- Favorite localStorage helpers ---
const getFavoritesKey = (email: string) => `ev_favorites_${email}`;

const readFavorites = (email: string): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getFavoritesKey(email));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const writeFavorites = (email: string, list: string[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getFavoritesKey(email), JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
};

// --- Icon Components ---
const LocationIcon = () => (
  <svg className="w-4 h-4 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
    ></path>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    ></path>
  </svg>
);

const BedIcon = () => (
  <img
    className="w-5 h-5 mr-1"
    src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760827484/Frame_3_rwdb0z.png"
    alt="bed-icon"
  />
);
const BathIcon = () => (
  <img
    className="w-5 h-5 mr-1"
    src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760827484/Frame_4_zsqcrj.png"
    alt="bath-icon"
  />
);
const PoolIcon = () => (
  <img
    className="w-5 h-5 mr-1"
    src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760827483/Frame_5_cyajjb.png"
    alt="pool-icon"
  />
);

// Heart icon supports "filled" (favorite) state
const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg
    className={`w-5 h-5 transition-colors duration-200 ${
      filled ? 'text-red-500' : 'text-gray-700'
    }`}
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-.318-.318a4.5 4.5 0 00-6.364 0z"
    ></path>
  </svg>
);

const ShareIcon = () => (
  <img
    className="w-5 h-5"
    src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760923888/Icon_39_piurkh.png"
    alt="share-icon"
  />
);

// Local fallback image (for missing media)
const LOCAL_FALLBACK_IMAGE = '/mnt/data/28e6a12e-2530-41c9-bdcc-03c9610049e3.png';

// API base
const API_BASE =
  (import.meta.env.VITE_API_BASE as string) || 'https://api.eastmondvillas.com/api';
const FAVORITE_TOGGLE_URL = `${API_BASE}/villas/favorites/toggle/`;

// -------- Share Modal (for SignatureCard) --------
interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyUrl: string;
  propertyTitle: string;
  previewImageUrl: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  propertyUrl,
  propertyTitle,
  previewImageUrl,
}) => {
  if (!isOpen) return null;

  const encoded = encodeURIComponent(propertyUrl);
  const encodedTitle = encodeURIComponent(propertyTitle);

  const openSharePopup = (url: string) => {
    const w = 700;
    const h = 600;
    const left = window.screenLeft + (window.innerWidth - w) / 2;
    const top = window.screenTop + (window.innerHeight - h) / 2;
    window.open(
      url,
      '_blank',
      `toolbar=0,status=0,width=${w},height=${h},top=${top},left=${left}`
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(propertyUrl);
      toast.success('Link copied to clipboard!');
    } catch {
      prompt('Copy this link:', propertyUrl);
    }
  };

  const platforms = [
    {
      name: 'Facebook',
      icon: <FaFacebookF />,
      onClick: () =>
        openSharePopup(
          `https://www.facebook.com/sharer/sharer.php?u=${encoded}`
        ),
    },
    {
      name: 'WhatsApp',
      icon: <FaWhatsapp />,
      onClick: () =>
        openSharePopup(`https://wa.me/?text=${encodedTitle}%20${encoded}`),
    },
    {
      name: 'Twitter',
      icon: <FaTwitter />,
      onClick: () =>
        openSharePopup(
          `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`
        ),
    },
    {
      name: 'LinkedIn',
      icon: <FaLinkedinIn />,
      onClick: () =>
        openSharePopup(
          `https://www.linkedin.com/shareArticle?mini=true&url=${encoded}&title=${encodedTitle}`
        ),
    },
    {
      name: 'Telegram',
      icon: <FaTelegramPlane />,
      onClick: () =>
        openSharePopup(
          `https://t.me/share/url?url=${encoded}&text=${encodedTitle}`
        ),
    },
    {
      name: 'Pinterest',
      icon: <FaPinterestP />,
      onClick: () =>
        openSharePopup(
          `https://pinterest.com/pin/create/button/?url=${encoded}&description=${encodedTitle}`
        ),
    },
    {
      name: 'Reddit',
      icon: <FaRedditAlien />,
      onClick: () =>
        openSharePopup(
          `https://reddit.com/submit?url=${encoded}&title=${encodedTitle}`
        ),
    },
    {
      name: 'Email',
      icon: <FaEnvelope />,
      onClick: () =>
        (window.location.href = `mailto:?subject=${encodedTitle}&body=${encoded}`),
    },
    {
      name: 'TikTok',
      icon: <FaTiktok />,
      onClick: async () => {
        await copyLink();
        toast('Open TikTok and paste the link.', {
          icon: '🎵',
        });
      },
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-gray-800">
            Share This Listing
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 text-3xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="flex items-center gap-4 mb-3">
          <img
            src={previewImageUrl}
            alt="preview"
            className="w-28 h-20 object-cover rounded-md border"
          />
          <div className="flex-1">
            <div className="font-semibold text-gray-800">{propertyTitle}</div>
            <div className="text-sm text-gray-500 truncate">{propertyUrl}</div>
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-1 bg-gray-100 border px-3 py-2 rounded text-sm"
          >
            <FaRegCopy /> Copy
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {platforms.map((p) => (
            <button
              key={p.name}
              onClick={p.onClick}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded hover:bg-gray-100"
            >
              <span className="text-2xl text-teal-600">{p.icon}</span>
              <span className="font-medium text-gray-800">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// -------- SignatureCard --------
interface SignatureCardProps {
  villa?: any;
}

const SignatureCard: React.FC<SignatureCardProps> = ({ villa }) => {
  // default for skeleton
  const defaultVilla = {
    title: 'Loading Villa',
    address: 'Unknown address',
    city: '',
    price_display: 'N/A',
    rating: 0,
    reviewCount: 0,
    bedrooms: 0,
    bathrooms: 0,
    pool: 0,
    interior_amenities: [],
    outdoor_amenities: [],
    signature_distinctions: [],
    media_images: [],
    is_favorite: false,
  };

  const v = villa || defaultVilla;
  const vId = v.id;

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  const [isFavorite, setIsFavorite] = useState<boolean>(() => {
    const apiInitial = Boolean(v.is_favorite ?? v.favorite ?? v.isFavorite ?? false);

    try {
      if (typeof window === 'undefined') return apiInitial;
      const email = (currentUser as any)?.email;
      if (!email || !vId) return apiInitial;

      const stored = readFavorites(email);
      return stored.includes(String(vId)) || apiInitial;
    } catch {
      return apiInitial;
    }
  });

  const [favoriteLoading, setFavoriteLoading] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);

  // sync when currentUser later loads
  useEffect(() => {
    if (!currentUser?.email || !vId) return;
    const stored = readFavorites(currentUser.email);
    if (stored.includes(String(vId))) setIsFavorite(true);
  }, [currentUser, vId]);

  // Map fields from your API shape to UI-friendly fields
  const title = v.title || v.slug || defaultVilla.title;
  const location =
    v.address && v.city
      ? `${v.address}, ${v.city}`
      : v.address || v.city || 'Location not specified';
  const price = v.price_display || v.price || defaultVilla.price_display;

  const rating =
    v.rating ??
    (v.property_stats && v.property_stats.total_bookings ? 4.6 : 0);
  const reviewCount =
    v.reviewCount ?? (v.property_stats ? v.property_stats.total_bookings : 0);

  const beds = Number(
    v.bedrooms ?? v.property_info?.bedrooms ?? v.beds ?? defaultVilla.bedrooms
  );
  const baths = Number(
    v.bathrooms ?? v.property_info?.bathrooms ?? v.baths ?? defaultVilla.bathrooms
  );
  const poolCount = Number(v.pool ?? v.has_pool ?? defaultVilla.pool);

  const interior = Array.isArray(v.interior_amenities)
    ? v.interior_amenities
    : v.interior_amenities && typeof v.interior_amenities === 'object'
    ? Object.keys(v.interior_amenities).filter((k) => v.interior_amenities[k])
    : [];

  const outdoor = Array.isArray(v.outdoor_amenities)
    ? v.outdoor_amenities
    : v.outdoor_amenities && typeof v.outdoor_amenities === 'object'
    ? Object.keys(v.outdoor_amenities).filter((k) => v.outdoor_amenities[k])
    : [];

  const signature = Array.isArray(v.signature_distinctions)
    ? v.signature_distinctions
    : v.signature_distinctions && typeof v.signature_distinctions === 'object'
    ? Object.keys(v.signature_distinctions).filter(
        (k) => v.signature_distinctions[k]
      )
    : [];

  const amenities = Array.from(
    new Set([
      ...(signature || []),
      ...(interior || []).slice(0, 3),
      ...(outdoor || []).slice(0, 2),
    ])
  );

  let imageUrl = LOCAL_FALLBACK_IMAGE;
  if (Array.isArray(v.media_images) && v.media_images.length > 0) {
    const first = v.media_images[0];
    imageUrl = first.file_url || first.image || first.file || LOCAL_FALLBACK_IMAGE;
  } else if (v.main_image_url) {
    imageUrl = v.main_image_url;
  } else if (v.media && Array.isArray(v.media) && v.media.length > 0) {
    imageUrl = v.media[0].file_url || v.media[0].file || LOCAL_FALLBACK_IMAGE;
  }

  const pluralize = (count: number, singular: string) =>
    `${count} ${count === 1 ? singular : singular + 's'}`;

  const detailsPath = vId
    ? `/property/${encodeURIComponent(vId)}`
    : v.slug
    ? `/property/${encodeURIComponent(v.slug)}`
    : `/property`;

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://example.com';
  const propertyUrl = `${origin}${detailsPath}`;

  // Favorite toggle handler
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!vId) {
      console.warn('Missing villa id, cannot toggle favorite');
      return;
    }

    if (!isAuthenticated) {
      const res = await Swal.fire({
        icon: 'info',
        title: 'Login required',
        text: 'Please login to add this villa to your favorites.',
        showCancelButton: true,
        confirmButtonText: 'Go to Login',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#0f766e',
      });
      if (res.isConfirmed) {
        window.location.href = '/login';
      }
      return;
    }

    const token = getAccessToken();
    if (!token) {
      const res = await Swal.fire({
        icon: 'info',
        title: 'Session expired',
        text: 'Your session has expired. Please login again.',
        showCancelButton: true,
        confirmButtonText: 'Go to Login',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#0f766e',
      });
      if (res.isConfirmed) {
        window.location.href = '/login';
      }
      return;
    }

    if (favoriteLoading) return;

    setFavoriteLoading(true);
    try {
      const res = await fetch(FAVORITE_TOGGLE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ property: vId }),
      });

      const raw = await res.text();
      let json: any = null;
      try {
        json = raw ? JSON.parse(raw) : null;
      } catch {
        json = raw;
      }

      if (!res.ok) {
        console.error('Favorite toggle failed:', res.status, json);

        if (res.status === 401) {
          const r = await Swal.fire({
            icon: 'error',
            title: 'Unauthorized',
            text: 'Authentication failed. Please login again.',
            showCancelButton: true,
            confirmButtonText: 'Go to Login',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#0f766e',
          });
          if (r.isConfirmed) {
            window.location.href = '/login';
          }
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: 'Failed to update favorite. Please try again.',
          });
        }
        return;
      }

      const nextState =
        json && typeof json.is_favorite === 'boolean'
          ? json.is_favorite
          : !isFavorite;

      setIsFavorite(nextState);

      if (currentUser?.email) {
        const email = currentUser.email;
        const idStr = String(vId);
        const existing = readFavorites(email);

        let nextList: string[];
        if (nextState) {
          if (!existing.includes(idStr)) {
            nextList = [...existing, idStr];
          } else {
            nextList = existing;
          }
        } else {
          nextList = existing.filter((x) => x !== idStr);
        }

        writeFavorites(email, nextList);
      }

      await Swal.fire({
        icon: 'success',
        title: nextState ? 'Added to favorites' : 'Removed from favorites',
        showConfirmButton: false,
        timer: 1200,
      });
    } catch (err) {
      console.error('Network error while toggling favorite:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Network error',
        text: 'Could not update favorite. Please try again.',
      });
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden transform transition duration-300 hover:scale-[1.02] hover:shadow-2xl w-full">
        {/* Image */}
        <div className="relative h-60 w-full md:h-64">
          <img className="w-full h-full object-cover" src={imageUrl} alt={title} />

          {/* Rating */}
          <div className="absolute top-3 left-3 flex items-center bg-white text-black text-sm font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
            <span className="text-yellow-400 mr-1">★</span>
            {rating} ({reviewCount})
          </div>

          {/* Heart & Share */}
          <div className="absolute top-3 right-3 flex space-x-2">
            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
              className={`p-2 bg-white rounded-full shadow-md transition duration-200 ${
                isFavorite ? 'text-red-500' : 'text-black hover:text-red-500'
              }`}
            >
              <HeartIcon filled={isFavorite} />
            </button>
            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="p-2 bg-white rounded-full text-black hover:text-teal-500 hover:bg-white shadow-md transition duration-200"
            >
              <ShareIcon />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
            {title}
          </h3>

          {/* Location */}
          <div className="flex items-center text-sm md:text-base text-gray-600 mb-3">
            <img
              className="w-4 h-4 mr-1 md:w-5 md:h-5"
              src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1761076568/Frame_11_cfkzkx.png"
              alt="location-icon"
            />
            <span className="truncate">{location}</span>
          </div>

          {/* Price */}
          <p className="text-teal-600 font-extrabold text-lg md:text-2xl mb-4">
            From USD${price}/night
          </p>

          {/* Specs */}
          <div className="flex flex-wrap md:flex-nowrap gap-4 border-y border-gray-100 py-3 mb-4 text-sm md:text-base">
            <div className="flex items-center">
              <BedIcon /> {pluralize(beds, 'Bed')}
            </div>
            <div className="flex items-center">
              <BathIcon /> {pluralize(baths, 'Bath')}
            </div>
            <div className="flex items-center">
              <PoolIcon /> {pluralize(poolCount, 'Pool')}
            </div>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
            {amenities.length > 0 ? (
              amenities.map((amenity: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-xs md:text-sm font-medium text-teal-700 bg-teal-50 border border-teal-300 rounded-full"
                >
                  {amenity}
                </span>
              ))
            ) : (
              <span className="px-3 py-1 text-xs md:text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-full">
                No amenities listed
              </span>
            )}
          </div>

          {/* View Details */}
          <Link
            to={detailsPath}
            className="block text-center py-3 border-2 bg-teal-50 border-teal-500 font-extrabold text-teal-500 rounded-lg hover:bg-teal-100 transition duration-200"
          >
            View Details
          </Link>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        propertyUrl={propertyUrl}
        propertyTitle={title}
        previewImageUrl={imageUrl}
      />
    </>
  );
};

export default SignatureCard;
