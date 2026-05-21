/**
 * beAcon brand mark and wordmark components.
 *
 * The "A" glyph is the icon — a geometric lighthouse silhouette with a
 * teal signal beam and a gold accent. It works at any size from 16px
 * favicon to a full wordmark.
 *
 * Three variants:
 *   <BeaconIcon />     — just the A (square aspect)
 *   <BeaconWordmark /> — "beAcon" with the A as a logo glyph
 *   <BeaconStacked />  — icon above wordmark (for splash / login)
 */

type SizeProps = {
  className?: string;
  /** Stroke colors — defaults match the brand. */
  bodyColor?: string;  // the "A" silhouette
  beamColor?: string;  // the upper signal triangle
  accentColor?: string; // the small inner accent
};

export function BeaconIcon({
  className = "w-8 h-8",
  bodyColor = "currentColor",
  beamColor = "#00B3A7",
  accentColor = "#FFC72C",
}: SizeProps) {
  return (
    <svg
      viewBox="0 0 40 48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="beAcon"
      role="img"
    >
      {/* Lighthouse body — geometric A silhouette.
          A tent/teepee shape with a center vertical for stability. */}
      <path
        d="M20 12 L4 44 L11 44 L20 26 L29 44 L36 44 Z"
        fill={bodyColor}
      />
      {/* Inner doorway accent — small white triangle suggesting a doorway */}
      <path
        d="M20 30 L17 44 L23 44 Z"
        fill="#FFFFFF"
        opacity="0.9"
      />
      {/* Teal signal beam at the top — the lighthouse light */}
      <path
        d="M20 0 L13 13 L27 13 Z"
        fill={beamColor}
      />
      {/* Gold accent — the flame / source */}
      <path
        d="M20 4 L17 11 L23 11 Z"
        fill={accentColor}
      />
    </svg>
  );
}

/**
 * Inline wordmark — "be" + icon-A + "con".
 * The icon sits in the position of the capital A in "beAcon".
 */
export function BeaconWordmark({
  className = "h-8",
  textColor = "#0F172A",
  beamColor = "#00B3A7",
  accentColor = "#FFC72C",
}: {
  className?: string;
  textColor?: string;
  beamColor?: string;
  accentColor?: string;
}) {
  return (
    <span
      className={`inline-flex items-center ${className}`}
      aria-label="beAcon"
    >
      <span
        className="font-semibold tracking-tight"
        style={{ color: textColor, fontSize: "1.25em", lineHeight: 1 }}
      >
        be
      </span>
      <BeaconIcon
        className="h-[1.1em] w-auto -mx-0.5 translate-y-[-2px]"
        bodyColor={textColor}
        beamColor={beamColor}
        accentColor={accentColor}
      />
      <span
        className="font-semibold tracking-tight"
        style={{ color: textColor, fontSize: "1.25em", lineHeight: 1 }}
      >
        con
      </span>
    </span>
  );
}

/**
 * Stacked variant — icon above wordmark. For login / splash / app icon.
 */
export function BeaconStacked({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <BeaconIcon className="w-16 h-16 text-beacon-navy" />
      <BeaconWordmark className="text-[20px]" />
    </div>
  );
}
