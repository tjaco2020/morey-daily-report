import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * CSV export of the supervisor report list (same filters as the dashboard URL).
 * Auth: supervisor or manager only (RLS handles it; we also short-circuit).
 */
export async function GET(request: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Verify supervisor+ role.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || (profile.role !== "supervisor" && profile.role !== "manager")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const date = sp.get("date");
  const status = sp.get("status");
  const categoryId = sp.get("category");
  const terminalId = sp.get("terminal");
  const locationId = sp.get("location");
  const userId = sp.get("user");
  const keyword = (sp.get("q") ?? "").trim();

  let q = supabase
    .from("reports")
    .select(
      `case_number, status, text, submitted_at, created_at, report_date,
       categories(name), terminals(name),
       profiles!reports_user_id_fkey(full_name, email)`,
    )
    .order("created_at", { ascending: false });

  if (date) q = q.eq("report_date", date);
  if (status) q = q.eq("status", status);
  if (categoryId) q = q.eq("category_id", categoryId);
  if (terminalId) q = q.eq("terminal_id", terminalId);
  if (locationId) q = q.eq("terminal_location_id", locationId);
  if (userId) q = q.eq("user_id", userId);
  if (keyword) {
    const safe = keyword.replace(/[%_]/g, "");
    q = q.or(`text.ilike.%${safe}%,case_number.ilike.%${safe}%`);
  }

  const { data: rows, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build CSV
  const header = [
    "case_number",
    "report_date",
    "created_at",
    "submitted_at",
    "user",
    "category",
    "terminal",
    "status",
    "text",
  ];

  const escape = (val: unknown) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (/[",\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [header.join(",")];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (rows ?? []).forEach((r: any) => {
    lines.push(
      [
        r.case_number,
        r.report_date,
        r.created_at,
        r.submitted_at,
        r.profiles?.full_name ?? r.profiles?.email ?? "",
        r.categories?.name ?? "",
        r.terminals?.name ?? "",
        r.status,
        r.text,
      ]
        .map(escape)
        .join(","),
    );
  });

  const csv = lines.join("\n");
  const fname = `morey-reports-${date ?? "all"}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fname}"`,
      "Cache-Control": "no-store",
    },
  });
}
