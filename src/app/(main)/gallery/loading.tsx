/**
 * Gallery loading skeleton — shown by Next.js App Router while the
 * Server Component fetches data. Users see structure immediately
 * instead of a blank white screen, eliminating the perceived LCP delay.
 */
export default function GalleryLoading() {
    return (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-10 mt-8 space-y-12 pb-20">
            {/* Hero skeleton */}
            <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-4">
                <div className="bg-muted animate-pulse rounded-full h-16 w-16 mb-4" />
                <div className="bg-muted animate-pulse rounded-2xl h-12 w-64" />
                <div className="bg-muted animate-pulse rounded-xl h-6 w-48" />
            </div>

            {/* Grid skeleton — matches grid-cols-1 sm:2 md:3 lg:4 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="aspect-square w-full rounded-2xl bg-muted animate-pulse" />
                ))}
            </div>
        </div>
    );
}
