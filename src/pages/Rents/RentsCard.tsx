// RentsCard.tsx (or wherever this file lives)
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CiShare2 } from "react-icons/ci";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

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
} from "react-icons/fa";
import { FaTiktok } from "react-icons/fa6";

import {
  selectIsAuthenticated,
  selectCurrentUser,
  getAccessToken,
} from "@/features/Auth/authSlice";

/* -------------------- Types -------------------- */
interface Property {
  id: number;
  price: number;
  beds: number;
  baths: number;
  pool: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  title: string;
  location: string;
  rateType: string;
  // optional favorite flag if backend sends it
  is_favorite?: boolean;
  favorite?: boolean;
  isFavorite?: boolean;
}

/* --------- Favorite localStorage helpers --------- */

const getFavoritesKey = (email: string) => `ev_favorites_${email}`;

const readFavorites = (email: string): string[] => {
  if (typeof window === "undefined") return [];
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
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getFavoritesKey(email), JSON.stringify(list));
  } catch {
    // ignore
  }
};

/* -------------------- API base -------------------- */

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ||
  "https://api.eastmondvillas.com/api";
const FAVORITE_TOGGLE_URL = `${API_BASE}/villas/favorites/toggle/`;

/* -------------------- Share Modal -------------------- */

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
      "_blank",
      `toolbar=0,status=0,width=${w},height=${h},top=${top},left=${left}`
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(propertyUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      prompt("Copy this link:", propertyUrl);
    }
  };

  const platforms = [
    {
      name: "Facebook",
      icon: <FaFacebookF />,
      onClick: () =>
        openSharePopup(
          `https://www.facebook.com/sharer/sharer.php?u=${encoded}`
        ),
    },
    {
      name: "WhatsApp",
      icon: <FaWhatsapp />,
      onClick: () =>
        openSharePopup(`https://wa.me/?text=${encodedTitle}%20${encoded}`),
    },
    {
      name: "Twitter",
      icon: <FaTwitter />,
      onClick: () =>
        openSharePopup(
          `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`
        ),
    },
    {
      name: "LinkedIn",
      icon: <FaLinkedinIn />,
      onClick: () =>
        openSharePopup(
          `https://www.linkedin.com/shareArticle?mini=true&url=${encoded}&title=${encodedTitle}`
        ),
    },
    {
      name: "Telegram",
      icon: <FaTelegramPlane />,
      onClick: () =>
        openSharePopup(
          `https://t.me/share/url?url=${encoded}&text=${encodedTitle}`
        ),
    },
    {
      name: "Pinterest",
      icon: <FaPinterestP />,
      onClick: () =>
        openSharePopup(
          `https://pinterest.com/pin/create/button/?url=${encoded}&description=${encodedTitle}`
        ),
    },
    {
      name: "Reddit",
      icon: <FaRedditAlien />,
      onClick: () =>
        openSharePopup(
          `https://reddit.com/submit?url=${encoded}&title=${encodedTitle}`
        ),
    },
    {
      name: "Email",
      icon: <FaEnvelope />,
      onClick: () =>
        (window.location.href = `mailto:?subject=${encodedTitle}&body=${encoded}`),
    },
    {
      name: "TikTok",
      icon: <FaTiktok />,
      onClick: async () => {
        await copyLink();
        toast("Open TikTok and paste the link.", {
          icon: "🎵",
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

/* -------------------- PropertyCard -------------------- */

const PropertyCard: React.FC<{ property: Property }> = ({ property }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  const [isFavorite, setIsFavorite] = useState<boolean>(() => {
    const apiInitial =
      (property as any).is_favorite ??
      (property as any).favorite ??
      (property as any).isFavorite ??
      false;

    try {
      if (typeof window === "undefined") return apiInitial;
      const email = (currentUser as any)?.email;
      if (!email || !property.id) return apiInitial;

      const stored = readFavorites(email);
      return stored.includes(String(property.id)) || apiInitial;
    } catch {
      return apiInitial;
    }
  });

  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    if (!currentUser?.email || !property.id) return;
    const stored = readFavorites(currentUser.email);
    if (stored.includes(String(property.id))) setIsFavorite(true);
  }, [currentUser, property.id]);

  const formattedPrice = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
  }).format(property.price);

  const amenities = [
    {
      icon: (
        <img
          src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760827484/Frame_3_rwdb0z.png"
          alt="bed"
          className="w-5 h-5"
        />
      ),
      value: `${property.beds} ${
        property.beds === 1 ? "Bed" : "Beds"
      }`,
    },
    {
      icon: (
        <img
          src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760827484/Frame_4_zsqcrj.png"
          alt="bath"
          className="w-5 h-5"
        />
      ),
      value: `${property.baths} ${
        property.baths === 1 ? "Bath" : "Baths"
      }`,
    },
    {
      icon: (
        <img
          src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760827483/Frame_5_cyajjb.png"
          alt="pool"
          className="w-5 h-5"
        />
      ),
      value: `${property.pool} ${
        property.pool === 1 ? "Pool" : "Pools"
      }`,
    },
  ];

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://example.com";
  const propertyUrl = `${origin}/property/${property.id}`;

  const handleToggleFavorite = async (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    e.stopPropagation();
    e.preventDefault();

    if (!property.id) return;

    if (!isAuthenticated) {
      const res = await Swal.fire({
        icon: "info",
        title: "Login required",
        text: "Please login to add this property to your favorites.",
        showCancelButton: true,
        confirmButtonText: "Go to Login",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#0f766e",
      });
      if (res.isConfirmed) {
        window.location.href = "/login";
      }
      return;
    }

    const token = getAccessToken();
    if (!token) {
      const res = await Swal.fire({
        icon: "info",
        title: "Session expired",
        text: "Your session has expired. Please login again.",
        showCancelButton: true,
        confirmButtonText: "Go to Login",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#0f766e",
      });
      if (res.isConfirmed) {
        window.location.href = "/login";
      }
      return;
    }

    if (favoriteLoading) return;

    setFavoriteLoading(true);
    try {
      const res = await fetch(FAVORITE_TOGGLE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ property: property.id }),
      });

      const raw = await res.text();
      let json: any = null;
      try {
        json = raw ? JSON.parse(raw) : null;
      } catch {
        json = raw;
      }

      if (!res.ok) {
        console.error("Favorite toggle failed:", res.status, json);

        if (res.status === 401) {
          const r = await Swal.fire({
            icon: "error",
            title: "Unauthorized",
            text: "Authentication failed. Please login again.",
            showCancelButton: true,
            confirmButtonText: "Go to Login",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#0f766e",
          });
          if (r.isConfirmed) {
            window.location.href = "/login";
          }
        } else {
          await Swal.fire({
            icon: "error",
            title: "Failed",
            text: "Failed to update favorite. Please try again.",
          });
        }
        return;
      }

      const nextState =
        json && typeof json.is_favorite === "boolean"
          ? json.is_favorite
          : !isFavorite;

      setIsFavorite(nextState);

      if (currentUser?.email) {
        const email = currentUser.email;
        const idStr = String(property.id);
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
        icon: "success",
        title: nextState
          ? "Added to favorites"
          : "Removed from favorites",
        showConfirmButton: false,
        timer: 1200,
      });
    } catch (err) {
      console.error("Network error while toggling favorite:", err);
      await Swal.fire({
        icon: "error",
        title: "Network error",
        text: "Could not update favorite. Please try again.",
      });
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <>
      <div className="container relative mx-auto my-8 sm:my-10 bg-white p-4 sm:p-6 rounded-2xl border overflow-hidden font-sans">
        <div className="flex flex-col items-center md:flex-row bg-white rounded-2xl overflow-hidden">
          {/* Image Section */}
          <div
            className="relative w-full md:w-3/5 h-64 sm:h-80 md:h-[400px] lg:h-[450px] bg-cover bg-center rounded-2xl"
            style={{ backgroundImage: `url(${property.imageUrl})` }}
          >
            {/* Rating */}
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl font-semibold text-sm flex items-center space-x-1">
              <span className="text-yellow-500">⭐</span>
              <span className="text-gray-800">{property.rating}</span>
              <span className="text-gray-700 font-normal">
                ({property.reviewCount})
              </span>
            </div>

            {/* Favorite & Share Buttons */}
            <div className="absolute top-3 right-3 flex space-x-2">
              {/* Favorite */}
              <div
                className={`w-9 h-9 flex items-center justify-center bg-white rounded-full text-gray-700 hover:bg-gray-100 transition duration-150 cursor-pointer ${
                  favoriteLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
                onClick={favoriteLoading ? undefined : handleToggleFavorite}
              >
                <svg
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isFavorite ? "text-red-500" : "text-gray-700"
                  }`}
                  fill={isFavorite ? "currentColor" : "none"}
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
              </div>

              <div className="absolute p-2 hidden lg:flex  rounded-full bg-white top-50 -right-14">
                <img
                  src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760828543/hd_svg_logo_2_hw4vsa.png"
                  alt=""
                  className=""
                />
              </div>

              {/* Share */}
              <div
                className="w-9 h-9 flex items-center justify-center bg-white rounded-full text-gray-700 hover:bg-gray-100 transition duration-150 cursor-pointer"
                onClick={() => setIsShareOpen(true)}
              >
                <div className="text-black font-bold">
                  <CiShare2 />
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="w-full ml-5 md:w-2/5 flex flex-col px-4 sm:px-6 md:px-8 mt-4 md:mt-0">
            <div>
              <h3 className="text-[16px] sm:text-2xl md:text-3xl font-extrabold text-gray-900">
                {property.title}
              </h3>
              <p className="text-sm  sm:text-base mt-2 text-gray-500 flex items-center font-medium">
                <img
                  src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760829803/Frame_6_keemxx.png"
                  alt="location"
                  className="w-5  h-5 mr-1"
                />{" "}
                {property.location}
              </p>

              <p className="text-[16px] sm:text-xl md:text-2xl text-emerald-700 font-bold mt-4">
                From <span>USD${formattedPrice}</span>/night
              </p>

              {/* Amenities */}
              <div className="flex flex-wrap items-center text-gray-500 text-xs sm:text-sm md:text-base font-medium mt-4 space-x-4">
                {amenities.map((item, index) => (
                  <div key={index} className="flex items-center space-x-1">
                    {item.icon}
                    <span className="text-gray-700">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <Link
              to={`/property/${property.id}`}
              className="mt-6 w-full py-3 sm:py-4 text-center bg-teal-50 text-emerald-700 font-bold text-base sm:text-lg md:text-xl border-2 border-[#009689] rounded-xl hover:bg-gray-200 transition duration-150"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        propertyUrl={propertyUrl}
        propertyTitle={property.title}
        previewImageUrl={property.imageUrl}
      />
    </>
  );
};

const RentsCard: React.FC<{ property: Property }> = ({ property }) => (
  <div>
    <PropertyCard property={property} />
  </div>
);

export default RentsCard;
