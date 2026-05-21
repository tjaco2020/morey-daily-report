import { requireRole } from "@/lib/roles";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireRole("manager");
  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-morey-ocean hover:underline"
        >
          ← Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-morey-deep mt-2">Admin</h1>
        <p className="text-sm text-gray-500">Manager-only configuration.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <Tile
            title="Email recipients"
            desc="Who receives the Daily Report email."
            href="/admin/recipients"
            ready
          />
          <Tile
            title="Categories"
            desc="Categories shown in the report widget."
            href="/admin/categories"
            ready
          />
          <Tile
            title="Locations"
            desc="Pier-level groupings (Mariner's, Surfside, Adventure, Retail…)."
            href="/admin/locations"
            ready
          />
          <Tile
            title="Terminals"
            desc="POS terminals, each assigned to a location."
            href="/admin/terminals"
            ready
          />
          <Tile
            title="Users"
            desc="Invite users, assign roles, reset PINs."
            href="/admin/users"
            ready
          />
          <Tile
            title="Automation"
            desc="Toggle the 1AM lock + fallback report."
            href="/admin/automation"
            ready
          />
          <Tile
            title="Snowflake mappings"
            desc="Product category mapping + sync status."
            href="/admin/snowflake"
            ready
          />
          <Tile
            title="Embed widget"
            desc="Copy a snippet to drop the bubble into other internal tools."
            href="/admin/embed"
            ready
          />
        </div>
      </div>
    </main>
  );
}

function Tile({
  title,
  desc,
  href,
  ready,
  note,
}: {
  title: string;
  desc: string;
  href: string;
  ready: boolean;
  note?: string;
}) {
  const cls = ready
    ? "bg-white hover:bg-gray-50 cursor-pointer border-gray-200"
    : "bg-gray-50 cursor-not-allowed border-dashed border-gray-200";
  const inner = (
    <div className={`rounded-bubble shadow-sm border ${cls} p-5 h-full`}>
      <div className="text-base font-semibold text-morey-deep">
        {title}{" "}
        {!ready && note && (
          <span className="ml-2 text-xs text-gray-400 font-normal">
            ({note})
          </span>
        )}
      </div>
      <div className="text-sm text-gray-500 mt-1">{desc}</div>
    </div>
  );
  return ready ? <Link href={href}>{inner}</Link> : inner;
}
