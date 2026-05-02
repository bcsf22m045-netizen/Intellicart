import { motion } from "framer-motion";

/**
 * SplineRobot — Premium animated SVG robot avatar
 * No external dependencies, no watermarks, pure CSS + SVG magic ✨
 */
const SplineRobot = ({
  className = "",
  style = {},
  variant = "floating",
  size,
}) => {
  const isPanel = variant === "panel";
  const s = size || (isPanel ? 100 : 80);

  return (
    <motion.div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: s, height: s, ...style }}
      animate={
        isPanel
          ? { y: [0, -5, 0] }
          : { y: [0, -7, 0], scale: [1, 1.03, 1] }
      }
      transition={{
        duration: isPanel ? 3 : 3.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* Glow behind robot */}
      <div
        style={{
          position: "absolute",
          inset: "-20%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.35) 0%, rgba(139,92,246,0.08) 50%, transparent 70%)",
          filter: "blur(8px)",
          animation: "pulse 3s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* SVG Robot */}
      <svg
        viewBox="0 0 200 200"
        width={s * 0.85}
        height={s * 0.85}
        style={{ position: "relative", zIndex: 2, filter: "drop-shadow(0 0 12px rgba(139,92,246,0.5))" }}
      >
        <defs>
          {/* Head gradient */}
          <linearGradient id="headGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#5b21b6" />
          </linearGradient>
          {/* Body gradient */}
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#4c1d95" />
          </linearGradient>
          {/* Eye glow */}
          <radialGradient id="eyeGlow">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="70%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#06b6d4" />
          </radialGradient>
          {/* Antenna glow */}
          <radialGradient id="antennaGlow">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#ec4899" />
          </radialGradient>
          {/* Visor gradient */}
          <linearGradient id="visorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34,211,238,0.15)" />
            <stop offset="50%" stopColor="rgba(34,211,238,0.3)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0.15)" />
          </linearGradient>
        </defs>

        {/* Antenna stem */}
        <line x1="100" y1="38" x2="100" y2="22" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" values="-3 100 38;3 100 38;-3 100 38" dur="2s" repeatCount="indefinite" />
        </line>
        {/* Antenna bulb */}
        <circle cx="100" cy="18" r="7" fill="url(#antennaGlow)" opacity="0.9">
          <animate attributeName="r" values="7;9;7" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.9;1;0.9" dur="1.5s" repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="rotate" values="-3 100 38;3 100 38;-3 100 38" dur="2s" repeatCount="indefinite" />
        </circle>
        {/* Antenna glow ring */}
        <circle cx="100" cy="18" r="12" fill="none" stroke="#f472b6" strokeWidth="1" opacity="0.3">
          <animate attributeName="r" values="10;16;10" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="1.5s" repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="rotate" values="-3 100 38;3 100 38;-3 100 38" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* Head */}
        <rect x="55" y="38" width="90" height="68" rx="28" ry="28" fill="url(#headGrad)" />
        {/* Head shine */}
        <rect x="63" y="42" width="74" height="20" rx="10" ry="10" fill="rgba(255,255,255,0.12)" />

        {/* Visor */}
        <rect x="66" y="56" width="68" height="30" rx="15" ry="15" fill="url(#visorGrad)" stroke="rgba(34,211,238,0.3)" strokeWidth="1" />

        {/* Left eye */}
        <circle cx="82" cy="72" r="9" fill="url(#eyeGlow)">
          <animate attributeName="r" values="9;9;1;9;9" dur="4s" keyTimes="0;0.45;0.5;0.55;1" repeatCount="indefinite" />
        </circle>
        {/* Left eye highlight */}
        <circle cx="79" cy="69" r="3" fill="rgba(255,255,255,0.7)">
          <animate attributeName="r" values="3;3;0;3;3" dur="4s" keyTimes="0;0.45;0.5;0.55;1" repeatCount="indefinite" />
        </circle>

        {/* Right eye */}
        <circle cx="118" cy="72" r="9" fill="url(#eyeGlow)">
          <animate attributeName="r" values="9;9;1;9;9" dur="4s" keyTimes="0;0.45;0.5;0.55;1" repeatCount="indefinite" />
        </circle>
        {/* Right eye highlight */}
        <circle cx="115" cy="69" r="3" fill="rgba(255,255,255,0.7)">
          <animate attributeName="r" values="3;3;0;3;3" dur="4s" keyTimes="0;0.45;0.5;0.55;1" repeatCount="indefinite" />
        </circle>

        {/* Mouth – cute smile */}
        <path d="M88 88 Q100 98 112 88" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" opacity="0.8">
          <animate attributeName="d" values="M88 88 Q100 98 112 88;M88 90 Q100 96 112 90;M88 88 Q100 98 112 88" dur="3s" repeatCount="indefinite" />
        </path>

        {/* Ear left */}
        <rect x="44" y="60" width="14" height="24" rx="7" ry="7" fill="#7c3aed" />
        <rect x="46" y="66" width="10" height="12" rx="5" ry="5" fill="#22d3ee" opacity="0.25" />

        {/* Ear right */}
        <rect x="142" y="60" width="14" height="24" rx="7" ry="7" fill="#7c3aed" />
        <rect x="144" y="66" width="10" height="12" rx="5" ry="5" fill="#22d3ee" opacity="0.25" />

        {/* Neck */}
        <rect x="90" y="106" width="20" height="12" rx="4" fill="#6d28d9" />

        {/* Body */}
        <rect x="62" y="116" width="76" height="52" rx="18" ry="18" fill="url(#bodyGrad)" />
        {/* Body shine */}
        <rect x="70" y="120" width="60" height="14" rx="7" ry="7" fill="rgba(255,255,255,0.08)" />

        {/* Chest core */}
        <circle cx="100" cy="140" r="10" fill="rgba(34,211,238,0.15)" stroke="#22d3ee" strokeWidth="1.5">
          <animate attributeName="r" values="10;12;10" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="140" r="5" fill="#22d3ee" opacity="0.7">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* Left arm */}
        <rect x="40" y="120" width="18" height="40" rx="9" ry="9" fill="#7c3aed">
          <animateTransform attributeName="transform" type="rotate" values="-3 49 120;3 49 120;-3 49 120" dur="2.5s" repeatCount="indefinite" />
        </rect>
        {/* Left hand */}
        <circle cx="49" cy="164" r="8" fill="#a78bfa">
          <animateTransform attributeName="transform" type="rotate" values="-3 49 120;3 49 120;-3 49 120" dur="2.5s" repeatCount="indefinite" />
        </circle>

        {/* Right arm */}
        <rect x="142" y="120" width="18" height="40" rx="9" ry="9" fill="#7c3aed">
          <animateTransform attributeName="transform" type="rotate" values="3 151 120;-3 151 120;3 151 120" dur="2.5s" repeatCount="indefinite" />
        </rect>
        {/* Right hand */}
        <circle cx="151" cy="164" r="8" fill="#a78bfa">
          <animateTransform attributeName="transform" type="rotate" values="3 151 120;-3 151 120;3 151 120" dur="2.5s" repeatCount="indefinite" />
        </circle>

        {/* Left foot */}
        <rect x="74" y="166" width="18" height="16" rx="9" ry="6" fill="#6d28d9" />

        {/* Right foot */}
        <rect x="108" y="166" width="18" height="16" rx="9" ry="6" fill="#6d28d9" />
      </svg>

      {/* Pulse keyframe */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </motion.div>
  );
};

export default SplineRobot;
