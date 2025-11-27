// import ImageGallerySections from './ImageGallerySections';

// import RentsDetailsBanner from './RentsDetailsBanner';
// import SpotlightDetails from './SpotlingtDetails';

// const RentsDetails = () => {
//     return (

//         <div>
//             <RentsDetailsBanner />
//             <SpotlightDetails />
//             <ImageGallerySections />

//         </div>
//     );
// };

// export default RentsDetails;

// RentsDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import ImageGallerySections from './ImageGallerySections';
import RentsDetailsBanner from './RentsDetailsBanner';
import SpotlightDetails from './SpotlingtDetails';

const API_BASE =
  import.meta.env.VITE_API_BASE || 'https://api.eastmondvillas.com/api';

// Local fallback image path you uploaded (I'll use this exact path)
const LOCAL_FALLBACK_IMAGE =
  '/mnt/data/28e6a12e-2530-41c9-bdcc-03c9610049e3.png';

const RentsDetails = () => {
  const { id } = useParams(); // expects route /RentsDetails/:id
  const [villa, setVilla] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setError('No property id provided in route.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchProperty = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/villas/properties/${encodeURIComponent(id)}/`,
          {
            method: 'GET',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(text || `HTTP ${res.status}`);
        }

        const data = await res.json();

        // Normalize media array and ensure fallback image exists
        const normalized = {
          ...data,
          media_images: Array.isArray(data.media_images)
            ? data.media_images
            : Array.isArray(data.media)
              ? data.media
              : [],
          main_image_url:
            data.main_image_url ||
            (Array.isArray(data.media_images) &&
              data.media_images[0]?.file_url) ||
            data.main_image_url ||
            null,
        };

        if (!normalized.main_image_url)
          normalized.main_image_url = LOCAL_FALLBACK_IMAGE;

        setVilla(normalized);

        // === THE KEY PART: LOG SINGLE DATA TO CONSOLE ===
        console.log('Property (single):', normalized);
        // also expose it globally for quick inspection in console
        try {
          window.__CURRENT_VILLA__ = normalized;
        } catch (e) {
          /* ignore in restricted envs */
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Failed to fetch property details:', err);
        setError(err.message || 'Failed to fetch property details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gray-500">Loading property details…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div>
      {/* pass single villa object down to children so you can destructure there */}
      <RentsDetailsBanner villa={villa} />
      <SpotlightDetails villa={villa} />
      <ImageGallerySections villa={villa} />
    </div>
  );
};

export default RentsDetails;
