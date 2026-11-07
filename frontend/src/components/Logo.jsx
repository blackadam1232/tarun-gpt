// Premium multi-layered AI spark mark with iridescent glow
export default function Logo({ size = 32, className = '' }) {
  return (
    <span
      className={`logo ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 32 32"
        width={Math.round(size * 0.65)}
        height={Math.round(size * 0.65)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logo-spark-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="0.6" stopColor="#e0e7ff" />
            <stop offset="1" stopColor="#c7d2fe" />
          </linearGradient>
          <radialGradient id="logo-core-glow" cx="16" cy="16" r="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Ambient inner soft glow */}
        <circle cx="16" cy="16" r="7" fill="url(#logo-core-glow)" />
        {/* 4-point primary spark with smooth aerodynamic curvature */}
        <path
          d="M16 2.5C16.7 9.8 22.2 15.3 29.5 16C22.2 16.7 16.7 22.2 16 29.5C15.3 22.2 9.8 16.7 2.5 16C9.8 15.3 15.3 9.8 16 2.5Z"
          fill="url(#logo-spark-grad)"
        />
        {/* Tiny cross micro-accent for a celestial feel */}
        <circle cx="16" cy="16" r="1.6" fill="#ffffff" />
      </svg>
    </span>
  )
}
