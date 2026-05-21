import { Skeleton } from "@/components/Skeleton";

export default function SupervisorLoading() {
  return (
    <main className="px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-10 w-48 mb-3" />
        <Skeleton className="h-4 w-80 mb-6" />

        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 rounded-bubble" />
          ))}
        </section>

        <Skeleton className="h-28 rounded-bubble mb-5" />

        <div className="bg-white rounded-bubble shadow-card border border-slate-100/80 p-4 space-y-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </div>
    </main>
  );
}
