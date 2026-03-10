interface CatLogoProps {
  className?: string;
}

export function CatLogo({ className = "h-8 w-8" }: CatLogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left ear */}
      <path
        d="M10 28L16 6L28 22Z"
        fill="hsl(45, 93%, 58%)"
        stroke="hsl(45, 93%, 68%)"
        strokeWidth="1.5"
      />
      {/* Right ear */}
      <path
        d="M54 28L48 6L36 22Z"
        fill="hsl(45, 93%, 58%)"
        stroke="hsl(45, 93%, 68%)"
        strokeWidth="1.5"
      />
      {/* Inner left ear */}
      <path
        d="M14 24L18 10L26 21Z"
        fill="hsl(45, 80%, 45%)"
      />
      {/* Inner right ear */}
      <path
        d="M50 24L46 10L38 21Z"
        fill="hsl(45, 80%, 45%)"
      />
      {/* Head */}
      <ellipse
        cx="32"
        cy="36"
        rx="22"
        ry="20"
        fill="hsl(45, 93%, 58%)"
      />
      {/* Left eye */}
      <ellipse cx="24" cy="33" rx="3.5" ry="4" fill="hsl(222, 47%, 8%)" />
      <ellipse cx="24.8" cy="31.8" rx="1.2" ry="1.5" fill="white" />
      {/* Right eye */}
      <ellipse cx="40" cy="33" rx="3.5" ry="4" fill="hsl(222, 47%, 8%)" />
      <ellipse cx="40.8" cy="31.8" rx="1.2" ry="1.5" fill="white" />
      {/* Nose */}
      <path
        d="M30.5 39L32 41.5L33.5 39Z"
        fill="hsl(350, 60%, 55%)"
      />
      {/* Mouth */}
      <path
        d="M32 41.5C32 41.5 29 44 27 43.5"
        stroke="hsl(222, 47%, 8%)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M32 41.5C32 41.5 35 44 37 43.5"
        stroke="hsl(222, 47%, 8%)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Left whiskers */}
      <line x1="6" y1="36" x2="19" y2="38" stroke="hsl(45, 93%, 68%)" strokeWidth="1" strokeLinecap="round" />
      <line x1="7" y1="40" x2="19" y2="40" stroke="hsl(45, 93%, 68%)" strokeWidth="1" strokeLinecap="round" />
      <line x1="8" y1="44" x2="19" y2="42" stroke="hsl(45, 93%, 68%)" strokeWidth="1" strokeLinecap="round" />
      {/* Right whiskers */}
      <line x1="58" y1="36" x2="45" y2="38" stroke="hsl(45, 93%, 68%)" strokeWidth="1" strokeLinecap="round" />
      <line x1="57" y1="40" x2="45" y2="40" stroke="hsl(45, 93%, 68%)" strokeWidth="1" strokeLinecap="round" />
      <line x1="56" y1="44" x2="45" y2="42" stroke="hsl(45, 93%, 68%)" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
