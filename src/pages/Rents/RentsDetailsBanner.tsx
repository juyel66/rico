// File: RentsDetailsBanner.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const LOCAL_PREVIEW = '/mnt/data/ff015d0f-3872-4d4d-a90f-8ac7502627ac.png';

// Use same base fallback as your slice
const API_BASE =
  (import.meta && (import.meta as any).env?.VITE_API_BASE) ||
  'https://api.eastmondvillas.com/api';

const getAccessToken = () => {
  try {
    return localStorage.getItem('auth_access');
  } catch {
    return null;
  }
};

const pluralize = (
  count: number | string | undefined | null,
  singular: string,
  plural?: string
) => {
  const n = Number(count) || 0;
  return n === 1 ? singular : (plural ?? singular + 's');
};

// ------------------------- BookingModal (now posts directly) -------------------------
interface FormData {
  name: string;
  email: string;
  check_in_data: string;
  check_out_data: string;
  guests: number;
  phone: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: number | string;
  villaPrice?: string | number | null;
  onSuccess?: (resp?: any) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  villaPrice,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    check_in_data: '',
    check_out_data: '',
    guests: 1,
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'number' ? (value === '' ? 0 : parseInt(value, 10)) : value,
    }));
  };

  const calcTotalPrice = (): string => {
    try {
      if (!formData.check_in_data || !formData.check_out_data) return '0.00';
      const inDate = new Date(formData.check_in_data);
      const outDate = new Date(formData.check_out_data);
      const diffMs = outDate.getTime() - inDate.getTime();
      const nights = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      const perNight = Number(villaPrice) || 0;
      const total = nights * perNight;
      return (Math.round((total + Number.EPSILON) * 100) / 100).toFixed(2);
    } catch {
      return '0.00';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If not logged in, redirect to login immediately
    const token = getAccessToken();
    if (!token) {
      toast.error('Please log in to create a booking.');
      // close modal and send user to login (preserve return url if desired)
      onClose();
      // redirect to login (simple redirect — adapt to router if needed)
      window.location.assign('/login');
      return;
    }

    setLoading(true);

    const total_price = calcTotalPrice();

    const payload = {
      property: propertyId,
      full_name: formData.name,
      email: formData.email,
      phone: formData.phone,
      check_in: formData.check_in_data,
      check_out: formData.check_out_data,
      total_price: total_price,
    };

    try {
      const res = await fetch(`${API_BASE}/villas/bookings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('Booking POST failed:', data);
        Swal.fire({
          icon: 'error',
          title: 'Booking failed',
          text: data?.detail || res.statusText,
        });
        toast.error(data?.detail || res.statusText || 'Booking failed');
        setLoading(false);
        return;
      }

      console.log('Booking created successfully:', data);
      Swal.fire({
        title: 'Booking created successfully!',
        icon: 'success',
      });
      setFormData({
        name: '',
        email: '',
        check_in_data: '',
        check_out_data: '',
        guests: 1,
        phone: '',
      });
      onClose();
      toast.success('Booking created successfully!');
      if (onSuccess) onSuccess(data);
    } catch (err) {
      console.error('Booking error:', err);
      toast.error('Booking failed — see console.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 m-4 transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-gray-800">
            Book Your Stay
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 text-3xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded"
                placeholder="John Guest"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded"
                placeholder="guest@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded"
                placeholder="+1234567890"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in
                </label>
                <input
                  name="check_in_data"
                  type="date"
                  value={formData.check_in_data}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-out
                </label>
                <input
                  name="check_out_data"
                  type="date"
                  value={formData.check_out_data}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>

            <div className="text-sm text-gray-700">
              <strong>Total price (calculated):</strong> ${calcTotalPrice()}
            </div>
          </div>

          <div className="mt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded disabled:opacity-60"
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ------------------------- ShareModal (only platform buttons, no long link under each) -------------------------
interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: number | string;
  propertyTitle?: string;
  previewImageUrl?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  propertyId = 42,
  propertyTitle = 'Property',
  previewImageUrl = LOCAL_PREVIEW,
}) => {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://example.com';
  const propertyUrl = `${origin}/properties/${propertyId}`;
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
      url: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    },
    {
      name: 'WhatsApp',
      icon: <FaWhatsapp />,
      url: `https://wa.me/?text=${encoded}`,
    },
    {
      name: 'Twitter',
      icon: <FaTwitter />,
      url: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`,
    },
    {
      name: 'LinkedIn',
      icon: <FaLinkedinIn />,
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encoded}&title=${encodedTitle}`,
    },
    {
      name: 'Telegram',
      icon: <FaTelegramPlane />,
      url: `https://t.me/share/url?url=${encoded}&text=${encodedTitle}`,
    },
    {
      name: 'Pinterest',
      icon: <FaPinterestP />,
      url: `https://pinterest.com/pin/create/button/?url=${encoded}&description=${encodedTitle}`,
    },
    {
      name: 'Reddit',
      icon: <FaRedditAlien />,
      url: `https://reddit.com/submit?url=${encoded}&title=${encodedTitle}`,
    },
    {
      name: 'Email',
      icon: <FaEnvelope />,
      url: `mailto:?subject=${encodedTitle}&body=${encoded}`,
    },
  ];

  if (!isOpen) return null;

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
            className="bg-gray-100 border px-3 py-2 rounded"
          >
            {' '}
            <FaRegCopy />{' '}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {platforms.map((p) => (
            <button
              key={p.name}
              onClick={() => openSharePopup(p.url)}
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

// ------------------------- Main Component: RentsDetailsBanner -------------------------
interface RentsDetailsBannerProps {
  villa?: any; // pass the API object here (or rely on redux slice fallback)
}

const RentsDetailsBanner: React.FC<RentsDetailsBannerProps> = ({ villa }) => {
  // If parent didn't pass villa, try to read currentProperty from redux slice
  const currentProperty = useSelector(
    (state: any) => state.propertyBooking?.currentProperty
  );

  const effectiveVilla = villa ?? currentProperty ?? null;

  const propertyId = effectiveVilla?.id ?? 42;
  const title =
    effectiveVilla?.title ??
    effectiveVilla?.name ??
    "Seaclusion – Barbados' Platinum Coast";
  const addressText =
    effectiveVilla?.address ?? effectiveVilla?.city ?? 'Downtown, NY';

  const guestsCount = Number(
    effectiveVilla?.add_guest ?? effectiveVilla?.guests ?? 0
  );

  const bedsCount = Number(effectiveVilla?.bedrooms ?? 0);
  const bathsCount = Number(effectiveVilla?.bathrooms ?? 0);
  const poolCount = Number(effectiveVilla?.pool ?? 0);

  const previewImage =
    (Array.isArray(effectiveVilla?.media_images) &&
      effectiveVilla.media_images[0]?.image) ||
    LOCAL_PREVIEW;

  // Determine listing type (be forgiving: 'rent', 'rental', 'sale', 'sales')
  const listingType = String(effectiveVilla?.listing_type ?? '').toLowerCase();
  const isRentType =
    listingType === 'rent' ||
    listingType === 'rental' ||
    listingType === 'rentals';
  const isSaleType = listingType === 'sale' || listingType === 'sales';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    console.log('RentsDetailsBanner - effective villa:', effectiveVilla);
  }, [effectiveVilla]);

  return (
    <div className="relative w-full h-[700px]">
      <div
        className="absolute inset-0  bg-cover bg-center"
        style={{ backgroundImage: `url('${previewImage}')` }}
      >
        <div className="absolute inset-0 bg-black opacity-30" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-start h-full text-white p-4">
        <div className="text-center lg:mt-60 md:mt-56 mt-56">
          <h1 className="text-2xl md:text-4xl font-semibold drop-shadow-lg mb-2 leading-snug">
            {title}
          </h1>
          {/* <h2 className="text-2xl font-light drop-shadow-lg">Masterpiece</h2> */}
          <div className="flex items-center justify-center mt-4 text-xl drop-shadow-lg">
            <svg
              className="w-6 h-6 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 7 12 7s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
            </svg>
            {addressText}
          </div>
        </div>

        <div className="bg-white absolute bottom-0 md:top-[60%] z-20 mt-10 text-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md mx-auto transform translate-y-1/2">
          <div className="flex justify-around items-center text-center border-b pb-4 mb-4 flex-wrap gap-4">
            {/* Guests: only show for rent-type properties */}
            {isRentType && (
              <div className="flex flex-col items-center">
                <img
                  src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760830630/user-fill_gkf8xf.png"
                  alt=""
                />
                <span className="text-sm mt-1">
                  {guestsCount} {pluralize(guestsCount, 'Guest')}
                </span>
              </div>
            )}

            {/* Beds */}
            <div className="flex flex-col items-center">
              <img
                src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760827484/Frame_3_rwdb0z.png"
                alt=""
              />
              <span className="text-sm mt-1">
                {bedsCount} {pluralize(bedsCount, 'Bed')}
              </span>
            </div>

            {/* Baths */}
            <div className="flex flex-col items-center">
              <img
                src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760827484/Frame_4_zsqcrj.png"
                alt=""
              />
              <span className="text-sm mt-1">
                {bathsCount} {pluralize(bathsCount, 'Bath')}
              </span>
            </div>

            {/* Pool */}
            <div className="flex flex-col items-center">
              <img
                src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760827483/Frame_5_cyajjb.png"
                alt=""
              />
              <span className="text-sm mt-1">
                {poolCount} {pluralize(poolCount, 'Pool')}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center mb-4">
            <p className="text-lg font-medium text-green-700">
              {effectiveVilla?.price_display
                ? `From USD$${effectiveVilla.price_display}/night`
                : 'From USD$850,000.00/night'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex-1 bg-teal-600 text-white py-3 rounded"
            >
              Share
            </button>

            {/* Book Now: only visible for rent-type properties */}
            {isRentType ? (
              <button
                onClick={() => {
                  // if not logged in, redirect to login right away
                  const token = getAccessToken();
                  if (!token) {
                    toast.error('Please log in to book.');
                    window.location.assign('/login');
                    return;
                  }
                  setIsModalOpen(true);
                }}
                className="flex-1 bg-teal-600 text-white py-3 rounded"
              >
                Book Now
              </button>
            ) : null}
          </div>

          {feedbackMsg && (
            <div className="mt-3 text-center text-sm text-green-700 font-medium">
              {feedbackMsg}
            </div>
          )}
        </div>
      </div>

      {/* Booking modal stays declared, but it will only be opened via the Book Now button (which is hidden for sale) */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        propertyId={propertyId}
        villaPrice={effectiveVilla?.price}
        onSuccess={() => setFeedbackMsg('Booking created successfully.')}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        propertyId={propertyId}
        propertyTitle={title}
        previewImageUrl={previewImage}
      />
    </div>
  );
};

export default RentsDetailsBanner;
