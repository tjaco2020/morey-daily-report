import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/roles";
import Link from "next/link";
import { ShareGroupsClient } from "./ShareGroupsClient";

export const dynamic = "force-dynamic";

export default async function ShareGroupsPage() {
  await requireRole("manager");
  const supabase = createServerSupabase();

  const { data: groups } = await supabase
    .from("share_groups")
    .select("id, name, description, active")
    .order("name");

  const { data: members } = await supabase
    .from("share_group_members")
    .select("id, group_id, email, name, active")
    .order("email");

  return (
    <main className="px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/admin"
          className="text-sm text-morey-ocean hover:text-morey-deep transition"
        >
          ← Admin
        </Link>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-morey-deep mt-2">
          Share groups
        </h1>
        <p className="text-sm text-morey-mid mt-1 mb-6">
          Reusable email distribution lists for the Share button on reports.
          Examples: <em>Supervisors</em>, <em>POS / RocketRez Team</em>,{" "}
          <em>Pier Managers</em>.
        </p>
        <ShareGroupsClient
          initialGroups={(groups ?? []).map((g) => ({
            id: g.id,
            name: g.name,
            description: g.description ?? "",
            active: g.active,
          }))}
          initialMembers={(members ?? []).map((m) => ({
            id: m.id,
            group_id: m.group_id,
            email: m.email,
            name: m.name ?? "",
            active: m.active,
          }))}
        />
      </div>
    </main>
  );
}
