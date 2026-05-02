import { useState, useEffect, useCallback } from "react";

const slides = ["/c1.webp", "/c2.webp", "/c3.webp"];

const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const next = useCallback(
    () => setCurrent((prev) => (prev + 1) % slides.length),
    []
  );

  /* Auto-slide every 4 seconds, pause on hover */
  useEffect(() => {
    if (isHovered) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [isHovered, next]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl shadow-lg">
      {/* ── Slides ── */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Slide ${i + 1}`}
            className="w-full flex-shrink-0 object-cover"
            style={{ minHeight: "320px", maxHeight: "600px" }}
            draggable={false}
          />
        ))}
      </div>

      {/* ── Text overlay ── */}
      <div
        className="absolute inset-0 flex items-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="ml-8 sm:ml-16 md:ml-24 text-white drop-shadow-lg select-none">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 md:w-11 h-[2px] bg-white/80" />
            <p className="font-medium text-xs md:text-sm tracking-widest uppercase">
              Our Bestsellers
            </p>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight prata-regular">
            Latest Arrivals
          </h1>
          <div className="flex items-center gap-2 mt-3">
            <p className="font-semibold text-sm md:text-base tracking-wide">
              SHOP NOW
            </p>
            <span className="w-8 md:w-11 h-[1px] bg-white/80" />
          </div>
        </div>
      </div>

      {/* ── Dot indicators ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === current
                ? "bg-white w-6"
                : "bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Hero;
