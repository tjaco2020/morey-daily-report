import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/roles";
import Link from "next/link";
import { TerminalsClient } from "./TerminalsClient";

export const dynamic = "force-dynamic";

export default async function TerminalsAdminPage() {
  await requireRole("manager");
  const supabase = createServerSupabase();

  const [{ data: terminals }, { data: locations }] = await Promise.all([
    supabase
      .from("terminals")
      .select("id, name, active, location_id")
      .order("name"),
    supabase
      .from("locations")
      .select("id, name, display_order, active")
      .eq("active", true)
      .order("display_order"),
  ]);

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
          Terminals
        </h1>
        <p className="text-sm text-morey-mid mt-1 mb-6">
          POS terminals and locations staff can pick at clock-in. Assign each
          to a <Link href="/admin/locations" className="text-morey-ocean hover:underline">location</Link>{" "}
          (pier or store) so supervisors can filter their area.
        </p>
        <TerminalsClient
          initial={(terminals ?? []).map((t) => ({
            id: t.id,
            name: t.name,
            active: t.active,
            location_id: t.location_id ?? null,
          }))}
          locations={(locations ?? []).map((l) => ({
            id: l.id,
            name: l.name,
          }))}
        />
      </div>
    </main>
  );
}
