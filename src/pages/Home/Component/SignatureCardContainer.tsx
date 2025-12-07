import React, { useState } from "react";
import SignatureCard from "./SignatureCard";

interface Props {
  items?: any[];
  loading?: boolean;
  error?: string | null;
}

const INITIAL_SHOW = 6;
const INCREMENT = 3;

const SignatureCardContainer: React.FC<Props> = ({ items = [], loading = false, error = null }) => {
  const total = items.length;
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_SHOW);

  const visibleItems = items.slice(0, Math.min(visibleCount, total));
  const allVisible = visibleCount >= total;

  const handleToggle = () => {
    if (allVisible) {
      // Collapse back to default
      setVisibleCount(INITIAL_SHOW);

      // Optional: smooth scroll back to section top
      const el = document.getElementById("signatureVilla");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // Load 3 more items
      setVisibleCount((prev) => Math.min(prev + INCREMENT, total));
    }
  };

  return (
    <div id="signatureVilla" className="py-12 p-2">
      <h2 className="lg:text-4xl text-3xl mt-5  font-extrabold text-gray-900 text-center mb-10">
        Our <span className="text-[#009689] italic">Signature</span> Villas
      </h2>

      {loading && <div className="w-full flex justify-center items-center my-8">
  <div className="w-full max-w-md bg-white border border-gray-200 shadow-md rounded-2xl px-6 py-8 flex flex-col items-center justify-center">
    <div className="mb-3">
      {/* Spinner */}
      <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-teal-600 animate-spin" />
    </div>
    <p className="text-sm font-medium text-gray-800">Loading villas…</p>
    <p className="text-xs text-gray-500 mt-1">
      Please wait a moment while we prepare the listings for you.
    </p>
  </div>
</div>}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded mb-6 text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {visibleItems.length > 0 ? (
          visibleItems.map((villa: any) => (
            <SignatureCard key={villa.id ?? villa.pk ?? Math.random()} villa={villa} />
          ))
        ) : (
          !loading && (
            <div className="col-span-full text-center text-gray-600">No villas found.</div>
          )
        )}
      </div>

      {/* Only show button if total > 6 */}
      {total > INITIAL_SHOW && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleToggle}
            className="px-6 py-2 rounded-md bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm"
          >
            {allVisible ? "View less" : "View more"}
          </button>
        </div>
      )}
    </div>
  );
};

export default SignatureCardContainer;
