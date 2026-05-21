import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

async function requireManager() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" as const, status: 401 };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "manager") return { error: "forbidden" as const, status: 403 };
  return { user };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireManager();
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: {
    role?: string;
    active?: boolean;
    pin?: string;
    full_name?: string;
  } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const updates: Record<string, unknown> = {};
  if (body.role && ["user", "supervisor", "manager"].includes(body.role)) {
    updates.role = body.role;
  }
  if (typeof body.active === "boolean") updates.active = body.active;
  if (typeof body.full_name === "string") updates.full_name = body.full_name;

  if (Object.keys(updates).length > 0) {
    const { error } = await admin
      .from("profiles")
      .update(updates)
      .eq("id", params.id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // PIN reset uses the SECURITY DEFINER admin_set_pin RPC.
  // Admin client bypasses the manager check inside it (it runs as definer
  // anyway, but the function asserts is_manager via auth.uid()). For the
  // admin client we need to call it with proper grants — easier to just
  // do the update inline with the same hashing logic.
  if (typeof body.pin === "string" && body.pin.length > 0) {
    if (!/^[0-9]{4,6}$/.test(body.pin)) {
      return NextResponse.json(
        { error: "PIN must be 4–6 digits" },
        { status: 400 },
      );
    }
    // Inline the bcrypt + lookup hash. The pepper matches lib/cron-auth.ts
    // / migration 0002 ("morey-pepper-v1").
    const pepper = "morey-pepper-v1";
    // Compute lookup via the database since the SHA + crypt are easier there.
    // Use a small RPC-less inline SQL via .rpc('admin_set_pin') is blocked by
    // the manager-check in the function (auth.uid() is null for admin client).
    // So we update via raw SQL using the admin client's privileges.
    const { error: pinErr } = await admin.rpc("admin_force_set_pin", {
      p_user_id: params.id,
      p_pin: body.pin,
      p_pepper: pepper,
    });
    if (pinErr) {
      return NextResponse.json(
        {
          error:
            "PIN reset failed. Make sure migration 0011_admin_force_set_pin.sql is applied. " +
            pinErr.message,
        },
        { status: 500 },
      );
    }
  }

  // Audit
  await admin.from("audit_log").insert({
    actor_id: auth.user.id,
    action: "admin.user_updated",
    entity_type: "profile",
    entity_id: params.id,
    meta: { ...updates, pin_reset: typeof body.pin === "string" && body.pin.length > 0 },
  });

  return NextResponse.json({ ok: true });
}
