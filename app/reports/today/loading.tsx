import { Skeleton } from "@/components/Skeleton";

export default function MyReportsLoading() {
  return (
    <main className="px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-3xl mx-auto">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-9 w-48 mb-3" />
        <Skeleton className="h-4 w-72 mb-6" />

        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-bubble" />
          ))}
        </div>
      </div>
    </main>
  );
}
