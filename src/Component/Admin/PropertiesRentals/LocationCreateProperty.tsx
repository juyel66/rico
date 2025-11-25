// LocationCreateProperty.tsx
import React, { useState, useMemo, useRef } from "react";
import GoogleMapReact from "google-map-react";
import { PiMapPinBold } from "react-icons/pi";
import { IoClose } from "react-icons/io5";

const googleMapAPIKey = "AIzaSyDRNtz8qa3VSLN9EvMO42rJQaioyFPslDk";

interface Coords {
  lat: number;
  lng: number;
}

interface MapClickEvent {
  lat: number;
  lng: number;
}

interface SavedLocation extends Coords {
  key: string;
  text: string;
  isSearch?: boolean;
}

interface LocationsProps {
  lat: number;
  lng: number;
  text: string;
  onLocationAdd?: (villaData: {
    lat: number;
    lng: number;
    name: string;
    description: string;
  }) => void;
  /**
   * Optional: how many decimals to preserve when sending coords to backend.
   * Default 6.
   */
  coordDecimals?: number;
}

// Marker Component
const CustomMarker = ({
  lat,
  lng,
  color,
  onClick,
}: {
  lat: number;
  lng: number;
  color: string;
  onClick?: () => void;
}) => (
  <div
    style={{
      position: "absolute",
      transform: "translate(-50%, -100%)",
      cursor: "pointer",
      zIndex: 900,
    }}
    onClick={onClick}
  >
    <PiMapPinBold style={{ color, fontSize: "2rem" }} />
  </div>
);

// Modal Component
interface AddVillaModalProps {
  lat: number;
  lng: number;
  onClose: () => void;
  onAddVilla: (data: {
    lat: number;
    lng: number;
    name: string;
    description: string;
  }) => void;
  coordDecimals: number;
}

const AddVillaModal: React.FC<AddVillaModalProps> = ({
  lat,
  lng,
  onClose,
  onAddVilla,
  coordDecimals,
}) => {
  const [villaName, setVillaName] = useState("");
  const [description, setDescription] = useState("");

  const roundToDecimals = (v: number, d = 6) => {
    const factor = Math.pow(10, d);
    return Math.round(v * factor) / factor;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!villaName.trim()) return;
    // send rounded coordinates to parent callback
    onAddVilla({
      lat: roundToDecimals(lat, coordDecimals),
      lng: roundToDecimals(lng, coordDecimals),
      name: villaName,
      description,
    });
    setVillaName("");
    setDescription("");
  };

  return (
    <div
      className="absolute top-10 left-1/2 -translate-x-1/2 bg-white p-5 rounded-xl shadow-2xl w-80 z-[1100]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <h2 className="text-lg font-bold text-gray-800">Add New Villa</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
          <IoClose size={22} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <strong>Latitude:</strong>{" "}
            {roundToDecimals(lat, coordDecimals).toFixed(coordDecimals)}
          </p>
          <p>
            <strong>Longitude:</strong>{" "}
            {roundToDecimals(lng, coordDecimals).toFixed(coordDecimals)}
          </p>
        </div>

        <div>
          <label
            htmlFor="villaName"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            Villa Name
          </label>
          <input
            id="villaName"
            type="text"
            placeholder="e.g., Paradise Villa"
            value={villaName}
            onChange={(e) => setVillaName(e.target.value)}
            className="border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            Description (Optional)
          </label>
          <textarea
            id="description"
            placeholder="Add villa details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 text-gray-800 font-semibold py-1.5 px-4 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-teal-500 text-white font-semibold py-1.5 px-4 rounded hover:bg-teal-600"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
};

// --- Main Component ---
const LocationCreateProperty: React.FC<LocationsProps> = ({
  lat,
  lng,
  text,
  onLocationAdd,
  coordDecimals = 6,
}) => {
  const [savedVillas, setSavedVillas] = useState<SavedLocation[]>([
    { lat, lng, key: "default_villa", text },
  ]);
  const [newLocation, setNewLocation] = useState<Coords | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMarker, setSearchMarker] = useState<Coords | null>(null);

  const mapRef = useRef<any>(null);
  const mapsRef = useRef<any>(null);

  const defaultProps = useMemo(
    () => ({
      center: { lat, lng },
      zoom: 13,
    }),
    [lat, lng]
  );

  const roundToDecimals = (v: number, d = coordDecimals) => {
    const factor = Math.pow(10, d);
    return Math.round(v * factor) / factor;
  };

  const handleMapClick = (e: MapClickEvent) => {
    // round newLocation for display & modal input (the final send is additionally rounded in AddVillaModal)
    const rounded = { lat: roundToDecimals(e.lat), lng: roundToDecimals(e.lng) };
    setNewLocation(rounded);
    setIsModalOpen(true);
  };

  const handleAddVilla = (data: {
    lat: number;
    lng: number;
    name: string;
    description: string;
  }) => {
    // data.lat / data.lng are already rounded by modal to coordDecimals
    const newVilla: SavedLocation = {
      lat: data.lat,
      lng: data.lng,
      key: Date.now().toString(),
      text: data.name,
    };
    setSavedVillas((prev) => [...prev, newVilla]);
    setIsModalOpen(false);
    setNewLocation(null);
    setSearchMarker(null);
    if (onLocationAdd) onLocationAdd(data); // backend receives rounded coords
  };

  const handleSearch = () => {
    if (!searchQuery.trim() || !mapsRef.current) return;
    const geocoder = new mapsRef.current.Geocoder();
    geocoder.geocode({ address: searchQuery }, (results: any, status: any) => {
      if (status === "OK" && results && results[0]) {
        const location = results[0].geometry.location;
        const newLat = location.lat();
        const newLng = location.lng();

        // round search result coordinates
        const roundedLat = roundToDecimals(newLat);
        const roundedLng = roundToDecimals(newLng);

        setSearchMarker({ lat: roundedLat, lng: roundedLng });
        if (mapRef.current && typeof mapRef.current.panTo === "function") {
          mapRef.current.panTo({ lat: roundedLat, lng: roundedLng });
        }
      } else {
        alert("Location not found!");
      }
    });
  };

  return (
    <div>
      <div className="flex justify-start mb-5">
        <input
          type="text"
          value={searchQuery}
          placeholder="Search any location worldwide..."
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="border border-gray-400 rounded-l-lg px-4 py-2 w-72 focus:outline-none focus:ring-2  focus:ring-teal-500"
        />
        <button
          onClick={handleSearch}
          className="bg-teal-500 text-white px-4 rounded-r-lg hover:bg-teal-600"
        >
          Search
        </button>
      </div>

      <div
        className="relative mx-auto"
        style={{ height: "35vh", width: "100%", borderRadius: "12px" }}
      >
        <GoogleMapReact
          bootstrapURLKeys={{ key: googleMapAPIKey }}
          defaultCenter={defaultProps.center}
          defaultZoom={defaultProps.zoom}
          yesIWantToUseGoogleMapApiInternals
          onGoogleApiLoaded={({ map, maps }) => {
            mapRef.current = map;
            mapsRef.current = maps;
          }}
          onClick={handleMapClick}
        >
          {savedVillas.map((villa) => (
            <CustomMarker
              key={villa.key}
              lat={villa.lat}
              lng={villa.lng}
              color="red"
            />
          ))}

          {searchMarker && (
            <CustomMarker
              lat={searchMarker.lat}
              lng={searchMarker.lng}
              color="green"
              onClick={() => {
                // clicking the green search marker opens modal with rounded coords
                setNewLocation({ lat: searchMarker.lat, lng: searchMarker.lng });
                setIsModalOpen(true);
              }}
            />
          )}

          {newLocation && isModalOpen && (
            <CustomMarker lat={newLocation.lat} lng={newLocation.lng} color="blue" />
          )}
        </GoogleMapReact>

        {isModalOpen && newLocation && (
          <AddVillaModal
            lat={newLocation.lat}
            lng={newLocation.lng}
            coordDecimals={coordDecimals}
            onClose={() => {
              setIsModalOpen(false);
              setNewLocation(null);
              setSearchMarker(null);
            }}
            onAddVilla={handleAddVilla}
          />
        )}
      </div>
    </div>
  );
};

export default LocationCreateProperty;
