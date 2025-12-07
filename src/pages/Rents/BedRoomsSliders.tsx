// BedRoomsSliders.tsx
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import React, { useState } from "react";

interface BedroomImageIncoming {
  image_url?: string;
  image?: string;
  file_url?: string;
  url?: string;
  id?: number | string;
  name?: string;
  description?: string;
  [key: string]: any;
}

interface BedRoomsSlidersProps {
  bedrooms_images?: BedroomImageIncoming[] | null;
}

const FALLBACK_IMAGE = "/mnt/data/28e6a12e-2530-41c9-bdcc-03c9610049e3.png";

// Keep URL normalization
const normalizeImageUrl = (img: BedroomImageIncoming) => {
  if (!img) return FALLBACK_IMAGE;
  return (
    img.image_url ||
    img.image ||
    img.file_url ||
    img.url ||
    (img.media && (img.media.file_url || img.media.url)) ||
    FALLBACK_IMAGE
  );
};

const BedRoomsSliders: React.FC<BedRoomsSlidersProps> = ({ bedrooms_images }) => {
  // DO NOT MODIFY — Only keep raw values + URL
  const images = (Array.isArray(bedrooms_images) ? bedrooms_images : []).map(
    (b, idx) => ({
      id: b.id ?? idx,
      url: normalizeImageUrl(b),
      name: b.name ?? "",
      description: b.description ?? "",
    })
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) return null;

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="mb-10 pt-4 border-top border-gray-200">
      <h3 className="text-2xl font-bold mb-4 flex justify-between items-center">
        Bedrooms
        <div className="flex space-x-2 text-gray-400">
          <button
            onClick={prevSlide}
            className="px-3 py-1 border bg-white rounded-[10px] hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="px-3 py-1 border bg-white rounded-[10px] hover:bg-gray-100 transition-colors"
          >
            <ArrowRightIcon className="w-5 h-5" />
          </button>
        </div>
      </h3>

      {/* SLIDER */}
      <div className="relative w-full overflow-hidden rounded-lg">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((bed, index) => (
            <div key={bed.id} className="min-w-full flex-shrink-0">
              {/* NAME + DESCRIPTION ABOVE IMAGE */}
              <div className="mb-2">
                {bed.name && (
                  <p className="font-semibold text-gray-900 text-sm">{bed.name}</p>
                )}
                {bed.description && (
                  <p className="text-gray-600 text-xs">{bed.description}</p>
                )}
              </div>

              <button
                onClick={() => {
                  setCurrentIndex(index);
                  setLightboxOpen(true);
                }}
                className="w-full block"
              >
                <img
                  src={bed.url}
                  alt={bed.name || `Bedroom ${index + 1}`}
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* DOTS */}
      <div className="flex justify-center mt-4 space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-3 w-3 rounded-full transition-colors ${
              index === currentIndex ? "bg-teal-600" : "bg-gray-300"
            }`}
          />
        ))}
      </div>

      {/* LIGHTBOX */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center px-4 py-6"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-3 right-3 text-white text-3xl font-bold z-20"
            >
              &times;
            </button>

            {/* SHOW TITLE + DESC IN LIGHTBOX TOO */}
            <div className="text-center text-white mb-3">
              {images[currentIndex].name && (
                <p className="font-semibold text-lg">{images[currentIndex].name}</p>
              )}
              {images[currentIndex].description && (
                <p className="text-sm opacity-90">{images[currentIndex].description}</p>
              )}
            </div>

            <div className="relative">
              <img
                src={images[currentIndex].url}
                alt={images[currentIndex].name || "Bedroom"}
                className="w-full max-h-[80vh] object-contain rounded-lg shadow-2xl bg-black"
              />

              {/* ARROWS */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 text-white p-2 rounded-full hover:bg-white/30"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 text-white p-2 rounded-full hover:bg-white/30"
                  >
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BedRoomsSliders;
