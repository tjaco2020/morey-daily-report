/**
 * beAcon brand mark and wordmark.
 *
 * The "A" glyph is a chunky lighthouse silhouette:
 *   - Solid trapezoidal tower body with a small inner triangular void at top
 *     (just enough negative space to read as an "A")
 *   - Clear doorway cutout at the base
 *   - Separated teal signal triangle (beam) above the apex
 *   - Gold flame accent inside the beam
 *
 * Designed to feel architectural and confident at any size from 16px
 * favicon to a full wordmark. Uses currentColor for the body so it
 * inherits text color in both light and dark contexts.
 */

type SizeProps = {
  className?: string;
  bodyColor?: string; // the chunky "A" silhouette (defaults to currentColor)
  beamColor?: string; // the upper signal triangle
  accentColor?: string; // the inner flame
};

export function BeaconIcon({
  className = "w-8 h-8",
  bodyColor = "currentColor",
  beamColor = "#00B3A7",
  accentColor = "#FFC72C",
}: SizeProps) {
  return (
    <svg
      viewBox="0 0 64 80"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="beAcon"
      role="img"
    >
      {/*
        Chunky lighthouse A — single path using evenodd fill rule.
        Subpath 1: outer triangular silhouette (the tower body).
        Subpath 2: small inner triangular void at top (reads as the A's interior).
        Subpath 3: doorway cutout at the base.
      */}
      <path
        fillRule="evenodd"
        fill={bodyColor}
        d="
          M32 14 L62 76 L2 76 Z
          M32 32 L40 52 L24 52 Z
          M27 60 L37 60 L37 76 L27 76 Z
        "
      />

      {/* Teal signal triangle (the beam) — separated from the body by a small gap */}
      <path d="M32 0 L46 11 L18 11 Z" fill={beamColor} />

      {/* Gold flame accent inside the beam */}
      <path d="M32 3 L39 10 L25 10 Z" fill={accentColor} />
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
      className={`inline-flex items-baseline ${className}`}
      aria-label="beAcon"
    >
      <span
        className="font-semibold tracking-tight"
        style={{ color: textColor, fontSize: "1.2em", lineHeight: 1 }}
      >
        be
      </span>
      <BeaconIcon
        className="h-[1.5em] w-auto mx-[2px] translate-y-[2px]"
        bodyColor={textColor}
        beamColor={beamColor}
        accentColor={accentColor}
      />
      <span
        className="font-semibold tracking-tight"
        style={{ color: textColor, fontSize: "1.2em", lineHeight: 1 }}
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
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <BeaconIcon className="w-20 h-24 text-beacon-navy" />
      <BeaconWordmark className="text-[22px]" />
    </div>
  );
}
