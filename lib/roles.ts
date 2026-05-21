import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types";

/**
 * Server-side helper: confirm the current user has at least the given role.
 * Redirects to /login if unauthenticated, or to /dashboard if under-privileged.
 * Returns the userId and role on success.
 */
export async function requireRole(
  min: UserRole,
): Promise<{ userId: string; role: UserRole }> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "user") as UserRole;
  const ranks: Record<UserRole, number> = { user: 0, supervisor: 1, manager: 2 };
  if (ranks[role] < ranks[min]) {
    redirect("/dashboard");
  }

  return { userId: user.id, role };
}
