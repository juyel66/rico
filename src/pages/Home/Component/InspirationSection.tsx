const InspirationSection = () => {
  const videoSource = "https://res.cloudinary.com/dqkczdjjs/video/upload/v1760200912/inspirationsVideo_lp99ti.mp4";

  return (
    <div>
      <h1 className="lg:text-4xl text-2xl lg:p-0 p-4 mt-5 font-semibold flex items-center justify-center text-start">
        Our origin. Our Inspiration. <br />
        -----A journey through the heart of barbados.
      </h1>


      <div className="relative h-screen  mt-10 max-h-[700px] w-full overflow-hidden">
        {/* 1. Background Video Element (Absolute position to fill container) */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={videoSource}
          autoPlay // Start playing automatically
          loop // Loop the video
          muted // Mute the video for autoplay compatibility
          playsInline // Required for autoplay on some mobile devices
        />

        {/* Optional: Dark overlay for better text contrast */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
    </div>
  );
};

export default InspirationSection;
