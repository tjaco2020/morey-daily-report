import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/roles";
import Link from "next/link";
import { CategoriesClient } from "./CategoriesClient";

export const dynamic = "force-dynamic";

export default async function CategoriesAdminPage() {
  await requireRole("manager");
  const supabase = createServerSupabase();

  const { data: categories } = await supabase
    .from("categories")
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
          Categories
        </h1>
        <p className="text-sm text-morey-mid mt-1 mb-6">
          Categories that staff pick when logging a report. Order them by how
          often they&apos;re used.
        </p>
        <CategoriesClient
          initial={(categories ?? []).map((c) => ({
            id: c.id,
            name: c.name,
            display_order: c.display_order,
            active: c.active,
          }))}
        />
      </div>
    </main>
  );
}
