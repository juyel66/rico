// import React, { useState, useEffect } from "react";
// import jsPDF from "jspdf";
// import VideoExperience from "./VideoExperience";
// import Description from "./Descriptions";
// import Locations from "./Locations";
// import Calendar from "./Calendar";
// import AddReviewForm from "./AddReviewForm";
// import BedRoomsSliders from "./BedRoomsSliders";
// import RatesBookingInformation from "./RatesBookingInformation";
// import { PropertyData } from "@/FakeJson";

// interface SimpleListItemProps {
//   name: string;
// }

// import type { PropertyDataType } from "../../../types/property.types";

// const AmenityItem: React.FC<SimpleListItemProps> = ({ name }) => (
//   <li className="flex items-start text-gray-700 text-sm mb-2">
//     <img
//       src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760828543/hd_svg_logo_2_hw4vsa.png"
//       alt="icon"
//       className="w-4 h-4 mr-2 mt-0.5"
//     />
//     {name}
//   </li>
// );

// const StaffItem: React.FC<{ name: string; details: string }> = ({
//   name,
//   details,
// }) => (
//   <li className="flex items-start mb-4">
//     <img
//       src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760828543/hd_svg_logo_2_hw4vsa.png"
//       alt="icon"
//       className="w-4 h-4 mr-2 mt-0.5"
//     />
//     <div className="flex flex-col text-gray-700 text-sm">
//       <span className="font-semibold text-gray-800">{name}</span>
//       <span className="text-xs text-gray-600">{details}</span>
//     </div>
//   </li>
// );

// console.log("Property Data:", PropertyData);

// const mockData: PropertyDataType = PropertyData;

// const ImageGallerySection: React.FC = () => {
//   const [data, setData] = useState<PropertyDataType | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [showAll, setShowAll] = useState(false);
//   const [selectedImage, setSelectedImage] = useState<string | null>(null);

//   useEffect(() => {
//     setTimeout(() => {
//       setData(mockData);
//       setIsLoading(false);
//     }, 1000);
//   }, []);

//   if (isLoading) {
//     return (
//       <section className="container mx-auto px-4 py-16 text-center">
//         <div className="text-xl font-semibold text-teal-600">
//           Loading property details...
//         </div>
//       </section>
//     );
//   }

//   if (!data) {
//     return (
//       <section className="container mx-auto px-4 py-16 text-center">
//         <div className="text-xl font-semibold text-red-500">
//           Error loading data. Please try again.
//         </div>
//       </section>
//     );
//   }

//   const {
//     media_images,
//     amenities,
//     location,
//     rules_and_etiquette,
//     check_in_out_time,
//     staff,
//     concierge_service,
//     security_deposit,
//     description,
//     description_image_url,
//     booking_rate_start,
//     bedrooms_images,
//   } = data;

//   const { signature_distinctions, interior_amenities, outdoor_amenities } =
//     amenities;

//   const handleDownloadPDF = async () => {
//     try {
//       const pdf = new jsPDF("p", "mm", "a4");
//       const imgWidth = 90;
//       const imgHeight = 65;
//       const marginX = 10;
//       const marginY = 25;
//       let x = marginX;
//       let y = marginY;

//       pdf.setFontSize(22);
//       pdf.setTextColor(30, 30, 60);
//       pdf.text("Gallery Images", 105, 15, { align: "center" });
//       pdf.setLineWidth(0.5);
//       pdf.setDrawColor(100, 100, 255);
//       pdf.line(10, 18, 200, 18);

//       const imagesToUse = media_images.slice(0, 6);

//       for (let i = 0; i < imagesToUse.length; i++) {
//         const img = imagesToUse[i];
//         const image = new Image();
//         image.crossOrigin = "anonymous";
//         image.src = img.url;
//         await new Promise<void>((resolve, reject) => {
//           image.onload = () => resolve();
//           image.onerror = () => reject();
//         });

//         const canvas = document.createElement("canvas");
//         const ctx = canvas.getContext("2d");
//         canvas.width = image.width;
//         canvas.height = image.height;
//         ctx?.drawImage(image, 0, 0);
//         const imgData = canvas.toDataURL("image/jpeg", 1.0);

//         pdf.setDrawColor(50, 50, 150);
//         pdf.setLineWidth(1.2);
//         pdf.roundedRect(x - 2, y - 2, imgWidth + 4, imgHeight + 4, 5, 5, "S");
//         pdf.setFillColor(245, 245, 255);
//         pdf.rect(x - 1.5, y - 1.5, imgWidth + 3, imgHeight + 3, "F");

//         pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight);

//         if (i % 2 === 0) {
//           x += imgWidth + 10;
//         } else {
//           x = marginX;
//           y += imgHeight + 15;
//         }

//         if (y + imgHeight > 270) break;
//       }

//       pdf.save("EV_Brochure.pdf");
//     } catch (error) {
//       console.error("PDF Generation Error:", error);
//     }
//   };

//   return (
//     <section className="container mx-auto mb-[920px] px-4 py-16 relative">
//       <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
//         {/* Left section */}
//         <div className="lg:col-span-7">
//           <h2 className="text-3xl font-bold text-gray-900 mb-8">
//             Image Gallery - {media_images.length} photos
//           </h2>

//           <div className="grid grid-cols-3 gap-4">
//             {(showAll ? media_images : media_images.slice(0, 6)).map((img) => (
//               <div
//                 key={img.id}
//                 className="aspect-4/3 bg-gray-200 rounded-lg overflow-hidden shadow-sm cursor-pointer transition-transform hover:scale-105"
//                 onClick={() => setSelectedImage(img.url)}
//               >
//                 <img
//                   src={img.url}
//                   alt={`Gallery photo ${img.id}`}
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//             ))}
//           </div>

//           <div className="mt-8 text-center">
//             {!showAll ? (
//               <button
//                 onClick={() => setShowAll(true)}
//                 className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 shadow-lg"
//               >
//                 View All Photos
//               </button>
//             ) : (
//               <button
//                 onClick={() => setShowAll(false)}
//                 className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 shadow-lg"
//               >
//                 Show Less
//               </button>
//             )}

//             <VideoExperience />
//             <Description
//               descriptionData={description}
//               descriptionImage={description_image_url}
//             />
//           </div>
//         </div>

//         {/* Right section */}
//         <div className="lg:col-span-5 border-l lg:pl-12 pl-0">
//           {/* Signature Distinctions */}
//           <div className="mb-10">
//             <h3 className="text-2xl font-bold text-gray-900 mb-4">
//               Signature Distinctions
//             </h3>
//             <ul className="list-none p-0">
//               {signature_distinctions.map((item, index) => (
//                 <AmenityItem key={index} name={item} />
//               ))}
//             </ul>
//           </div>

//           {/* Interior & Outdoor Amenities */}
//           <div>
//             <h3 className="text-2xl font-bold text-gray-900 mb-4">
//               Finer Details
//             </h3>
//             <h4 className="font-semibold text-lg text-gray-800 mb-2">
//               Interior Amenities
//             </h4>
//             <ul className="grid grid-cols-2 gap-x-6">
//               {interior_amenities.map((item, index) => (
//                 <AmenityItem key={index} name={item} />
//               ))}
//             </ul>

//             <h4 className="font-semibold text-lg text-gray-800 mt-6 mb-2">
//               Outdoor Amenities
//             </h4>
//             <ul className="list-none p-0 mb-10">
//               {outdoor_amenities.map((item, index) => (
//                 <AmenityItem key={index} name={item} />
//               ))}
//             </ul>
//           </div>

//           {/* Rules & Etiquette */}
//           <div className="mb-10 pt-4 border-t border-gray-200">
//             <h3 className="text-2xl font-bold text-gray-900 mb-4">
//               Rules & Etiquette
//             </h3>
//             <ul className="list-none p-0">
//               {rules_and_etiquette.map((item: string, index: number) => (
//                 <AmenityItem key={index} name={item} />
//               ))}
//             </ul>
//           </div>

//           {/* Check In/Out */}
//           <div className="mb-10 pt-4 border-t border-gray-200">
//             <h3 className="text-2xl font-bold text-gray-900 mb-4">
//               Check in/out time
//             </h3>
//             <div className="flex flex-col space-y-2 text-gray-700 text-sm">
//               <div>Check-In: {check_in_out_time.check_in}</div>
//               <div>Check-Out: {check_in_out_time.check_out}</div>
//               <div>{check_in_out_time.description}</div>
//             </div>
//           </div>

//           {/* Staff */}
//           <div className="mb-10 pt-4 border-t border-gray-200">
//             <h3 className="text-2xl font-bold text-gray-900 mb-4 flex justify-between items-end">
//               Staff
//               <button className="text-teal-600 text-sm font-semibold hover:text-teal-700 transition duration-150">
//                 View All Staff
//               </button>
//             </h3>
//             <ul className="list-none p-0">
//               {staff.map(
//                 (item: { name: string; details: string }, index: number) => (
//                   <StaffItem
//                     key={index}
//                     name={item.name}
//                     details={item.details}
//                   />
//                 )
//               )}
//             </ul>
//           </div>

//           {/* Bedrooms */}
//           <BedRoomsSliders bedrooms_images={bedrooms_images} />

//           {/* Concierge */}
//           <div className="mb-10 pt-4 border-t border-gray-200">
//             <h3 className="text-2xl font-bold text-gray-900 mb-4">
//               Concierge Service
//             </h3>
//             <ul className="list-none p-0">
//               {concierge_service.map((item: string, index: number) => (
//                 <AmenityItem key={index} name={item} />
//               ))}
//             </ul>
//           </div>

//           {/* Security Deposit */}
//           <div className="mb-10 pt-4 border-t border-gray-200">
//             <h3 className="text-2xl font-bold text-gray-900 mb-4">
//               Security Deposit
//             </h3>
//             <p className="text-3xl font-bold text-gray-900">
//               {security_deposit}
//             </p>
//           </div>

//           {/* Download Button */}
//           <div className="mt-8">
//             <button
//               onClick={handleDownloadPDF}
//               className="w-full bg-teal-600 cursor-pointer hover:bg-teal-700 text-white font-semibold py-4 px-8 rounded-lg transition duration-200 shadow-lg text-lg"
//             >
//               Download EV Brochure
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Rates Section */}
//       <RatesBookingInformation booking_rate_start={booking_rate_start} />

//       {/* Calendar */}
//       <Calendar />

//       {/* Location Map */}
//       <Locations
//         lat={location.lat}
//         lng={location.lng}
//         text={location.address}
//       />

//       {/* Reviews */}
//       <AddReviewForm />

//       {/* Image Modal */}
//       {selectedImage && (
//         <div
//           className="fixed inset-0 bg-opacity-80 flex justify-center items-center z-9999"
//           style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
//           onClick={() => setSelectedImage(null)}
//         >
//           <div className="relative" onClick={(e) => e.stopPropagation()}>
//             <button
//               onClick={() => setSelectedImage(null)}
//               className="absolute top-4 right-4 text-white text-3xl font-bold z-10"
//             >
//               &times;
//             </button>
//             <img
//               src={selectedImage}
//               alt="Expanded"
//               className="w-full h-[80vh] object-contain rounded-xl shadow-2xl"
//             />
//           </div>
//         </div>
//       )}
//     </section>
//   );
// };

// export default ImageGallerySection;






import React, { useState } from "react";
import jsPDF from "jspdf";

import VideoExperience from "./VideoExperience";
import Description from "./Descriptions";
import Locations from "./Locations";
import Calendar from "./Calendar";
import AddReviewForm from "./AddReviewForm";
import BedRoomsSliders from "./BedRoomsSliders";
import RatesBookingInformation from "./RatesBookingInformation";

const LOCAL_FALLBACK = "/mnt/data/28e6a12e-2530-41c9-bdcc-03c9610049e3.png";

// --------- Sub-item Components ----------
const AmenityItem = ({ name }) => (
  <li className="flex items-start text-gray-700 text-sm mb-2">
    <img
      src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760828543/hd_svg_logo_2_hw4vsa.png"
      alt="icon"
      className="w-4 h-4 mr-2 mt-0.5"
    />
    {name}
  </li>
);

const StaffItem = ({ name, details }) => (
  <li className="flex items-start mb-4">
    <img
      src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760828543/hd_svg_logo_2_hw4vsa.png"
      alt="icon"
      className="w-4 h-4 mr-2 mt-0.5"
    />
    <div className="flex flex-col text-gray-700 text-sm">
      <span className="font-semibold text-gray-800">{name}</span>
      <span className="text-xs text-gray-600">{details}</span>
    </div>
  </li>
);

// Simple helper to load images with crossOrigin and fallback
const loadImageWithFallback = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      // try fallback
      const f = new Image();
      f.crossOrigin = "Anonymous";
      f.onload = () => resolve(f);
      f.onerror = () => resolve(null);
      f.src = LOCAL_FALLBACK;
    };
    img.src = src || LOCAL_FALLBACK;
  });

// --------- MAIN COMPONENT ----------
const ImageGallerySection = ({ villa }) => {
  if (!villa)
    return (
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="text-xl font-semibold text-teal-600">Loading…</div>
      </section>
    );

  console.log("🔎 Single Villa Data (Image Gallery Component):", villa);

  // -------- Extract Data Safely ----------
  const media_images =
    villa.media_images?.map((img) => ({
      id: img.id,
      url: img.image || img.file_url || LOCAL_FALLBACK,
    })) || [];

  const bedrooms_images =
    villa.bedrooms_images?.map((img) => ({
      id: img.id,
      url: img.image || img.file_url || LOCAL_FALLBACK,
    })) || [];

  const signature_distinctions =
    Array.isArray(villa.signature_distinctions)
      ? villa.signature_distinctions
      : [];

  const interior_amenities =
    Array.isArray(villa.interior_amenities)
      ? villa.interior_amenities
      : [];

  const outdoor_amenities =
    Array.isArray(villa.outdoor_amenities)
      ? villa.outdoor_amenities
      : [];

  const rules_and_etiquette =
    Array.isArray(villa.rules_and_etiquette) ? villa.rules_and_etiquette : [];

  // Accept both nested check_in_out_time or root-level check_in / check_out
  const check_in_out_time = villa.check_in_out_time || {
    check_in: villa.check_in || "",
    check_out: villa.check_out || "",
    description: villa.check_in_out_time?.description || "",
  };

  const staffArray = Array.isArray(villa.staff)
    ? villa.staff
    : villa.staff?.name
    ? [{ name: villa.staff.name, details: villa.staff.details || "" }]
    : [];

  const concierge_service =
    Array.isArray(villa.concierge_service) ? villa.concierge_service : [];

  const security_deposit = villa.security_deposit || "";

  const description = villa.description || "";
  const description_image_url = villa.description_image_url || LOCAL_FALLBACK;

  const booking_rate_start = villa.booking_rate_start || [];

  // ===== UPDATED: Build location object robustly (use top-level latitude/longitude,
  // or location_coords object if present; if both missing, leave null so Locations can fallback)
  const location = {
    lat:
      typeof villa.latitude === "number"
        ? villa.latitude
        : villa.location_coords?.lat ?? null,
    lng:
      typeof villa.longitude === "number"
        ? villa.longitude
        : villa.location_coords?.lng ?? null,
    address: villa.address || villa.city || "",
  };

  // Villa name (title or name)
  const villaName = villa.title || villa.name || "";

  // Determine listing type (forgiving)
  const listingType = String(villa.listing_type ?? "").toLowerCase();
  const isRentType =
    listingType === "rent" ||
    listingType === "rental" ||
    listingType === "rentals" ||
    listingType === "let";
  const isSaleType = listingType === "sale" || listingType === "sales";

  // Debug logs so you can confirm in console
  console.log("→ Location values extracted for Locations component:", {
    lat: location.lat,
    lng: location.lng,
    address: location.address,
    villaName,
    fullApiResponse: villa,
    listingType,
  });

  const [showAll, setShowAll] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // -------- PDF Export (UPDATED to 3x3 per page with design)
  const handleDownloadPDF = async () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4"); // portrait A4
      const pageWidth = pdf.internal.pageSize.getWidth(); // 210
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297
      const margin = 12; // mm
      const gap = 6; // mm between images
      const cols = 3;
      const rows = 3;
      const perPage = cols * rows;

      // Compute image size: available width = pageWidth - 2*margin - (cols-1)*gap
      const availableWidth = pageWidth - margin * 2 - gap * (cols - 1);
      const imgW = Number((availableWidth / cols).toFixed(2));
      const imgH = imgW; // square presentation for consistency

      // Header Y start
      const headerY = 18;
      const yStart = headerY + 10; // after header
      const captionHeight = 6;

      // Build list of image URLs (fall back to placeholder)
      const imgUrls = media_images.map((m) => m.url || LOCAL_FALLBACK);

      if (imgUrls.length === 0) {
        // If there are no media images, include a single fallback image
        imgUrls.push(LOCAL_FALLBACK);
      }

      // helper to draw header on the current page
      const drawHeader = (pageIndex, totalPages) => {
        pdf.setFontSize(18);
        pdf.setTextColor(20, 40, 40);
        const title = villaName || "Property Gallery";
        pdf.text(title, pageWidth / 2, headerY, { align: "center" });
        if (villa.price) {
          pdf.setFontSize(11);
          const priceText = typeof villa.price === "number" ? `Price: US$ ${villa.price.toLocaleString()}` : `Price: ${villa.price}`;
          pdf.text(priceText, pageWidth / 2, headerY + 6, { align: "center" });
        }
        // small divider
        pdf.setDrawColor(200);
        pdf.setLineWidth(0.4);
        pdf.line(margin, headerY + 8, pageWidth - margin, headerY + 8);
      };

      // preload all images (but to avoid memory hog, load per page chunk)
      const totalPages = Math.ceil(imgUrls.length / perPage);

      let imgIndex = 0;
      for (let p = 0; p < totalPages; p++) {
        // draw header
        drawHeader(p + 1, totalPages);

        // for each cell in the page (3x3)
        for (let i = 0; i < perPage; i++) {
          const currentIndex = p * perPage + i;
          if (currentIndex >= imgUrls.length) break;

          const col = i % cols;
          const row = Math.floor(i / cols);

          const x = margin + col * (imgW + gap);
          const y = yStart + row * (imgH + gap);

          // load image (with fallback)
          const imgEl = await loadImageWithFallback(imgUrls[currentIndex]);
          if (!imgEl) {
            // if nothing loaded, skip drawing this image
            continue;
          }

          // draw into canvas to get a data URL
          const canvas = document.createElement("canvas");
          const cw = imgEl.naturalWidth || imgEl.width || 800;
          const ch = imgEl.naturalHeight || imgEl.height || 600;

          // To preserve aspect and fill box without distortion, compute scale
          // We'll fit inside imgW x imgH while preserving aspect ratio
          // Canvas size should be image's native dims to preserve quality
          canvas.width = cw;
          canvas.height = ch;
          const ctx = canvas.getContext("2d");
          // draw the image centered and cover the canvas area proportionally
          // We'll draw full image to canvas, then let jsPDF scale to imgW/imgH
          ctx.drawImage(imgEl, 0, 0, cw, ch);

          // convert to JPEG
          let imgData;
          try {
            imgData = canvas.toDataURL("image/jpeg", 0.9);
          } catch (err) {
            // canvas may be tainted; try fallback URL directly
            imgData = LOCAL_FALLBACK;
          }

          // Add the image (jsPDF positions and scales in mm)
          pdf.addImage(imgData, "JPEG", x, y, imgW, imgH);

          // caption: small index label centered under the image
          pdf.setFontSize(9);
          pdf.setTextColor(90);
          const captionText = `Image ${currentIndex + 1}`;
          const captionX = x + imgW / 2;
          const captionY = y + imgH + 4;
          pdf.text(captionText, captionX, captionY, { align: "center" });
        }

        // page number footer
        pdf.setFontSize(9);
        pdf.setTextColor(120);
        const footerText = `Page ${p + 1} of ${totalPages}`;
        pdf.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" });

        if (p < totalPages - 1) pdf.addPage();
      }

      // finalize
      pdf.save(`${(villaName || "EV_Brochure").replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("PDF error:", err);
      // also attempt a simple fallback: create PDF with only the first image if something went wrong
      try {
        const fallbackPdf = new jsPDF("p", "mm", "a4");
        fallbackPdf.setFontSize(18);
        fallbackPdf.text("Gallery Export Failed - See console", 20, 30);
        fallbackPdf.save("EV_Brochure_Fallback.pdf");
      } catch (e) {
        console.error("Fallback PDF also failed:", e);
      }
    }
  };

  const villaId = villa.id;

  // -------- UI Rendering --------
  return (
    <section className="container mx-auto mb-[920px] px-4 py-16 relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* LEFT */}
        <div className="lg:col-span-7">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Image Gallery - {media_images.length} photos
          </h2>

          <div className="grid grid-cols-3 gap-4">
            {(showAll ? media_images : media_images.slice(0, 6)).map((img) => (
              <div
                key={img.id}
                className="aspect-4/3 bg-gray-200 rounded-lg overflow-hidden shadow-sm cursor-pointer transition-transform hover:scale-105"
                onClick={() => setSelectedImage(img.url)}
              >
                <img src={img.url} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            {!showAll ? (
              <button
                onClick={() => setShowAll(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-8 rounded-lg transition shadow-lg"
              >
                View All Photos
              </button>
            ) : (
              <button
                onClick={() => setShowAll(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg transition shadow-lg"
              >
                Show Less
              </button>
            )}

            <VideoExperience />

            <Description
              descriptionData={description}
              descriptionImage={
                media_images?.[1]?.url ||
                description_image_url ||
                LOCAL_FALLBACK
              }
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-5 border-l lg:pl-12 pl-0">
          <h3 className="text-2xl font-bold mb-4">Signature Distinctions</h3>
          <ul>
            {signature_distinctions.map((item, i) => (
              <AmenityItem key={i} name={item} />
            ))}
          </ul>

          <h3 className="text-2xl font-bold mt-10 mb-4">Finer Details</h3>

          <h4 className="font-semibold text-lg mb-2">Interior Amenities</h4>
          <ul className="grid grid-cols-2 gap-x-6">
            {interior_amenities.map((item, i) => (
              <AmenityItem key={i} name={item} />
            ))}
          </ul>

          <h4 className="font-semibold text-lg mt-6 mb-2">Outdoor Amenities</h4>
          <ul>
            {outdoor_amenities.map((item, i) => (
              <AmenityItem key={i} name={item} />
            ))}
          </ul>

          {/* Rules & Check-in/out & Staff: render only for rent-type */}
          {isRentType && (
            <>
              <h3 className="text-2xl font-bold mt-10 mb-4">Rules & Etiquette</h3>
              <ul>
                {rules_and_etiquette.map((item, i) => (
                  <AmenityItem key={i} name={item} />
                ))}
              </ul>

              <h3 className="text-2xl font-bold mt-10 mb-4">Check-in/out</h3>
              {check_in_out_time.check_in ? (
                <p>Check-In: {check_in_out_time.check_in}</p>
              ) : (
                <p>Check-In: —</p>
              )}
              {check_in_out_time.check_out ? (
                <p>Check-Out: {check_in_out_time.check_out}</p>
              ) : (
                <p>Check-Out: —</p>
              )}
              {check_in_out_time.description ? (
                <p>{check_in_out_time.description}</p>
              ) : null}

              <h3 className="text-2xl font-bold mt-10 mb-4">Staff</h3>
              <ul>
                {staffArray.map((s, i) => (
                  <StaffItem key={i} name={s.name} details={s.details} />
                ))}
              </ul>
            </>
          )}

          {/* Bedrooms slider ALWAYS shown */}
          <div className="mt-8">
            <BedRoomsSliders bedrooms_images={bedrooms_images} />
          </div>

          {isRentType && (
            <>
              <h3 className="text-2xl font-bold mt-10 mb-4">Concierge Service</h3>

              {/* Existing concierge items (if any) */}
              <ul>
                {concierge_service.map((item, i) => (
                  <AmenityItem key={i} name={item} />
                ))}

                {/* --- STATIC LINES REQUESTED --- */}
                <li className="flex items-start text-gray-700 text-sm mb-2 mt-4">
                  <img
                    src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760828543/hd_svg_logo_2_hw4vsa.png"
                    alt="icon"
                    className="w-4 h-4 mr-2 mt-0.5"
                  />
                  <span>
                    Our concierge team offers a bunch of luxury services, making sure
                    you enjoy every moment.
                  </span>
                </li>

                <li className="flex items-start text-gray-700 text-sm mb-2">
                  <img
                    src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760828543/hd_svg_logo_2_hw4vsa.png"
                    alt="icon"
                    className="w-4 h-4 mr-2 mt-0.5"
                  />
                  <span>
                    We handle your Arrival, Transfers, Car Rentals, and Chauffeur
                    Services.
                  </span>
                </li>

                <li className="flex items-start text-gray-700 text-sm mb-2">
                  <img
                    src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760828543/hd_svg_logo_2_hw4vsa.png"
                    alt="icon"
                    className="w-4 h-4 mr-2 mt-0.5"
                  />
                  <span>
                    We can stock your villa, help with menus, provide household
                    support, and spa services.
                  </span>
                </li>
              </ul>
            </>
          )}

          <h3 className="text-2xl font-bold mt-10 mb-4">Security Deposit</h3>

          <p className="text-3xl font-bold">{security_deposit || "US$ 10,000.00"}</p>

          <button
            onClick={handleDownloadPDF}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 px-8 rounded-lg text-lg mt-8"
          >
            Download EV Brochure
          </button>
        </div>
      </div>

      {/* Rates & Calendar: only show for rent-type */}
      {isRentType && (
        <>
          <RatesBookingInformation booking_rate_start={booking_rate_start} price={villa.price} />
          <div className="">
            <Calendar villaId={villaId} />
          </div>
        </>
      )}

      <div className="mt-15 mb-20">
        <Locations
          lat={location.lat}
          lng={location.lng}
          text={location.address}
          locationObj={location}
          villaName={villaName}
        />
      </div>

      <AddReviewForm />

      {selectedImage && (
        <div
          className="fixed inset-0 bg-opacity-80 flex justify-center items-center z-9999"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            className="w-full h-[80vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </section>
  );
};

export default ImageGallerySection;
