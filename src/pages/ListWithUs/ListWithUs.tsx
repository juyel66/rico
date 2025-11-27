import React, { useRef } from "react";
import BeforePage from "./BeforePage";
import Benefits from "./Benefits";
import ListMyVilla from "./ListMyVilla";
import ListWithUsBannerPage from "./ListWIthUsBannerPage";
import PartnerSections from "./PartnerSections";
import SubmitPropertyForm from "./SubmitPropertyForm";
import WorksPage from "./WorksPage";

const ListWithUs = () => {
  const submitFormRef = useRef<HTMLDivElement>(null);

  const handleScrollToForm = () => {
    submitFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <div
        className="pb-10 rounded-xl shadow-lg border border-gray-200 mx-auto bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://res.cloudinary.com/dqkczdjjs/image/upload/v1760812885/savba_k7kol1.png')",
        }}
      >
        <div>
          <ListWithUsBannerPage onSubmitClick={handleScrollToForm} />
        </div>

        <div className="container mx-auto">
          <PartnerSections />
        </div>
      </div>

      <div className="container mx-auto">
        <Benefits />
      </div>

      <div className="container mx-auto">
        <WorksPage />
      </div>

      {/* BEFORE PAGE with scroll handler */}
      <BeforePage onStartClick={handleScrollToForm} />

      {/* Submit Property Form */}
      <div ref={submitFormRef}>
        <SubmitPropertyForm />
      </div>

      <ListMyVilla />
    </div>
  );
};

export default ListWithUs;
