// RatesBookingInformation.tsx
import React, { useMemo } from "react";
import { Info } from "lucide-react"; // tooltip icon

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
};

interface Rate {
  id: number;
  period: string;
  min_stay: string;
  rate: number;
}

interface RatesBookingInformationProps {
  booking_rate_start?: Rate[];
  price?: string | number;
}

const FALLBACK_IMAGE =
  "https://res.cloudinary.com/dqkczdjjs/image/upload/v1761084681/img_6_wyf01m.png";

const TAX_RATE = 0.125;

// Tooltip component
const InfoTooltip = () => {
  return (
    <div className="relative group inline-block ml-2">
      <Info className="w-4 h-4 text-gray-500 cursor-pointer hover:text-teal-600" />

      <div
        className="
          absolute left-1/2 -translate-x-1/2 mt-2 
          hidden group-hover:block 
          bg-white shadow-xl border rounded-lg p-4 w-64 z-50
          text-gray-700 text-sm
        "
      >
        <p className="font-semibold text-gray-900 mb-1">Price Breakdown</p>

        <ul className="space-y-1 text-[13px]">
          <li>• 10% Government Tax</li>
          <li>• 2.5% Booking Fee</li>
          <li className="font-semibold pt-1 text-gray-800">
            Total added: 12.5% extra
          </li>
        </ul>
      </div>
    </div>
  );
};

const generateDynamicRates = (price?: string | number): Rate[] => {
  const stays = [7, 10, 14, 20, 30];
  const today = new Date();

  const formatDateShort = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });

  const base = Number(price) || 0;
  const perNightWithTax = Math.round(base * (1 + TAX_RATE));

  return stays.map((nights, i) => {
    const end = new Date(today);
    end.setDate(today.getDate() + nights);

    return {
      id: i + 1,
      period: `${formatDateShort(today)} - ${formatDateShort(end)}`,
      min_stay: `${nights} Nights`,
      rate: perNightWithTax,
    };
  });
};

const RatesBookingInformation: React.FC<RatesBookingInformationProps> = ({
  booking_rate_start = [],
  price,
}) => {
  console.log("RatesBookingInformation — incoming price:", price);

  const rows = useMemo(() => {
    if (Array.isArray(booking_rate_start) && booking_rate_start.length > 0) {
      return booking_rate_start.map((r, idx) => ({
        ...r,
        id: r.id ?? idx + 1,
        rate: typeof r.rate === "number" ? r.rate : Number(r.rate) || 0,
      }));
    }
    return generateDynamicRates(price);
  }, [booking_rate_start, price]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const t = e.currentTarget;
    t.onerror = null;
    t.src = FALLBACK_IMAGE;
  };

  return (
    <div className="mt-20 flex flex-col items-center py-12 px-4 font-sans relative">
      <div className="absolute top-0 left-0 w-full h-96 overflow-hidden pointer-events-none" />

      <div className="w-full z-10">
        <h1 className="lg:text-4xl md:text-5xl text-2xl font-extrabold text-center text-[#111827] mb-2">
          Rates & Booking Information
        </h1>

        {/* Subtitle + Tooltip Added */}
        <p className="text-gray-600 text-start mt-15 mb-5 text-lg flex items-center">
          All rental rates are subject to 10% government tax & 2.5% booking fee.
          <InfoTooltip />
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-7 bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
            <div className="grid grid-cols-3 bg-teal-600 text-white font-semibold text-lg p-4">
              <div className="p-2">Rental Period</div>
              <div className="p-2 text-center">Minimum Stay</div>
              <div className="p-2 text-right">Rate Per Night</div>
            </div>

            {rows.map((r) => {
              const nights = parseInt(String(r.min_stay).replace(/\D/g, ""), 10) || 1;
              const calculated = nights * (Number(r.rate) || 0);

              return (
                <div
                  key={r.id}
                  className="grid grid-cols-3 p-4 text-gray-800 border-t border-gray-200 hover:bg-teal-50 hover:text-teal-700"
                >
                  <div className="p-2 font-medium">{r.period}</div>
                  <div className="p-2 text-center text-gray-600 hover:text-teal-700">
                    {r.min_stay}
                  </div>
                  <div className="p-2 text-right font-bold">
                    {formatCurrency(calculated)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-5 bg-white shadow-xl rounded-xl overflow-hidden">
            <img
              src={FALLBACK_IMAGE}
              onError={handleImageError}
              alt="Luxury sunset view with a glass of champagne"
              className="w-full h-full object-cover"
              style={{ minHeight: "300px" }}
            />
          </div>

         
        </div>
      </div>
    </div>
  );
};

export default RatesBookingInformation;
