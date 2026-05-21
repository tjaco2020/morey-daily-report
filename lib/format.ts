// Date/time formatting helpers. All operate in the user's local time zone
// (America/New_York for Morey's staff).

/**
 * Today as YYYY-MM-DD in Morey's operating timezone (America/New_York).
 * Always returns the NJ date regardless of where the code runs.
 *
 * Uses Intl.DateTimeFormat.formatToParts so we can assemble the string with
 * guaranteed ASCII hyphens. Some Node/Vercel runtimes emit non-breaking
 * hyphens via "en-CA" date formatting, which breaks URL pattern matching
 * (causing 404s on routes like /supervisor/build/<date>).
 */
export function todayLocal(): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(new Date())) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Formats an ISO timestamp as "h:mm a" in local time. */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Formats a YYYY-MM-DD date string as "Mon, May 19, 2026". */
export function formatDate(s: string): string {
  // s is in YYYY-MM-DD form; parse as local date (not UTC) to avoid TZ shift.
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Pretty status label */
export function statusLabel(
  status:
    | "pending"
    | "submitted"
    | "included"
    | "locked"
    | "archived"
    | string,
): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "submitted":
      return "Submitted";
    case "included":
      return "In Daily Report";
    case "locked":
      return "Locked";
    case "archived":
      return "Archived";
    default:
      return status;
  }
}

/** Tailwind classes per status */
export function statusClasses(status: string): string {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "submitted":
      return "bg-blue-100 text-blue-800";
    case "included":
      return "bg-green-100 text-green-800";
    case "locked":
      return "bg-gray-200 text-gray-700";
    case "archived":
      return "bg-gray-100 text-gray-500";
    default:
      return "bg-gray-100 text-gray-700";
  }
}
