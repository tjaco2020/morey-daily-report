import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/roles";
import Link from "next/link";

export const dynamic = "force-dynamic";

function configured(): boolean {
  return Boolean(
    process.env.SNOWFLAKE_ACCOUNT &&
      process.env.SNOWFLAKE_USER &&
      process.env.SNOWFLAKE_PASSWORD &&
      process.env.SNOWFLAKE_WAREHOUSE &&
      process.env.SNOWFLAKE_DATABASE &&
      process.env.SNOWFLAKE_SCHEMA,
  );
}

export default async function SnowflakeAdminPage() {
  await requireRole("manager");
  const supabase = createServerSupabase();

  const { data: logs } = await supabase
    .from("snowflake_query_logs")
    .select(
      "id, query_label, query_date, source, status, duration_ms, rows_returned, error_message, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: mappings } = await supabase
    .from("product_category_mappings")
    .select("source_category, display_name, display_order, active")
    .order("display_order");

  const isReal = configured();

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="max-w-3xl mx-auto">
        <Link href="/admin" className="text-sm text-morey-ocean hover:underline">
          ← Admin
        </Link>
        <h1 className="text-3xl font-bold text-morey-deep mt-2">
          Snowflake
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Status of the daily metrics integration.
        </p>

        <section className="bg-white rounded-bubble shadow p-5 mb-5">
          <h2 className="text-lg font-semibold text-morey-deep mb-2">
            Connection
          </h2>
          {isReal ? (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
              Snowflake credentials are present in environment. Real queries
              will run when supervisors fetch metrics.
            </p>
          ) : (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
              No Snowflake credentials set. The system is running in{" "}
              <b>demo mode</b> — deterministic placeholder numbers per date.
              Add <code>SNOWFLAKE_ACCOUNT</code>,{" "}
              <code>SNOWFLAKE_USER</code>, <code>SNOWFLAKE_PASSWORD</code>,{" "}
              <code>SNOWFLAKE_WAREHOUSE</code>,{" "}
              <code>SNOWFLAKE_DATABASE</code>, and{" "}
              <code>SNOWFLAKE_SCHEMA</code> to <code>.env.local</code> when
              ready (Phase 6B).
            </p>
          )}
        </section>

        <section className="bg-white rounded-bubble shadow p-5 mb-5">
          <h2 className="text-lg font-semibold text-morey-deep mb-2">
            Category mappings ({mappings?.length ?? 0})
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Editable management UI arrives in Phase 7. For now you can edit
            these directly in Supabase →{" "}
            <code>public.product_category_mappings</code>.
          </p>
          {mappings && mappings.length > 0 && (
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left py-1">Source category</th>
                  <th className="text-left py-1">Display name</th>
                  <th className="text-right py-1">Order</th>
                  <th className="text-right py-1">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mappings.map((m, i) => (
                  <tr key={i}>
                    <td className="py-1 font-mono text-xs">
                      {m.source_category}
                    </td>
                    <td className="py-1">{m.display_name}</td>
                    <td className="py-1 text-right">{m.display_order}</td>
                    <td className="py-1 text-right">
                      {m.active ? "yes" : "no"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="bg-white rounded-bubble shadow p-5">
          <h2 className="text-lg font-semibold text-morey-deep mb-2">
            Recent query log ({logs?.length ?? 0})
          </h2>
          {!logs || logs.length === 0 ? (
            <p className="text-sm text-gray-500">No queries yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {logs.map((l) => (
                <li key={l.id} className="py-2 flex items-center gap-3">
                  <span
                    className={`text-[10px] uppercase px-2 py-0.5 rounded ${
                      l.status === "success"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {l.status}
                  </span>
                  <span className="text-xs text-gray-500 w-32 shrink-0">
                    {new Date(l.created_at).toLocaleString()}
                  </span>
                  <span className="font-mono text-xs">{l.query_label}</span>
                  <span className="text-xs text-gray-500">
                    {l.query_date}
                  </span>
                  <span className="text-[10px] text-gray-400 ml-auto">
                    {l.source} · {l.duration_ms}ms · rows:{" "}
                    {l.rows_returned ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
