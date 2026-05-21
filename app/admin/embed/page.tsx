import { requireRole } from "@/lib/roles";
import Link from "next/link";
import { EmbedClient } from "./EmbedClient";

export const dynamic = "force-dynamic";

export default async function EmbedAdminPage() {
  await requireRole("manager");
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
          Embed widget
        </h1>
        <p className="text-sm text-morey-mid mt-1 mb-6">
          Paste this snippet into the footer of any internal Morey&apos;s site.
          A yellow bubble appears in the bottom-right corner; staff can click
          it to log a report with their PIN, without leaving the page they&apos;re on.
        </p>

        <EmbedClient />
      </div>
    </main>
  );
}
