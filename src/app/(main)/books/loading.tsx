/**
 * Books loading skeleton — shown by Next.js App Router during server fetch.
 */
export default function BooksLoading() {
    return (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-10 mt-8 space-y-12 pb-20">
            {/* Hero skeleton */}
            <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-4">
                <div className="bg-muted animate-pulse rounded-full h-16 w-16 mb-4" />
                <div className="bg-muted animate-pulse rounded-2xl h-12 w-56" />
                <div className="bg-muted animate-pulse rounded-xl h-6 w-44" />
            </div>

            {/* Grid skeleton — matches grid-cols-2 md:3 lg:4 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                        {/* Book cover — aspect-[2/3] matches BookCard */}
                        <div className="aspect-[2/3] w-full rounded-2xl bg-muted animate-pulse" />
                        <div className="bg-muted animate-pulse rounded-lg h-5 w-3/4" />
                        <div className="bg-muted animate-pulse rounded-lg h-4 w-1/2" />
                    </div>
                ))}
            </div>
        </div>
    );
}
