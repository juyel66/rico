import { CiShare2 } from "react-icons/ci";
import React from "react";
import { Link } from "react-router-dom";

interface Property {
  id: number;
  price: number;
  beds: number;
  baths: number;
  pool: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  title: string;
  location: string;
  rateType: string;
}

const PropertyCard: React.FC<{ property: Property }> = ({ property }) => {
  const formattedPrice = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
  }).format(property.price);

  const amenities = [
    {
      icon: (
        <img
          src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760827484/Frame_3_rwdb0z.png"
          alt="bed"
          className="w-5 h-5"
        />
      ),
      value: `${property.beds} ${property.beds === 1 ? "Bed" : "Beds"}`,
    },
    {
      icon: (
        <img
          src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760827484/Frame_4_zsqcrj.png"
          alt="bath"
          className="w-5 h-5"
        />
      ),
      value: `${property.baths} ${property.baths === 1 ? "Bath" : "Baths"}`,
    },
    {
      icon: (
        <img
          src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760827483/Frame_5_cyajjb.png"
          alt="pool"
          className="w-5 h-5"
        />
      ),
      value: `${property.pool} ${property.pool === 1 ? "Pool" : "Pools"}`,
    },
  ];

  return (
    <div className="container relative mx-auto my-8 sm:my-10 bg-white p-4 sm:p-6 rounded-2xl border overflow-hidden font-sans">
      <div className="flex flex-col items-center md:flex-row bg-white rounded-2xl overflow-hidden">

        {/* Image Section */}
        <div
          className="relative w-full md:w-3/5 h-64 sm:h-80 md:h-[400px] lg:h-[450px] bg-cover bg-center rounded-2xl"
          style={{ backgroundImage: `url(${property.imageUrl})` }}
        >
          {/* Rating */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl font-semibold text-sm flex items-center space-x-1">
            <span className="text-yellow-500">⭐</span>
            <span className="text-gray-800">{property.rating}</span>
            <span className="text-gray-700 font-normal">
              ({property.reviewCount})
            </span>
          </div>

          {/* Favorite & Share Buttons */}
          <div className="absolute top-3 right-3 flex space-x-2">
            <div className="w-9 h-9 flex items-center justify-center bg-white rounded-full text-gray-700 hover:bg-gray-100 transition duration-150">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-.318-.318a4.5 4.5 0 00-6.364 0z"
                ></path>
              </svg>
            </div>

            <div className="absolute p-2 rounded-full bg-white top-50 -right-14">
              <img
                src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760828543/hd_svg_logo_2_hw4vsa.png"
                alt=""
              />
            </div>

            <div className="w-9 h-9 flex items-center justify-center bg-white rounded-full text-gray-700 hover:bg-gray-100 transition duration-150">
              <CiShare2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="w-full ml-5 md:w-2/5 flex flex-col px-4 sm:px-6 md:px-8 mt-4 md:mt-0">
          <h3 className="text-[16px] sm:text-2xl md:text-3xl font-extrabold text-gray-900">
            {property.title}
          </h3>

          <p className="text-sm sm:text-base mt-2 text-gray-500 flex items-center font-medium">
            <img
              src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760829803/Frame_6_keemxx.png"
              alt="location"
              className="w-5 h-5 mr-1"
            />{" "}
            {property.location}
          </p>

          <p className="text-[16px] sm:text-xl md:text-2xl text-emerald-700 font-bold mt-4">
            From <span>USD${formattedPrice}</span>/night
            
          </p>

          {/* Amenities */}
          <div className="flex flex-wrap items-center text-gray-500 text-xs sm:text-sm md:text-base font-medium mt-4 space-x-4">
            {amenities.map((item, index) => (
              <div key={index} className="flex items-center space-x-1">
                {item.icon}
                <span className="text-gray-700">{item.value}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Link
            to={`/property/${property.id}`}  // 🔥 ID-based routing added
            className="mt-6 w-full py-3 sm:py-4 text-center bg-teal-50 text-emerald-700 font-bold text-base sm:text-lg md:text-xl border-2 border-[#009689] rounded-xl hover:bg-gray-200 transition duration-150"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

const SalesCard: React.FC<{ property: Property }> = ({ property }) => (
  <PropertyCard property={property} />
);

export default SalesCard;
