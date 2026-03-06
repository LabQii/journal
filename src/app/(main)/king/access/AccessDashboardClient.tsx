"use client";

import { useEffect, useState } from "react";
import { Clock, Activity, Sparkles, Eye, Trash2, AlertTriangle } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { id as idLocale, enUS, ja } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AccessDashboardClient() {
    const { lang } = useLanguage();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/access");
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAll = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch("/api/access", { method: "DELETE" });
            if (res.ok) {
                setShowDeleteConfirm(false);
                fetchData(); // Refresh the list
            }
        } catch (error) {
            console.error("Failed to delete history:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // 15 seconds polling

        const handleFocus = () => fetchData();
        window.addEventListener("focus", handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener("focus", handleFocus);
        };
    }, []);

    const getLocale = () => {
        if (lang === "id") return idLocale;
        if (lang === "jp") return ja;
        return enUS;
    };

    const t = (key: string) => {
        const dict: Record<string, Record<string, string>> = {
            "title": { id: "Riwayat Akses", en: "Access History", jp: "アクセス履歴" },
            "subtitle": { id: "5 kunjungan terakhir Queen ke website ini", en: "Queen's last 5 visits to the website", jp: "Queenのウェブサイトへの過去5回の訪問" },
            "total_visits": { id: "total kunjungan", en: "total visits", jp: "総訪問数" },
            "online": { id: "Sedang Aktif", en: "Online", jp: "オンライン" },
            "offline": { id: "Tidak Aktif", en: "Offline", jp: "オフライン" },
            "no_history_title": { id: "Belum ada riwayat", en: "No history yet", jp: "履歴はまだありません" },
            "no_history_desc": { id: "Queen belum membuka website ini.", en: "Queen hasn't opened this website yet.", jp: "Queenはまだこのウェブサイトを開いていません。" },
            "latest": { id: "Terbaru", en: "Latest", jp: "最新" },
            "showing": { id: "Menampilkan", en: "Showing", jp: "表示中" },
            "of": { id: "dari", en: "of", jp: "中の" },
            "visits": { id: "kunjungan", en: "visits", jp: "訪問" },
            "delete_all": { id: "Hapus Semua Riwayat", en: "Delete All History", jp: "すべての履歴を削除" },
            "delete_confirm": { id: "Yakin ingin menghapus semua riwayat Queen?", en: "Are you sure you want to delete all Queen's history?", jp: "Queenのすべての履歴を削除してもよろしいですか？" },
            "cancel": { id: "Batal", en: "Cancel", jp: "キャンセル" },
            "yes_delete": { id: "Ya, Hapus", en: "Yes, Delete", jp: "はい、削除します" }
        };
        return dict[key][lang === "jp" ? "jp" : lang === "en" ? "en" : "id"] || key;
    };

    if (isLoading && !data) {
        return (
            <div className="w-full min-h-[60vh] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <Activity className="w-8 h-8 text-rose-300 mb-2" />
                    <p className="text-muted-foreground text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    const logs = data?.logs || [];
    const totalLogs = data?.totalLogs || 0;
    const isOnline = data?.isOnline || false;

    return (
        <div className="w-full min-h-[60vh] max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
            {/* ── Header ── */}
            <div className="mb-10 sm:mb-14 text-center">
                <div className="relative inline-flex mb-5">
                    <div className="absolute inset-0 bg-rose-400/30 rounded-full blur-2xl scale-150 -z-10" />
                    <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-rose-200 to-pink-300 dark:from-rose-900/60 dark:to-pink-800/60 shadow-lg shadow-rose-300/30 dark:shadow-rose-900/30 border border-rose-200 dark:border-rose-700/40">
                        <Activity className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600 dark:text-rose-300" />

                        {/* Real-time Online Indicator */}
                        <div className={`absolute -right-1 -bottom-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 sm:border-4 border-background flex items-center justify-center transition-colors duration-500 ${isOnline ? "bg-emerald-500" : "bg-neutral-400"}`}>
                            {isOnline && <div className="w-full h-full rounded-full bg-emerald-400 animate-ping opacity-60 absolute" />}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center mb-2">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        {t("title")}{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-primary dark:from-rose-400 dark:via-pink-300 dark:to-primary">
                            Queen
                        </span>
                    </h1>
                </div>

                <p className="text-sm sm:text-base text-muted-foreground max-w-xs sm:max-w-sm mx-auto leading-relaxed mb-4">
                    {t("subtitle")}
                </p>

                {/* Status Pills */}
                <div className="flex flex-wrap justify-center items-center gap-2 mt-4">
                    {/* Online Status Badge */}
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${isOnline
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40"
                        : "bg-neutral-100 dark:bg-neutral-900/40 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800/40"
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-neutral-400"}`} />
                        <span>{isOnline ? t("online") : t("offline")}</span>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800/40">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{totalLogs} {t("total_visits")}</span>
                    </div>
                </div>
            </div>

            {/* ── Log Cards ── */}
            {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 rounded-3xl border border-dashed border-border/60 text-muted-foreground bg-muted/20">
                    <Clock className="w-10 h-10 mb-3 opacity-20" />
                    <p className="font-medium text-sm">{t("no_history_title")}</p>
                    <p className="text-xs mt-1 opacity-60">{t("no_history_desc")}</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3 sm:gap-4">
                    {logs.map((log: any, index: number) => {
                        const dateObj = new Date(log.createdAt);
                        const timeStr = formatInTimeZone(dateObj, "Asia/Jakarta", "HH:mm");

                        // Handle Date format per language safely
                        let dateFmt = "EEEE, d MMMM yyyy";
                        if (lang === "en") dateFmt = "EEEE, MMMM d, yyyy";
                        if (lang === "jp") dateFmt = "yyyy年MM月dd日 (EEEE)";

                        const dayStr = formatInTimeZone(dateObj, "Asia/Jakarta", dateFmt, { locale: getLocale() });

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
                                                    {t("latest")}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs sm:text-sm text-muted-foreground capitalize truncate">
                                            {dayStr}
                                        </p>
                                    </div>

                                    {/* Time pill */}
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

            {/* Footer note & Actions */}
            {logs.length > 0 && (
                <div className="mt-8 flex flex-col items-center justify-center gap-4">
                    <p className="text-xs text-muted-foreground/50">
                        {t("showing")} {logs.length} {t("of")} {totalLogs} {t("visits")}
                    </p>

                    {showDeleteConfirm ? (
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 w-full sm:max-w-md rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <span className="text-sm font-semibold leading-tight text-center sm:text-left">{t("delete_confirm")}</span>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                    className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-xl text-muted-foreground hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    onClick={handleDeleteAll}
                                    disabled={isDeleting}
                                    className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors disabled:bg-red-300 disabled:text-red-50 flex items-center justify-center min-w-[100px]"
                                >
                                    {isDeleting ? <Activity className="w-4 h-4 animate-spin text-white" /> : t("yes_delete")}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-xs font-semibold group border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                        >
                            <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            {t("delete_all")}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
