// import React, { FC } from 'react';
// import { Link, Link as RouterLink } from 'react-router-dom';
// import { ChevronLeft, CheckCircle, MoveRight, BackpackIcon } from 'lucide-react';

// // --- TYPE DEFINITIONS ---
// interface Property {
//   title: string;
//   status: string;
//   location: string;
//   image_url: string;
//   main_details: { icon_url: string; value: string }[];
//   description: string;
//   amenities: string[];
//   seo_info: {
//     meta_title: string;
//     meta_description: string;
//     keywords: string[];
//   };
//   viewing_link: string;
// }

// // --- MOCK DATA ---
// const mockData: { property: Property } = {
//   property: {
//     title: "Luxury Waterfront Villa",
//     status: "published",
//     location: "123 Ocean Drive, Miami Beach, FL",
//     image_url:
//       "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760554174/Image_Luxury_Modern_Villa_with_Pool_sdpezo.png",
//     main_details: [
//       { icon_url: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920371/user-fill_1_lnonyj.png", value: "12 Guests" },
//       { icon_url: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920370/Frame_7_trc1r6.png", value: "4 Beds" },
//       { icon_url: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920370/Frame_8_yq0nm0.png", value: "3 Baths" },
//       { icon_url: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920370/Frame_9_y3ta9d.png", value: "2 Pools" },
//       { icon_url: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920561/discount-percent-fill_fc6s5e.png", value: "20% Commission offered to agent" },
//       { icon_url: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920560/exchange-dollar-line_dl1mal.png", value: "US$1,000.00 Damage Deposit" },
//       { icon_url: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920560/shake-hands-fill_i83l66.png", value: "Booking TBC by Owner" },
//       { icon_url: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920559/calendar-fill_husixk.png", value: "100% Calendar accuracy" }
//     ],
//     description: `Welcome to St. James, Barbados, where within the elegant enclave of Derricks lies the majestic Seaclusion Villa. This gorgeous, colonial style, private luxury villa is situated on Barbados’ platinum coast revealing spectacular panoramic sea views and private beach access to the golden sand and clear waters of Barbados’s finest beach.`,
//     amenities: [
//       "Open-Air Dining Spot",
//       "Chill Lounge Area",
//       "Grill Area",
//       "Electric Gates for Easy Access",
//       "Cozy Enclosed Garden",
//       "Fairmont Beach Club Pavilion",
//       "Free Parking on Site",
//       "24/7 Security",
//       "Patio Furniture",
//       "Outdoor Cooking Area",
//       "Private Balconies for Relaxing",
//       "Direct Beach Access"
//     ],
//     seo_info: {
//       meta_title: "Modern Penthouse in Downtown NYC | Luxury Sky Living",
//       meta_description: "Exclusive 3-bedroom penthouse with panoramic city views, rooftop terrace, and premium amenities in the heart of Manhattan.",
//       keywords: ["penthouse nyc", "luxury apartment", "downtown manhattan", "skyline view"]
//     },
//     viewing_link: "https://calendly.com/agent/property-viewing-2"
//   }
// };

// // --- HELPER FUNCTIONS ---
// const showActionMessage = (message: string) => {
//   console.log(message);
//   alert(message);
// };

// const copyToClipboard = (text: string, successMessage: string) => {
//   const el = document.createElement('textarea');
//   el.value = text;
//   document.body.appendChild(el);
//   el.select();
//   document.execCommand('copy');
//   document.body.removeChild(el);
//   showActionMessage(successMessage);
// };

// // --- QUICK ACTION BUTTON ---
// interface QuickActionButtonProps {
//   imgSrc: string;
//   label: string;
//   onClick?: () => void;
// }
// const QuickActionButton: FC<QuickActionButtonProps> = ({ imgSrc, label, onClick }) => (
//   <button
//     onClick={onClick}
//     className="flex items-center space-x-2 px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg shadow-sm hover:bg-gray-100 transition duration-150 border border-gray-200 cursor-pointer"
//   >
//     <img src={imgSrc} alt={label} className="w-5 h-5" />
//     <span>{label}</span>
//   </button>
// );

// const PropertiesRentalsDetails: FC = () => {
//   const { property } = mockData;
//   const [isExpanded, setIsExpanded] = React.useState(false);

//   const getStatusStyle = (status: string) => {
//     switch (status.toLowerCase()) {
//       case "published":
//         return "bg-green-100 text-green-700";
//       case "draft":
//         return "bg-yellow-100 text-yellow-700";
//       default:
//         return "bg-gray-100 text-gray-700";
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 font-sans">
//       <div className="mx-auto p-4 sm:p-6 lg:p-8">
//          <Link to="/dashboard/agent-properties-rentals"
//                                 className="flex items-center text-gray-500 hover:text-gray-800 transition-colors mb-4"
//                                 onClick={() => console.log('Back button clicked')}
//                                 aria-label="Back to Agent List"
//                             >
//                                 <ChevronLeft className="w-5 h-5 mr-1" />
//                                 <span className="text-sm font-medium">Back</span>
//                             </Link>

//         {/* Quick Actions */}
//         <div className="p-4 bg-white rounded-xl shadow-lg mb-8 border border-gray-200">
//           <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
//           <div className="flex flex-wrap gap-3">
//             <QuickActionButton imgSrc="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920016/verified-badge-line_gvbpid.png" label="Amenities" />
//             <QuickActionButton imgSrc="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920016/user-community-line_sxrigx.png" label="Show Staff" />
//             <QuickActionButton imgSrc="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920013/search-eye-line_fbpuvn.png" label="Show Availability" />
//             <QuickActionButton imgSrc="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920066/Icon_33_t3wy08.png" label="Copy Description" onClick={() => copyToClipboard(property.description, 'Property description copied!')} /> 
//             <QuickActionButton imgSrc="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920088/Icon_34_cgp4g7.png" label="Copy Calendar Link" onClick={() => copyToClipboard(property.viewing_link, 'Calendar link copied!')} />
//             <QuickActionButton imgSrc="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920087/Icon_35_dskkg0.png" label="Download Images" />
//           </div>
//         </div>

//         {/* Property Section */}
//         <h2 className="text-xl font-bold text-gray-800 mb-4">Property</h2>
//         <div className="bg-white shadow-xl rounded-xl overflow-hidden p-6 mb-8 border border-gray-200">
//           <div className="flex flex-col lg:flex-row gap-6">
//             <div className="lg:w-1/3 flex-shrink-0">
//               <div className="relative h-64 rounded-lg overflow-hidden">
//                 <img
//                   src={property.image_url}
//                   alt={property.title}
//                   className="w-full h-full object-cover"
//                   onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/800x600/6b7280/ffffff?text=Image+Unavailable"; }}
//                 />
//               </div>
//             </div>
//             <div className="lg:w-2/3">
//               <div className="flex justify-between items-start mb-2">
//                 <h1 className="text-3xl font-extrabold text-gray-900">{property.title}</h1>
//                 <span className={`text-sm font-semibold px-3 py-1 rounded-full ${getStatusStyle(property.status)}`}>
//                   {property.status}
//                 </span>
//               </div>
//               <p className="flex items-center text-lg text-gray-500 font-medium mb-4">
//                  {property.location}
//               </p>
//               <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-gray-700">
//                 {property.main_details.map((item, index) => (
//                   <div key={index} className="flex items-center whitespace-nowrap">
//                     <img src={item.icon_url} className="w-4 h-4 mr-2" alt={item.value} />
//                     <span>{item.value}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Description */}
//         <h2 className="text-xl font-bold text-gray-800 mb-4">Description</h2>
//         <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-200">
//           <div className={`text-gray-700 leading-relaxed transition-all duration-300 ${isExpanded ? 'max-h-full' : 'max-h-[150px] overflow-hidden'}`} style={{ whiteSpace: 'pre-line' }}>
//             {property.description}
//           </div>
//           <button onClick={() => setIsExpanded(!isExpanded)} className="mt-2 text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition">
//             {isExpanded ? 'See less...' : 'See more...'}
//           </button>
//         </div>

//         {/* Amenities */}
//         <h2 className="text-xl font-bold text-gray-800 mb-4">Outdoor Amenities</h2>
//         <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-200">
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
//             {property.amenities.map((amenity, index) => (
//               <div key={index} className="flex items-center text-gray-700 text-base">
//                 <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760921593/Frame_1000004304_lba3o7.png" alt="" />
//                 <span>{amenity}</span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* SEO Info */}
//         <h2 className="text-xl font-bold text-gray-800 mb-4">SEO & Marketing Information</h2>
//         <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-200 space-y-4">
//           <div>
//             <p className="text-gray-500 text-sm font-medium">Meta Title</p>
//             <p className="text-gray-800 font-semibold">{property.seo_info.meta_title}</p>
//           </div>
//           <div>
//             <p className="text-gray-500 text-sm font-medium">Meta Description</p>
//             <p className="text-gray-700">{property.seo_info.meta_description}</p>
//           </div>
//           <div>
//             <p className="text-gray-500 text-sm font-medium mb-2">Keywords</p>
//             <div className="flex flex-wrap gap-2">
//               {property.seo_info.keywords.map((keyword, index) => (
//                 <span key={index} className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full">{keyword}</span>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Viewing Calendar */}
//         <h2 className="text-xl font-bold text-gray-800 mb-4">Viewing Calendar</h2>
//         <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
//           <p className="text-gray-500 text-sm font-medium">Schedule a Viewing</p>
//           <a href={property.viewing_link} target="_blank" rel="noopener noreferrer" className="flex items-center  hover:text-indigo-800 transition break-all cursor-pointer">
//             <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760915210/Icon_31_evyeki.png" alt="Link Icon" className="w-4 h-4 mr-2" /> 
//             {property.viewing_link}
//           </a>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PropertiesRentalsDetails;

import React, { FC, useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface Property {
  title: string;
  status: 'published' | 'draft' | 'pending';
  location: string;
  image_url: string;
  all_image_urls: string[]; // store all media images
  main_details: { icon_url: string; value: string }[];
  description: string;
  amenities: string[];
  seo_info: {
    meta_title: string;
    meta_description: string;
    keywords: string[];
  };
  viewing_link: string;
}

// --- API base (use env var if available) ---
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE?.replace(/\/+$/, "") ||
  "http://localhost:8888/api";

// --- API RESPONSE DATA STRUCTURE (Mapping Reference) ---
interface APIPropertyResponse {
  id: number;
  title: string;
  description: string;
  status: string;
  address: string;
  city: string;
  add_guest: number;
  bedrooms: number;
  bathrooms: number;
  pool: number;
  outdoor_amenities: string[]; // could be object or array depending on backend - adjusted for your mock
  interior_amenities: string[];
  seo_title: string;
  seo_description: string;
  signature_distinctions: string[];
  staff: { name: string; details: string }[];
  calendar_link: string;
  media_images: { id: number; image: string }[];
  price_display?: string | number;
}

// --- HELPER FUNCTIONS ---
const showActionMessage = (message: string) => {
  // keep simple for now — you can replace with a toast
  console.log(message);
  alert(message);
};

const copyToClipboard = async (text: string, successMessage: string) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // fallback
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    showActionMessage(successMessage);
  } catch (err) {
    console.error('Copy failed', err);
    showActionMessage('Failed to copy to clipboard.');
  }
};

// Function to trigger file download (note CORS limitations)
const downloadFile = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- NETWORKED fetchPropertyById ---
// NOTE: it still accepts an optional signal, but we'll call it without a signal to avoid aborts.
const fetchPropertyById = async (id: string, signal?: AbortSignal): Promise<Property> => {
  const url = `${API_BASE}/villas/properties/${encodeURIComponent(id)}/`;

  const res = await fetch(url, { method: 'GET', signal });

  if (!res.ok) {
    // try to parse JSON error if available
    let errText = `Failed to fetch property (status ${res.status})`;
    try {
      const json = await res.json();
      if (json && (json.detail || json.error)) {
        errText = json.detail || json.error;
      }
    } catch {
      // ignore parse error
    }
    throw new Error(errText);
  }

  const data = (await res.json()) as APIPropertyResponse;

  // Map API response to local Property type
  const mainDetails = [
    { icon_url: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920371/user-fill_1_lnonyj.png", value: `${data.add_guest ?? 0} Guests` },
    { icon_url: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920370/Frame_7_trc1r6.png", value: `${data.bedrooms ?? 0} Beds` },
    { icon_url: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920370/Frame_8_yq0nm0.png", value: `${data.bathrooms ?? 0} Baths` },
    ...(Number(data.pool) > 0 ? [{ icon_url: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920370/Frame_9_y3ta9d.png", value: `${data.pool} Pools` }] : []),
    { icon_url: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920560/exchange-dollar-line_dl1mal.png", value: `US$${data.price_display ?? ''} / Night` },
    ...(data.signature_distinctions && data.signature_distinctions.length > 0 ? [{ icon_url: "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920560/shake-hands-fill_i83l66.png", value: `${data.signature_distinctions[0]}...` }] : []),
  ];

  const allImageUrls = Array.isArray(data.media_images) ? data.media_images.map(img => img.image) : [];

  const property: Property = {
    title: data.title,
    status: (String(data.status || 'draft').toLowerCase() as Property['status']),
    location: `${data.address ?? ''}${data.city ? ', ' + data.city : ''}`,
    image_url: allImageUrls[0] || 'https://placehold.co/800x600/6b7280/ffffff?text=Image+Unavailable',
    all_image_urls: allImageUrls,
    main_details: mainDetails,
    description: data.description ?? '',
    amenities: [
      ...(Array.isArray(data.outdoor_amenities) ? data.outdoor_amenities : []),
      ...(Array.isArray(data.interior_amenities) ? data.interior_amenities : [])
    ],
    seo_info: {
      meta_title: data.seo_title ?? '',
      meta_description: data.seo_description ?? '',
      keywords: (Array.isArray(data.signature_distinctions) ? data.signature_distinctions.slice(0, 6) : []).map(k => String(k).toLowerCase().replace(/\s+/g, '-')),
    },
    viewing_link: data.calendar_link ?? '',
  };

  return property;
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
    className="flex items-center space-x-2 px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg shadow-sm hover:bg-gray-100 transition duration-150 border border-gray-200 cursor-pointer"
  >
    <img src={imgSrc} alt={label} className="w-5 h-5" />
    <span>{label}</span>
  </button>
);

const PropertiesRentalsDetails: FC = () => {
  // 1. Get the ID from the URL parameter
  const { id } = useParams<{ id: string }>();

  // 2. State for data fetching
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for Description expansion
  const [isExpanded, setIsExpanded] = useState(false);

  // 3. Effect to fetch data on component mount or ID change (using cancelled flag to avoid AbortError)
  useEffect(() => {
    if (!id) {
      setError("Property ID not found in URL.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadProperty = async () => {
      setLoading(true);
      setError(null);
      try {
        // Call without a signal to avoid AbortController-related AbortError logging in devtools
        const fetchedProperty = await fetchPropertyById(id);
        if (!cancelled) {
          setProperty(fetchedProperty);
        }
      } catch (err: any) {
        // If component unmounted, we simply ignore result
        if (cancelled) return;
        console.error(err);
        setError(err?.message || "Failed to load property details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProperty();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // --- NEW: Download Images Handler ---
  const handleDownloadAllImages = () => {
    if (!property || property.all_image_urls.length === 0) {
      showActionMessage('No images available to download.');
      return;
    }

    let downloadedCount = 0;
    property.all_image_urls.forEach((url, index) => {
      const filename = `${property.title.replace(/\s/g, '_')}_Image_${index + 1}.png`;
      // NOTE: Due to CORS and browser security limitations, direct download of 
      // cross-origin images might fail unless the server provides appropriate headers.
      downloadFile(url, filename);
      downloadedCount++;
    });

    if (downloadedCount > 0) {
      showActionMessage(`Attempting to download ${downloadedCount} images for ${property.title}. Please check your downloads folder.`);
    } else {
      showActionMessage('No images were found for download.');
    }
  };

  // Helper function for status badge style
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "published":
        return "bg-green-100 text-green-700";
      case "draft":
        return "bg-yellow-100 text-yellow-700";
      case "pending":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // 4. Handle Loading and Error states
  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-700 text-lg">Loading property details...</div>;
  }

  if (error || !property) {
    return <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center  text-red-600">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-center">{error || "Could not find property details."}</p>
        <Link to="/dashboard/agent-properties-rentals" className="mt-4 text-indigo-600 hover:text-indigo-800 flex items-center">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Go back to Rentals List
        </Link>
    </div>;
  }

  // Use the fetched property data
  const { title, status, location, image_url, main_details, description, amenities, seo_info, viewing_link } = property;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="mx-auto  sm:p-6 lg:p-8">
        {/* Back Button */}
        <Link to="/dashboard/agent-properties-rentals"
              className="flex items-center w-16 text-gray-500 hover:text-gray-800 transition-colors mb-4"
              onClick={() => console.log('Back button clicked')}
              aria-label="Back to Agent List"
          >
              <ChevronLeft className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">Back</span>
          </Link>

        {/* Quick Actions */}
        <div className="p-4 bg-white rounded-xl shadow-lg mb-8 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <QuickActionButton imgSrc="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920016/verified-badge-line_gvbpid.png" label="Amenities"
                onClick={() => showActionMessage('Amenities feature clicked. This could open a modal or navigate to a dedicated section.')}
            />
            <QuickActionButton imgSrc="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920016/user-community-line_sxrigx.png" label="Show Staff"
                onClick={() => showActionMessage('Show Staff feature clicked. This could display the list of staff members.')}
            />
            <QuickActionButton imgSrc="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920013/search-eye-line_fbpuvn.png" label="Show Availability"
                onClick={() => showActionMessage('Show Availability feature clicked. This could open the availability calendar modal.')}
            />
            <QuickActionButton imgSrc="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920066/Icon_33_t3wy08.png" label="Copy Description" onClick={() => copyToClipboard(description, 'Property description copied!')} />
            <QuickActionButton imgSrc="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920088/Icon_34_cgp4g7.png" label="Copy Calendar Link" onClick={() => copyToClipboard(viewing_link, 'Calendar link copied!')} />
            <QuickActionButton
                imgSrc="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760920087/Icon_35_dskkg0.png"
                label="Download Images"
                onClick={handleDownloadAllImages}
            />
          </div>
        </div>

        {/* Property Section */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">Property</h2>
        <div className="bg-white shadow-xl rounded-xl overflow-hidden p-6 mb-8 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/3 flex-shrink-0">
              <div className="relative h-64 rounded-lg overflow-hidden">
                <img
                  src={image_url}
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/800x600/6b7280/ffffff?text=Image+Unavailable"; }}
                />
              </div>
            </div>
            <div className="lg:w-2/3">
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-3xl font-extrabold text-gray-900">{title}</h1>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${getStatusStyle(status)}`}>
                  {status}
                </span>
              </div>
              <p className="flex items-center text-lg text-gray-500 font-medium mb-4">
                  {location}
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-gray-700">
                {main_details.map((item, index) => (
                  <div key={index} className="flex items-center whitespace-nowrap">
                    <img src={item.icon_url} className="w-4 h-4 mr-2" alt={item.value} />
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">Description</h2>
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-200">
          <div className={`text-gray-700 leading-relaxed transition-all duration-300 ${isExpanded ? 'max-h-full' : 'max-h-[150px] overflow-hidden'}`} style={{ whiteSpace: 'pre-line' }}>
            {description}
          </div>
          <button onClick={() => setIsExpanded(!isExpanded)} className="mt-2 text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition">
            {isExpanded ? 'See less...' : 'See more...'}
          </button>
        </div>

        {/* Amenities */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">Outdoor Amenities</h2>
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
            {amenities.map((amenity, index) => (
              <div key={index} className="flex items-center text-gray-700 text-base">
                <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760921593/Frame_1000004304_lba3o7.png" alt="" />
                <span>{amenity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SEO Info */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">SEO & Marketing Information</h2>
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-200 space-y-4">
          <div>
            <p className="text-gray-500 text-sm font-medium">Meta Title</p>
            <p className="text-gray-800 font-semibold">{seo_info.meta_title}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm font medium">Meta Description</p>
            <p className="text-gray-700">{seo_info.meta_description}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium mb-2">Keywords</p>
            <div className="flex flex-wrap gap-2">
              {seo_info.keywords.map((keyword, index) => (
                <span key={index} className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full">{keyword}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Viewing Calendar */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">Viewing Calendar</h2>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <p className="text-gray-500 text-sm font-medium">Schedule a Viewing</p>
          <a href={viewing_link} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-indigo-800 transition break-all cursor-pointer">
            <img src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760915210/Icon_31_evyeki.png" alt="Link Icon" className="w-4 h-4 mr-2" />
            {viewing_link}
          </a>
        </div>
      </div>
    </div>
  );
};

export default PropertiesRentalsDetails;
