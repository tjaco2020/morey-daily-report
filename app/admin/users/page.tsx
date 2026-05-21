import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/roles";
import Link from "next/link";
import { UsersClient } from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireRole("manager");
  const supabase = createServerSupabase();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, active, created_at")
    .order("created_at", { ascending: true });

  return (
    <main className="px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin"
          className="text-sm text-morey-ocean hover:text-morey-deep transition"
        >
          ← Admin
        </Link>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-morey-deep mt-2">
          Users
        </h1>
        <p className="text-sm text-morey-mid mt-1 mb-6">
          Invite staff by email, change roles, reset PINs, deactivate.
        </p>
        <UsersClient
          initial={(users ?? []).map((u) => ({
            id: u.id,
            email: u.email,
            full_name: u.full_name ?? "",
            role: u.role as "user" | "supervisor" | "manager",
            active: u.active,
            created_at: u.created_at,
          }))}
        />
      </div>
    </main>
  );
}
