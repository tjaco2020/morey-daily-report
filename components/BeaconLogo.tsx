/**
 * beAcon brand mark and wordmark.
 *
 * The "A" glyph is a geometric lighthouse silhouette:
 *   - chunky two-leg "A" body with an inner doorway cutout at the base
 *   - separated teal signal triangle on top (the beam)
 *   - small gold accent inside the beam (the flame)
 *
 * Designed to read confidently at any size from 16px favicon up to a
 * full wordmark. Uses currentColor for the body so it inherits text
 * color and works in both light and dark contexts.
 */

type SizeProps = {
  className?: string;
  bodyColor?: string;   // the chunky "A" silhouette (defaults to currentColor)
  beamColor?: string;   // the upper signal triangle
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
      viewBox="0 0 48 56"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="beAcon"
      role="img"
    >
      {/*
        Chunky lighthouse A — single path using evenodd fill rule.
        Subpath 1: outer triangle (the full A silhouette).
        Subpath 2: inner V cutout (the empty interior).
        Subpath 3: small doorway cutout at the base.
        Result: solid legs + interior void + doorway opening.
      */}
      <path
        fillRule="evenodd"
        fill={bodyColor}
        d="
          M24 14 L46 54 L2 54 Z
          M24 26 L36 47 L12 47 Z
          M21 54 L27 54 L24 47 Z
        "
      />

      {/* Teal signal triangle (the beam) — separated from the body */}
      <path d="M24 0 L17 12 L31 12 Z" fill={beamColor} />

      {/* Gold flame accent inside the beam */}
      <path d="M24 3 L20.5 10.5 L27.5 10.5 Z" fill={accentColor} />
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
        className="h-[1.4em] w-auto mx-[1px] translate-y-[-1px]"
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
      <BeaconIcon className="w-20 h-20 text-beacon-navy" />
      <BeaconWordmark className="text-[22px]" />
    </div>
  );
}
