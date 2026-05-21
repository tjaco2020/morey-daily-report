import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/roles";
import Link from "next/link";
import { OutletsClient } from "./OutletsClient";

export const dynamic = "force-dynamic";

export default async function OutletsAdminPage() {
  await requireRole("manager");
  const supabase = createServerSupabase();

  const [{ data: outlets }, { data: departments }, { data: locations }] =
    await Promise.all([
      supabase
        .from("outlets")
        .select("id, name, department_id, location_id, display_order, active")
        .order("display_order"),
      supabase
        .from("departments")
        .select("id, name")
        .eq("active", true)
        .order("display_order"),
      supabase
        .from("locations")
        .select("id, name")
        .eq("active", true)
        .order("display_order"),
    ]);

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
          Outlets
        </h1>
        <p className="text-sm text-morey-mid mt-1 mb-6">
          Specific business units (a restaurant, a store, a ticket counter).
          Each belongs to a{" "}
          <Link href="/admin/departments" className="text-morey-ocean hover:underline">
            department
          </Link>{" "}
          and optionally a{" "}
          <Link href="/admin/locations" className="text-morey-ocean hover:underline">
            location
          </Link>
          .
        </p>
        <OutletsClient
          initial={(outlets ?? []).map((o) => ({
            id: o.id,
            name: o.name,
            department_id: o.department_id,
            location_id: o.location_id ?? null,
            display_order: o.display_order,
            active: o.active,
          }))}
          departments={(departments ?? []).map((d) => ({
            id: d.id,
            name: d.name,
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
