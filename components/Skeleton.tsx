type Props = {
  className?: string;
  /** Aspect-ratio-style shorthand, e.g. "h-4 w-32" */
};

/**
 * Subtle shimmering placeholder for content that's loading. Pair with
 * Tailwind size classes via `className`.
 */
export function Skeleton({ className }: Props) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-slate-200/70 via-slate-100 to-slate-200/70 bg-[length:400%_100%] rounded-md ${
        className ?? "h-4 w-full"
      }`}
      style={{
        backgroundPosition: "100% 0",
        animation:
          "skeleton-shimmer 1.6s ease-in-out infinite, pulse 2s ease-in-out infinite",
      }}
    />
  );
}
