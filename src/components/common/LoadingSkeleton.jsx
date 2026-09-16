/**
 * LoadingSkeleton.jsx
 * ---------------------------------------------------------------------------
 * Placeholder shown while `GET /today` is in flight. Pure presentation, no
 * props needed — it never has to reflect real data by definition.
 */
function SkeletonCard() {
  return (
    <div className="bg-paper-card border border-sepia-border border-l-[6px] border-l-sepia-dark/40 p-4 md:p-5 rounded-sharp warm-card-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="space-y-2.5 flex-1">
        <div className="flex gap-3">
          <div className="h-4 w-28 animate-warm-pulse rounded-sharp" />
          <div className="h-4 w-44 animate-warm-pulse rounded-sharp" />
        </div>
        <div className="h-6 w-3/4 animate-warm-pulse rounded-sharp" />
        <div className="h-4 w-1/2 animate-warm-pulse rounded-sharp" />
      </div>
      <div className="flex gap-2 shrink-0">
        <div className="h-8 w-32 animate-warm-pulse rounded-sharp" />
        <div className="h-8 w-24 animate-warm-pulse rounded-sharp" />
      </div>
    </div>
  );
}

export default function LoadingSkeleton() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 py-8">
      <div className="space-y-4">
        <div className="flex items-baseline justify-between pb-2 border-b-2 border-sepia-border/60">
          <div className="flex items-center gap-3">
            <div className="h-6 w-8 animate-warm-pulse rounded-sharp" />
            <div className="h-6 w-52 animate-warm-pulse rounded-sharp" />
          </div>
          <div className="h-4 w-32 animate-warm-pulse rounded-sharp" />
        </div>
        <div className="grid grid-cols-1 gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
