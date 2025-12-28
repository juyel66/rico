import React, { useState } from "react";

interface DescriptionProps {
  descriptionData: string;
  descriptionImage?: string;
}

const Description: React.FC<DescriptionProps> = ({
  descriptionData,
  descriptionImage,
}) => {
  const [showFull, setShowFull] = useState(false);

  const title = "About This Property";
  const text = descriptionData;

  const MAX_PREVIEW = 400;
  const MAX_TOTAL = 780;

  const isLongText = text.length > MAX_PREVIEW;
  const isOverMaxTotal = text.length > MAX_TOTAL;

  const previewText = text.slice(0, MAX_PREVIEW) + "...";
  const fullText = isOverMaxTotal
    ? text.slice(0, MAX_TOTAL) + "..."
    : text;

  const displayedText = showFull ? fullText : isLongText ? previewText : text;

  const toggleShow = () => setShowFull((prev) => !prev);

  return (
    <div className="flex mt-20 mb-20 gap-5 flex-col md:flex-row items-start justify-center">
      <div className="w-full md:w-1/2 bg-white rounded-lg flex items-start justify-start">
        <div className="h-96 w-full flex items-start justify-start">
          <div className="h-full w-full p-4 text-left">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">
              {title}
            </h2>

            <div className="text-gray-600 text-base leading-relaxed mb-4">
              {displayedText}
            </div>

            {isLongText && (
              <button
                onClick={toggleShow}
                className="text-teal-600 hover:text-teal-800 font-medium transition-colors duration-200"
              >
                {showFull ? "See Less" : "See More"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center">
        <div className="h-[440px] w-full rounded-lg overflow-hidden">
          <img
            className="h-full w-full object-cover rounded-xl"
            src={
              descriptionImage ||
              "https://res.cloudinary.com/dqkczdjjs/image/upload/v1760298884/imgggggggg_barfpz.png"
            }
            alt="Property description"
          />
        </div>
      </div>
    </div>
  );
};

export default Description;
