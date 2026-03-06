/**
 * Notes loading skeleton — shown by Next.js App Router during server fetch.
 */
export default function NotesLoading() {
    return (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-10 flex flex-col md:flex-row gap-8 mt-8 pb-20">
            {/* Sidebar skeleton */}
            <aside className="w-full md:w-64 shrink-0">
                <div className="bg-card/50 border border-border rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="bg-muted animate-pulse rounded-xl h-10 w-full mb-4" />
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-muted animate-pulse rounded-xl h-9 w-full" />
                    ))}
                </div>
            </aside>

            {/* Content skeleton */}
            <div className="flex-1 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center gap-4">
                    <div className="bg-muted animate-pulse rounded-xl h-9 w-48" />
                    <div className="bg-muted animate-pulse rounded-full h-10 w-64" />
                </div>

                {/* Notes grid — matches grid-cols-1 md:2 xl:3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-card/40 border border-border rounded-2xl overflow-hidden">
                            {/* Thumbnail — aspect-video reserves layout space */}
                            <div className="aspect-video w-full bg-muted animate-pulse" />
                            <div className="p-4 space-y-3">
                                <div className="bg-muted animate-pulse rounded-full h-5 w-20" />
                                <div className="bg-muted animate-pulse rounded-lg h-5 w-full" />
                                <div className="bg-muted animate-pulse rounded-lg h-4 w-4/5" />
                                <div className="bg-muted animate-pulse rounded-lg h-4 w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
