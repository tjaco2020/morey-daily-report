import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/roles";
import Link from "next/link";
import { DepartmentsClient } from "./DepartmentsClient";

export const dynamic = "force-dynamic";

export default async function DepartmentsAdminPage() {
  await requireRole("manager");
  const supabase = createServerSupabase();

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, description, display_order, active")
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
          Departments
        </h1>
        <p className="text-sm text-morey-mid mt-1 mb-6">
          Functional groupings for outlets. Each outlet belongs to one
          department. Examples: Admissions, F&amp;B, Retail.
        </p>
        <DepartmentsClient
          initial={(departments ?? []).map((d) => ({
            id: d.id,
            name: d.name,
            description: d.description ?? "",
            display_order: d.display_order,
            active: d.active,
          }))}
        />
      </div>
    </main>
  );
}
