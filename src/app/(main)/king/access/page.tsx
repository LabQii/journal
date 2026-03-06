import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Clock, Activity, Sparkles, Eye } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { id } from "date-fns/locale";

export const metadata = {
    title: "Activity | C&C Journal",
};

export default async function AccessLogsPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) redirect("/login");

    const user = session.user as any;
    if (user.role !== "king") redirect("/");

    const logs = await prisma.accessLog.findMany({
        include: {
            user: { select: { name: true, username: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 5
    });

    const totalLogs = await prisma.accessLog.count();

    return (
        <div className="w-full min-h-[60vh] max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">

            {/* ── Header ── */}
            <div className="mb-10 sm:mb-14 text-center">
                {/* Glow orb behind icon */}
                <div className="relative inline-flex mb-5">
                    <div className="absolute inset-0 bg-rose-400/30 rounded-full blur-2xl scale-150 -z-10" />
                    <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-rose-200 to-pink-300 dark:from-rose-900/60 dark:to-pink-800/60 shadow-lg shadow-rose-300/30 dark:shadow-rose-900/30 border border-rose-200 dark:border-rose-700/40">
                        <Activity className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600 dark:text-rose-300" />
                    </div>
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
                    Riwayat Akses{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-primary dark:from-rose-400 dark:via-pink-300 dark:to-primary">
                        Queen
                    </span>
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground max-w-xs sm:max-w-sm mx-auto leading-relaxed">
                    5 kunjungan terakhir Queen ke website ini
                </p>

                {/* Total visits pill */}
                <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800/40">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{totalLogs} total kunjungan</span>
                </div>
            </div>

            {/* ── Log Cards ── */}
            {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 rounded-3xl border border-dashed border-border/60 text-muted-foreground bg-muted/20">
                    <Clock className="w-10 h-10 mb-3 opacity-20" />
                    <p className="font-medium text-sm">Belum ada riwayat</p>
                    <p className="text-xs mt-1 opacity-60">Queen belum membuka website ini.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3 sm:gap-4">
                    {logs.map((log: any, index: number) => {
                        const dateObj = new Date(log.createdAt);
                        const timeStr = formatInTimeZone(dateObj, "Asia/Jakarta", "HH:mm");
                        const dayStr = formatInTimeZone(dateObj, "Asia/Jakarta", "EEEE, d MMMM yyyy", { locale: id });
                        const displayName = log.user.name || log.user.username;
                        const isFirst = index === 0;

                        return (
                            <div
                                key={log.id}
                                className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border transition-all duration-300 group
                                    ${isFirst
                                        ? "border-rose-300/70 dark:border-rose-600/40 shadow-lg shadow-rose-200/40 dark:shadow-rose-900/20"
                                        : "border-border/60 hover:border-rose-200 dark:hover:border-rose-800/40 hover:shadow-md hover:shadow-rose-100/30 dark:hover:shadow-rose-900/10"
                                    }`}
                            >
                                {/* Background gradient layer */}
                                <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300
                                    ${isFirst
                                        ? "bg-gradient-to-br from-rose-50 via-pink-50 to-white dark:from-rose-950/40 dark:via-pink-950/30 dark:to-card opacity-100"
                                        : "bg-gradient-to-br from-card to-card opacity-100 group-hover:from-rose-50/50 dark:group-hover:from-rose-950/20"
                                    }`}
                                />

                                {/* Top highlight bar for the latest entry */}
                                {isFirst && (
                                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-400 via-pink-300 to-rose-400" />
                                )}

                                {/* Card content */}
                                <div className="relative flex items-center gap-4 sm:gap-5 px-4 sm:px-6 py-4 sm:py-5">

                                    {/* Rank orb */}
                                    <div className={`shrink-0 flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl font-bold text-sm transition-all duration-300
                                        ${isFirst
                                            ? "bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-md shadow-rose-300/40 dark:shadow-rose-700/30"
                                            : "bg-muted text-muted-foreground group-hover:bg-rose-100 dark:group-hover:bg-rose-900/30 group-hover:text-rose-600 dark:group-hover:text-rose-300"
                                        }`}>
                                        {isFirst ? <Sparkles className="w-4 h-4" /> : index + 1}
                                    </div>

                                    {/* Text info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
                                            <span className={`text-sm sm:text-base font-semibold leading-tight truncate
                                                ${isFirst ? "text-rose-700 dark:text-rose-200" : "text-foreground"}`}>
                                                {displayName}
                                            </span>
                                            {isFirst && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white uppercase tracking-wide">
                                                    Terbaru
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs sm:text-sm text-muted-foreground capitalize truncate">
                                            {dayStr}
                                        </p>
                                    </div>

                                    {/* Time pill — wraps to new line only on very small screens */}
                                    <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap
                                        ${isFirst
                                            ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-700/40"
                                            : "bg-muted text-muted-foreground"
                                        }`}>
                                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                        <span>{timeStr} WIB</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Footer note */}
            {logs.length > 0 && (
                <p className="mt-8 text-center text-xs text-muted-foreground/50">
                    Menampilkan {logs.length} dari {totalLogs} kunjungan
                </p>
            )}
        </div>
    );
}
