// You would replace this with the actual URL to your image asset
const ASSETS_IMAGE_URL =
  "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760207917/img_6_syklrn.png";

interface BeforePageProps {
  onStartClick: () => void;
}

const BeforePage: React.FC<BeforePageProps> = ({ onStartClick }) => {
  const requirements = [
    "Proof of Ownership",
    "Proof of Insurance",
    "High Resolution Professional Photos",
    "Access To Availability Calendar (API/ICAL)",
    "Other Pertinent Rental Information (rates & policies)",
  ];

  return (
    <section className="w-full py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          
          {/* Left Column */}
          <div className="lg:w-1/2 text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
              Before You Apply
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              Please prepare the following to make the onboarding smooth.
            </p>

            {/* Requirements */}
            <ul className="space-y-4 mb-10">
              {requirements.map((item, index) => (
                <li key={index} className="flex items-start lg:items-center text-gray-700">
                  <svg
                    className="w-6 h-6 text-emerald-500 mr-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* Start Application Button */}
            <button
              onClick={onStartClick}
              className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-300 ease-in-out"
            >
              Start Application
            </button>
          </div>

          {/* Right Column Image */}
          <div className="lg:w-1/2 flex justify-center lg:justify-end">
            <img
              src={ASSETS_IMAGE_URL}
              alt="Documents and items related to property application"
              className="w-full max-w-md lg:max-w-none h-auto rounded-3xl shadow-xl object-cover"
              style={{ minHeight: "400px", maxHeight: "550px" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default BeforePage;
