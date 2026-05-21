import { Skeleton } from "@/components/Skeleton";

export default function BuilderLoading() {
  return (
    <main className="px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto space-y-5">
        <div>
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>

        <Skeleton className="h-28 rounded-bubble" />

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-bubble" />
          ))}
        </section>

        <Skeleton className="h-12 rounded-bubble" />

        <div className="bg-white rounded-bubble shadow-card border border-slate-100/80 p-4 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    </main>
  );
}
