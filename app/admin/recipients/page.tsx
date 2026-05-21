import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/roles";
import Link from "next/link";
import { RecipientsClient } from "./RecipientsClient";

export const dynamic = "force-dynamic";

export default async function RecipientsPage() {
  await requireRole("manager");
  const supabase = createServerSupabase();

  const { data: recipients } = await supabase
    .from("email_recipients")
    .select("id, name, email, active, created_at")
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/admin"
          className="text-sm text-morey-ocean hover:underline"
        >
          ← Admin
        </Link>
        <h1 className="text-3xl font-bold text-morey-deep mt-2">
          Email recipients
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          These addresses receive the Daily Report email. Deactivate to stop
          sending without deleting.
        </p>

        <RecipientsClient
          initial={(recipients ?? []).map((r) => ({
            id: r.id,
            name: r.name ?? "",
            email: r.email,
            active: r.active,
          }))}
        />
      </div>
    </main>
  );
}
