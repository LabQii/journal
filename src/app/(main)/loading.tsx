/**
 * Home loading skeleton — shown by Next.js App Router during server fetch.
 */
export default function HomeLoading() {
    return (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-10 mt-8 space-y-16 pb-20">
            {/* Greeting Skeleton */}
            <div className="flex flex-col items-center text-center space-y-4 pt-10">
                <div className="bg-muted animate-pulse rounded-full h-16 w-16 mb-4" />
                <div className="bg-muted animate-pulse rounded-2xl h-10 w-64" />
                <div className="bg-muted animate-pulse rounded-xl h-5 w-48" />
            </div>

            {/* Books Skeleton */}
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="bg-muted animate-pulse rounded-xl h-8 w-40" />
                    <div className="bg-muted animate-pulse rounded-lg h-6 w-24" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                            <div className="aspect-[2/3] w-full rounded-2xl bg-muted animate-pulse" />
                            <div className="bg-muted animate-pulse rounded-lg h-5 w-3/4" />
                            <div className="bg-muted animate-pulse rounded-lg h-4 w-1/2" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Notes Skeleton */}
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="bg-muted animate-pulse rounded-xl h-8 w-32" />
                    <div className="bg-muted animate-pulse rounded-lg h-6 w-24" />
                </div>
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="w-full h-32 rounded-2xl bg-muted animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    );
}
