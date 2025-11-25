// Locations.tsx (view-only, markers show villa name on hover with small popup)
import React, { useState, useMemo, useRef, useEffect } from "react";
import GoogleMapReact from "google-map-react";
import { PiMapPinBold } from "react-icons/pi";
import { Map, MapPin } from "lucide-react";

const googleMapAPIKey = "AIzaSyDRNtz8qa3VSLN9EvMO42rJQaioyFPslDk";

// Local thumbnail (you uploaded this file; using the local path as requested)
const LOCAL_THUMBNAIL = "/mnt/data/3c732c81-93ba-460a-bc0c-4418a9864cd0.png";

interface Coords {
  lat: number;
  lng: number;
}

interface SavedLocation extends Coords {
  key: string;
  text: string; // villa name or address shown on hover
  details?: string; // extra details shown in popup
  thumb?: string; // thumbnail url
}

interface LocationsProps {
  lat?: number | null;
  lng?: number | null;
  text?: string; // villa name / address to show on hover
  locationObj?: { lat?: number | null; lng?: number | null; address?: string } | null;
  villaName?: string;
  onSearchSelect?: (lat: number, lng: number, address?: string) => void;
  onMapReady?: (map: any, maps: any) => void;
}

/**
 * CustomMarker
 * - shows a small popup above the pin on hover (modal-like)
 * - popup contains thumbnail, label and details (lat/lng)
 * - uses inline mouse events (works inside GoogleMapReact children)
 */
const CustomMarker: React.FC<{
  lat: number;
  lng: number;
  color?: string;
  label?: string | null;
  details?: string | null;
  thumb?: string | null;
}> = ({ color = "red", label, details, thumb }) => {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "absolute",
        transform: "translate(-50%, -100%)",
        zIndex: 900,
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        pointerEvents: "auto",
      }}
      aria-hidden={false}
    >
      {/* Popup shown when hover === true */}
      {hover && (
        <div
          className="mb-2 w-64 p-4 rounded-lg bg-white shadow-md border border-gray-200 text-left"
          style={{ pointerEvents: "none" }} // keep popup passive
        >
          <div className="flex items-start gap-3 h-20">
         <div className="mt-5">  <MapPin /></div>
          
            <div>
              <div className="font-semibold mt-5 text-sm text-gray-800">
                {label || "Location"}
              </div>
              {details && (
                <div className="text-xs text-gray-500 mt-1">{details}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pin */}
      <PiMapPinBold style={{ color, fontSize: "2rem", cursor: "default" }} />
    </div>
  );
};

const Locations: React.FC<LocationsProps> = ({
  lat,
  lng,
  text,
  locationObj,
  villaName,
  onSearchSelect,
  onMapReady,
}) => {
  // prefer locationObj over individual lat/lng props
  const initialLat = locationObj?.lat ?? lat ?? 0;
  const initialLng = locationObj?.lng ?? lng ?? 0;
  const initialText = locationObj?.address ?? text ?? villaName ?? "";

  // savedVillas holds the single villa (or more if you pass them later)
  const [savedVillas, setSavedVillas] = useState<SavedLocation[]>(() => [
    {
      lat: initialLat,
      lng: initialLng,
      key: "default_villa",
      text: initialText,
      details:
        typeof initialLat === "number" && typeof initialLng === "number"
          ? `Lat: ${Number(initialLat).toFixed(6)}, Lng: ${Number(initialLng).toFixed(6)}`
          : "Coordinates not provided",
      thumb: LOCAL_THUMBNAIL,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchMarker, setSearchMarker] = useState<Coords | null>(null);

  const mapRef = useRef<any>(null);
  const mapsRef = useRef<any>(null);

  const defaultProps = useMemo(
    () => ({
      center: { lat: initialLat, lng: initialLng },
      zoom: 13,
    }),
    [initialLat, initialLng]
  );

  // Keep savedVillas reactive to prop changes (e.g., when API data arrives)
  useEffect(() => {
    const updatedLat = locationObj?.lat ?? lat ?? null;
    const updatedLng = locationObj?.lng ?? lng ?? null;
    const updatedText = locationObj?.address ?? text ?? villaName ?? "";

    // console log for debugging
    console.log("Locations component received:", {
      lat: updatedLat,
      lng: updatedLng,
      text: updatedText,
      locationObj,
      villaName,
    });

    if (typeof updatedLat === "number" && typeof updatedLng === "number") {
      setSavedVillas([
        {
          lat: updatedLat,
          lng: updatedLng,
          key: "default_villa",
          text: updatedText,
          details: `Lat: ${Number(updatedLat).toFixed(6)}, Lng: ${Number(
            updatedLng
          ).toFixed(6)}`,
          thumb: LOCAL_THUMBNAIL,
        },
      ]);

      if (mapRef.current && typeof mapRef.current.panTo === "function") {
        try {
          mapRef.current.panTo({ lat: updatedLat, lng: updatedLng });
        } catch (e) {
          // ignore pan errors if map not ready
        }
      }
    } else {
      // When coordinates are missing, keep fallback marker with text
      setSavedVillas([
        {
          lat: initialLat,
          lng: initialLng,
          key: "default_villa",
          text: updatedText,
          details:
            initialLat && initialLng
              ? `Lat: ${Number(initialLat).toFixed(6)}, Lng: ${Number(initialLng).toFixed(6)}`
              : "Coordinates not provided",
          thumb: LOCAL_THUMBNAIL,
        },
      ]);
    }
  }, [lat, lng, text, locationObj, villaName, initialLat, initialLng]);

  // Search: use Google geocoder to show a temporary search marker and pan map
  const handleSearch = () => {
    if (!searchQuery.trim() || !mapsRef.current) return;
    const geocoder = new mapsRef.current.Geocoder();
    geocoder.geocode({ address: searchQuery }, (results: any, status: any) => {
      if (status === "OK" && results && results[0]) {
        const location = results[0].geometry.location;
        const newLat = location.lat();
        const newLng = location.lng();
        const address = results[0].formatted_address || searchQuery;
        setSearchMarker({ lat: newLat, lng: newLng });
        if (mapRef.current && typeof mapRef.current.panTo === "function") {
          mapRef.current.panTo({ lat: newLat, lng: newLng });
        }
        if (onSearchSelect) onSearchSelect(newLat, newLng, address);
      } else {
        alert("Location not found!");
      }
    });
  };

  return (
    <div>
      {/* Top static location header */}
       <div className="text-center mb-10">
        <p className="text-5xl font-semibold text-gray-800">Location</p>
        <p className="text-lg mt-4 text-gray-600">
          {text} — Click on the map or search any place worldwide
        </p>
      </div>

      {/* Search Bar (kept optional — comment out if you want) */}
      {/* <div className="flex justify-center mb-5">
        <input
          type="text"
          value={searchQuery}
          placeholder="Search any location worldwide..."
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="border border-gray-400 rounded-l-lg px-4 py-2 w-72 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button
          onClick={handleSearch}
          className="bg-teal-500 text-white px-4 rounded-r-lg hover:bg-teal-600"
        >
          Search
        </button>
      </div> */}

      <div
        className="relative mx-auto"
        style={{ height: "50vh", width: "100%", borderRadius: "12px" }}
      >
        <GoogleMapReact
          bootstrapURLKeys={{ key: googleMapAPIKey }}
          defaultCenter={defaultProps.center}
          defaultZoom={defaultProps.zoom}
          center={defaultProps.center}
          yesIWantToUseGoogleMapApiInternals
          onGoogleApiLoaded={({ map, maps }) => {
            mapRef.current = map;
            mapsRef.current = maps;
            console.log("Google maps loaded, centering map to:", defaultProps.center);
            if (onMapReady) onMapReady(map, maps);
          }}
          // view-only: no click-to-add handlers
        >
          {savedVillas.map((villa) => (
            <CustomMarker
              key={villa.key}
              lat={villa.lat}
              lng={villa.lng}
              color="red"
              label={villa.text}
              details={villa.details}
              thumb={villa.thumb}
            />
          ))}

          {searchMarker && (
            <CustomMarker
              key="search_marker"
              lat={searchMarker.lat}
              lng={searchMarker.lng}
              color="green"
              label={searchQuery}
              details={`Lat: ${Number(searchMarker.lat).toFixed(6)}, Lng: ${Number(
                searchMarker.lng
              ).toFixed(6)}`}
              thumb={LOCAL_THUMBNAIL}
            />
          )}
        </GoogleMapReact>
      </div>



    </div>
  );
};

export default Locations;
