import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Verify caller is a manager
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (callerProfile?.role !== "manager") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { email?: string; full_name?: string; role?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const fullName = (body.full_name ?? "").trim();
  const role = body.role ?? "user";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!["user", "supervisor", "manager"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const admin = createAdminSupabase();

  // Send invite email. Supabase creates the auth.users row immediately,
  // which fires our handle_new_user trigger and creates a profile row.
  const { data: invited, error: inviteErr } =
    await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
    });

  if (inviteErr || !invited?.user) {
    return NextResponse.json(
      { error: inviteErr?.message ?? "Invite failed" },
      { status: 500 },
    );
  }

  // If a non-default role was requested, update the profile.
  if (role !== "user") {
    const { error: roleErr } = await admin
      .from("profiles")
      .update({ role })
      .eq("id", invited.user.id);
    if (roleErr) {
      return NextResponse.json(
        {
          warning: "User invited but role couldn't be set.",
          error: roleErr.message,
          user_id: invited.user.id,
        },
        { status: 207 },
      );
    }
  }

  // Audit log
  await admin.from("audit_log").insert({
    actor_id: user.id,
    action: "admin.user_invited",
    entity_type: "profile",
    entity_id: invited.user.id,
    meta: { email, full_name: fullName, role },
  });

  return NextResponse.json({
    ok: true,
    user_id: invited.user.id,
    email,
  });
}
