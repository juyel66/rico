// import { Link } from "react-router-dom";

// const FeaturedBadge = () => (
//   <div className="flex items-center w-1/3 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full text-white text-sm font-semibold border border-white/20 relative whitespace-nowrap transition-all duration-500 ease-in-out">
//     <img
//       className="w-6 h-6"
//       src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760898796/Icon_22_fqdcfj.png"
//       alt=""
//     />
//     <span className="ml-2">Barbados's #1 Luxury Villa Platform</span>
//   </div>
// );

// const CallToActionButtons = () => (
//   <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0 mt-6 transition-all duration-500 ease-in-out">
//     <Link
//       to="/rents"
//       className="flex items-center justify-center space-x-2 px-8 py-3 bg-teal-500 text-white font-semibold rounded-lg shadow-xl hover:bg-teal-600 transition duration-300 text-sm"
//     >
//       <img
//         className="w-6 h-6"
//         src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760834990/Component_2_3_qinbrf.png"
//         alt=""
//       />
//       <span>Explore Listings</span>
//     </Link>

//     <Link to="/contact"
//       className="flex items-center justify-center space-x-2 px-8 py-3 border-2 border-teal-500 text-white font-semibold rounded-lg bg-black/10 backdrop-blur-sm hover:bg-white/10 transition duration-300 text-sm"
//     >
//       <img
//         className="w-6 h-6"
//         src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760834917/Component_2_2_bxvubj.png"
//         alt=""
//       />
//       <span>Get a Free Consultation</span>
//     </Link>
//   </div>
// );

// const ClientAvatars = () => (
//   <div className="flex flex-col sm:flex-row sm:items-center mt-6 transition-all duration-500 ease-in-out">
//     <div className="relative flex -space-x-2 mb-2 sm:mb-0">
//       {["Ellipse_21_kiaox1", "Ellipse_22_ep1nmp", "Ellipse_23_e3oi10"].map((img, i) => (
//         <img
//           key={i}
//           src={`https://res.cloudinary.com/dqkczdjjs/image/upload/v1760822107/${img}.png`}
//           className="w-10 h-10 rounded-full bg-gray-300 border-2 border-white transition-all duration-500 ease-in-out"
//           alt={`Client ${i + 1}`}
//         />
//       ))}
//     </div>
//     <span className="text-white text-sm font-medium ml-0 sm:ml-4 whitespace-nowrap">
//       Join with thousands of Satisfied Clients
//     </span>
//   </div>
// );

// const Banner = () => {
//   const videoSource =
//     "https://res.cloudinary.com/dqkczdjjs/video/upload/v1760120464/d_v_jsxaky.mp4";

//   return (
//     <div className="relative w-full h-[550px] overflow-hidden transition-all duration-700 ease-in-out">
//       <video
//         className="absolute inset-0 w-full h-full object-cover"
//         src={videoSource}
//         autoPlay
//         loop
//         muted
//         playsInline
//       />
//       <div className="absolute inset-0 bg-black/20"></div>

//       <div className="relative z-10 flex flex-col justify-center h-full container mx-auto p-4 transition-all duration-700 ease-in-out">
//         <FeaturedBadge />
//         <ClientAvatars />

//         <h1 className="mt-8 text-4xl font-extrabold text-white leading-tight transition-all duration-700 ease-in-out">
//           Find Your Dream Space <br />
//           with{" "}
//           <span className="text-teal-400 drop-shadow-lg italic">
//             Eastmond Villas
//           </span>
//         </h1>

//         <p className="mt-3 text-base text-white/90 font-light max-w-2xl transition-all duration-700 ease-in-out">
//           Welcome To The Signature Standard Of Refined Luxury
//         </p>

//         <CallToActionButtons />
//       </div>
//     </div>
//   );
// };

// export default Banner;













import React from "react";

const FeaturedBadge = () => (
  <div className="flex items-center lg:w-4/13 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full text-white text-sm font-semibold border border-white/20 relative whitespace-nowrap transition-all duration-500 ease-in-out">
    <img
      className="w-6 h-6"
      src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760898796/Icon_22_fqdcfj.png"
      alt=""
    />
    <span className="ml-2">Barbados's #1 Luxury Villa Platform</span>
  </div>
);

interface CallToActionButtonsProps {
  onExploreClick?: () => void;
}

const CallToActionButtons: React.FC<CallToActionButtonsProps> = ({ onExploreClick }) => (
  <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0 mt-6 transition-all duration-500 ease-in-out">
    {/* Replaced Link behavior with a button that calls the provided scroll handler.
        Styling and inner markup kept exactly the same to preserve design. */}
    <button
      onClick={onExploreClick}
      className="flex items-center justify-center space-x-2 px-8 py-3 bg-teal-500 text-white font-semibold rounded-lg shadow-xl hover:bg-teal-600 transition duration-300 text-sm"
    >
      <img
        className="w-6 h-6"
        src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760834990/Component_2_3_qinbrf.png"
        alt=""
      />
      <span>Explore Listings</span>
    </button>

    <a
      href="/contact"
      className="flex items-center justify-center space-x-2 px-8 py-3 border-2 border-teal-500 text-white font-semibold rounded-lg bg-black/10 backdrop-blur-sm hover:bg-white/10 transition duration-300 text-sm"
    >
      <img
        className="w-6 h-6"
        src="https://res.cloudinary.com/dqkczdjjs/image/upload/v1760834917/Component_2_2_bxvubj.png"
        alt=""
      />
      <span>Get a Free Consultation</span>
    </a>
  </div>
);

const ClientAvatars = () => (
  <div className="flex flex-col sm:flex-row sm:items-center mt-6 transition-all duration-500 ease-in-out">
    <div className="relative flex -space-x-2 mb-2 sm:mb-0">
      {["Ellipse_21_kiaox1", "Ellipse_22_ep1nmp", "Ellipse_23_e3oi10"].map((img, i) => (
        <img
          key={i}
          src={`https://res.cloudinary.com/dqkczdjjs/image/upload/v1760822107/${img}.png`}
          className="w-10 h-10 rounded-full bg-gray-300 border-2 border-white transition-all duration-500 ease-in-out"
          alt={`Client ${i + 1}`}
        />
      ))}
    </div>
    <span className="text-white text-sm font-medium ml-0 sm:ml-4 whitespace-nowrap">
      Join with thousands of Satisfied Clients
    </span>
  </div>
);

interface BannerProps {
  onExploreClick?: () => void;
}

const Banner: React.FC<BannerProps> = ({ onExploreClick }) => {
  const videoSource =
    "https://res.cloudinary.com/dqkczdjjs/video/upload/v1760120464/d_v_jsxaky.mp4";

  return (
    <div className="relative w-full h-[550px] overflow-hidden transition-all duration-700 ease-in-out">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={videoSource}
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="relative z-10 flex flex-col justify-center h-full container mx-auto p-4 transition-all duration-700 ease-in-out">
        <FeaturedBadge />
        <ClientAvatars />

        <h1 className="mt-8 text-4xl font-extrabold text-white leading-tight transition-all duration-700 ease-in-out">
          Find Your Dream Space <br />
          with{" "}
          <span className="text-teal-400 drop-shadow-lg italic">
            Eastmond Villas
          </span>
        </h1>

        <p className="mt-3 text-base text-white/90 font-light max-w-2xl transition-all duration-700 ease-in-out">
          Welcome To The Signature Standard Of Refined Luxury
        </p>

        <CallToActionButtons onExploreClick={onExploreClick} />
      </div>
    </div>
  );
};

export default Banner;

