import { Skeleton } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <main className="px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-10 w-72 mb-3" />
        <Skeleton className="h-4 w-96 mb-8" />

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-bubble" />
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-bubble shadow-card border border-slate-100/80 p-5 space-y-3">
            <Skeleton className="h-5 w-48" />
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
          <aside className="space-y-3">
            <Skeleton className="h-32 rounded-bubble" />
            <Skeleton className="h-40 rounded-bubble" />
          </aside>
        </div>
      </div>
    </main>
  );
}
