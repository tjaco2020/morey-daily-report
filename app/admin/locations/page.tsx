import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/roles";
import Link from "next/link";
import { LocationsClient } from "./LocationsClient";

export const dynamic = "force-dynamic";

export default async function LocationsAdminPage() {
  await requireRole("manager");
  const supabase = createServerSupabase();

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, display_order, active")
    .order("display_order");

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
          Locations
        </h1>
        <p className="text-sm text-morey-mid mt-1 mb-6">
          Pier-level groupings for terminals (e.g. Mariner&apos;s Pier groups
          GS61–63). Supervisors use locations to filter reports to their area.
        </p>
        <LocationsClient
          initial={(locations ?? []).map((l) => ({
            id: l.id,
            name: l.name,
            display_order: l.display_order,
            active: l.active,
          }))}
        />
      </div>
    </main>
  );
}
