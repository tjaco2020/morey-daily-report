// Shared TypeScript types used across the app.
// As schema evolves, regenerate strict types with:
//   npx supabase gen types typescript --project-id <REF> > types/database.ts

export type UserRole = "user" | "supervisor" | "manager";

export type ReportStatus =
  | "pending"
  | "submitted"
  | "included"
  | "locked"
  | "archived";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  display_order: number;
  active: boolean;
}

export interface Terminal {
  id: string;
  name: string;
  active: boolean;
  location_id?: string | null;
}

export interface Location {
  id: string;
  name: string;
  display_order: number;
  active: boolean;
}

export interface DailySession {
  id: string;
  user_id: string;
  session_date: string;        // YYYY-MM-DD
  scheduled_start: string | null;  // HH:MM:SS
  scheduled_end: string | null;
  terminal_id: string | null;
  login_at: string;
  logout_at: string | null;
}

export interface Report {
  id: string;
  case_number: string;
  user_id: string;
  category_id: string;
  terminal_id: string | null;
  report_date: string;
  text: string;
  status: ReportStatus;
  is_quick_pin: boolean;
  submitted_at: string | null;
  locked_at: string | null;
  archived_at: string | null;
  supervisor_notes: string | null;
  edited_by: string | null;
  edited_at: string | null;
  daily_report_id: string | null;
  created_at: string;
  updated_at: string;
}

// Convenience joined shapes
export interface ReportWithRefs extends Report {
  category?: { name: string } | null;
  terminal?: { name: string } | null;
  user?: { full_name: string | null; email: string } | null;
}
