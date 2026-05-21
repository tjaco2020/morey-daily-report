// Date/time formatting helpers. All operate in the user's local time zone
// (America/New_York for Morey's staff).

/** Today as YYYY-MM-DD in the user's local time. */
export function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
