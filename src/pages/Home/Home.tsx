import React, { useEffect, useState } from "react";
import FilterSystem from "@/shared/FilterSystem";
import Banner from "./Component/Banner";
import SignatureCardContainer from "./Component/SignatureCardContainer";
import InspirationSection from "./Component/InspirationSection";
import Luxury from "./Component/Luxury";
import ExperiencesPage from "./Component/ExperiencesPage";
import GuestSections from "./Component/GuestSections";
import EstateExperience from "./Component/EstateExperience";
import Contact from "../Contact/Contact";
import Affiliates from "./Component/Affiliates";

const API_BASE = import.meta.env.VITE_API_BASE || "http://10.10.13.60:8000/api";

const Home: React.FC = () => {
  // masterData = full API response (array)
  const [masterData, setMasterData] = useState<any[]>([]);
  // filteredData = result provided by FilterSystem after applying filters
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/villas/properties/`);
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(`API error: ${res.status} ${t}`);
        }
        const json = await res.json();
        // Support paginated or plain arrays
        const items: any[] = Array.isArray(json) ? json : json.results ?? json.items ?? [];

        if (!cancelled) {
          setMasterData(items);
          // initial filtered view = items (so SignatureCardContainer shows all until user filters)
          setFilteredData(items);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Home fetch error:", err);
          setError(err?.message ?? "Failed to load data");
          setMasterData([]);
          setFilteredData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div
        className="bg-white pb-10 rounded-xl shadow-lg border border-gray-200 mx-auto bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://res.cloudinary.com/dqkczdjjs/image/upload/v1760812885/savba_k7kol1.png')",
        }}
      >
        <div>
          <Banner />
        </div>

        <div className="container mx-auto">
          {/* Pass master API data into FilterSystem.
              FilterSystem will call onResults(filteredItems) when user applies filters.
              We do not provide an allowedType here (null) to allow filtering across all items on Home. */}
          <FilterSystem
            data={masterData}
            allowedType={null}
            onResults={(results: any[]) => {
              // Ensure results is an array
              setFilteredData(Array.isArray(results) ? results : []);
            }}
          />
        </div>

       
      </div>

      <div className="container mx-auto">
        {/* SignatureCardContainer now receives filtered data via props */}
        <SignatureCardContainer items={filteredData} loading={loading} error={error} />
      </div>

      <div className="container mx-auto">
        <InspirationSection />
      </div>

      <div></div>

     

      <div className="container mx-auto">
        <Luxury />
      </div>

      <div className="container mx-auto">
        <ExperiencesPage />
      </div>

      <div className="container mx-auto">
        <GuestSections />
      </div>

      <div className="">
        <EstateExperience />
      </div>

      <div className="container mx-auto">
        <Contact />
      </div>

      <Affiliates />
    </div>
  );
};

export default Home;
