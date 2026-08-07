import { Skeleton } from "@/components/ui/skeleton";

export function MediaCardSkeleton({
  layout = "rail",
}: {
  layout?: "grid" | "rail";
} = {}) {
  return (
    <div
      className={
        layout === "grid"
          ? "w-full min-w-0"
          : "w-[155px] shrink-0 sm:w-[190px] lg:w-[215px]"
      }
    >
      <Skeleton className="aspect-[2/3] w-full rounded-2xl bg-white/10" />
      <Skeleton className="mt-3 h-4 w-[80%] rounded-full bg-white/10" />
      <Skeleton className="mt-2 h-3 w-1/2 rounded-full bg-white/10" />
    </div>
  );
}

export function MediaRowSkeleton({
  title,
  subtitle,
  count = 8,
}: {
  title: string;
  subtitle: string;
  count?: number;
}) {
  return (
    <section className="safe-page-left mb-16">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
      <div className="safe-page-right hide-scrollbar mt-6 flex gap-4 overflow-x-auto pb-8 sm:gap-5">
        {Array.from({ length: count }, (_, index) => (
          <MediaCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

export function FeaturedHeroSkeleton() {
  return (
    <section className="safe-page-x relative flex min-h-[78vh] items-end overflow-hidden pb-20 supports-[height:100svh]:min-h-[78svh] lg:min-h-[88vh] lg:pb-28 supports-[height:100svh]:lg:min-h-[88svh]">
      <Skeleton className="absolute inset-0 rounded-none bg-white/5" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-black/20" />
      <div className="relative max-w-2xl space-y-5">
        <Skeleton className="h-3 w-36 rounded-full bg-white/15" />
        <Skeleton className="h-14 w-72 max-w-full rounded-xl bg-white/15 sm:h-20 sm:w-[28rem]" />
        <Skeleton className="h-4 w-full max-w-xl rounded-full bg-white/10" />
        <Skeleton className="h-4 w-[80%] max-w-lg rounded-full bg-white/10" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-12 w-40 rounded-full bg-white/15" />
          <Skeleton className="h-12 w-36 rounded-full bg-white/10" />
        </div>
      </div>
      <div className="safe-page-x absolute inset-x-0 bottom-6 z-10 flex justify-center gap-2 sm:bottom-8 lg:bottom-10 lg:justify-start">
        <Skeleton className="h-2 w-7 rounded-full bg-white/20" />
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-2 w-2 rounded-full bg-white/10" />
        ))}
      </div>
    </section>
  );
}

export function SearchGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {Array.from({ length: count }, (_, index) => (
        <MediaCardSkeleton key={index} layout="grid" />
      ))}
    </div>
  );
}
