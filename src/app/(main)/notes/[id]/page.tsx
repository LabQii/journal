"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, ExternalLink, Loader2, Crown, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CommentsSection } from "@/components/notes/CommentsSection";

interface Note {
    id: string;
    title: string;
    content: string;
    url: string | null;
    category?: string;
    createdAt: string;
    user?: { username: string; role: "king" | "queen" } | null;
    _count?: { comments: number };
}

export default function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { lang } = useLanguage();
    const [note, setNote] = useState<Note | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNote = async () => {
            try {
                const res = await fetch(`/api/notes/${resolvedParams.id}`);
                if (res.ok) {
                    setNote(await res.json());
                } else {
                    const allRes = await fetch(`/api/notes`);
                    if (allRes.ok) {
                        const notes: Note[] = await allRes.json();
                        const foundNote = notes.find(n => n.id === resolvedParams.id);
                        if (foundNote) setNote(foundNote);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch note:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNote();
    }, [resolvedParams.id]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-32 min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!note) {
        return (
            <div className="w-full max-w-4xl mx-auto px-4 md:px-6 lg:px-10 py-20 text-center min-h-screen">
                <h1 className="text-2xl font-bold mb-4">{lang === "id" ? "Catatan tidak ditemukan" : lang === "jp" ? "ノートが見つかりません" : "Note not found"}</h1>
                <Link href="/notes" className="text-primary hover:underline">{lang === "id" ? "Kembali ke Catatan" : lang === "jp" ? "ノートに戻る" : "Return to Notes"}</Link>
            </div>
        );
    }

    const authorInitial = note.user?.username?.charAt(0).toUpperCase() ?? "?";
    const isKing = note.user?.role === "king";
    const formattedDate = new Date(note.createdAt).toLocaleDateString(
        lang === "id" ? "id-ID" : lang === "jp" ? "ja-JP" : "en-US",
        { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto px-4 md:px-6 lg:px-10 mt-8 space-y-8 min-h-screen pb-20"
        >
            <Link href="/notes" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                {lang === "id" ? "Kembali ke Catatan" : lang === "jp" ? "ノートに戻る" : "Back to Notes"}
            </Link>

            <div className="bg-card/40 backdrop-blur-sm border border-border rounded-3xl overflow-hidden shadow-sm">
                {/* Top meta bar */}
                <div className="px-6 py-3 border-b border-border/60 flex justify-between items-center bg-card/60 flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 opacity-70" />
                        {new Date(note.createdAt).toLocaleDateString(
                            lang === "id" ? "id-ID" : lang === "jp" ? "ja-JP" : "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                        )}
                        {(note._count?.comments ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 ml-2 bg-muted border border-border/60 px-2 py-0.5 rounded-full font-medium">
                                <MessageCircle className="h-3 w-3" />
                                {note._count!.comments}
                            </span>
                        )}
                    </div>
                    {note.url && (
                        <a
                            href={note.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent text-xs font-medium rounded-lg hover:bg-accent/20 transition-colors"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {lang === "id" ? "Buka Tautan" : lang === "jp" ? "リンクを開く" : "Open Link"}
                        </a>
                    )}
                </div>

                <div className="p-6 md:p-10">
                    <div className="space-y-8">
                        {/* Title */}
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
                            {note.title}
                        </h1>

                        {/* ─── Elegant Author Card ─── */}
                        {note.user && (
                            <div className={`flex items-center gap-4 p-4 rounded-2xl border ${isKing
                                ? "bg-amber-50/60 dark:bg-amber-900/10 border-amber-200/60 dark:border-amber-800/30"
                                : "bg-rose-50/60 dark:bg-rose-900/10 border-rose-200/60 dark:border-rose-800/30"
                                }`}>
                                {/* Avatar ring */}
                                <div className={`relative flex-shrink-0 w-11 h-11 rounded-full ring-2 ring-offset-2 ring-offset-background flex items-center justify-center font-bold text-base text-white ${isKing
                                    ? "bg-gradient-to-br from-amber-400 to-amber-600 ring-amber-400"
                                    : "bg-gradient-to-br from-rose-400 to-pink-600 ring-rose-400"
                                    }`}>
                                    {authorInitial}
                                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${isKing ? "bg-amber-500" : "bg-rose-500"}`}>
                                        <Crown className="h-2.5 w-2.5 text-white" />
                                    </span>
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-foreground leading-none mb-0.5">{note.user.username}</p>
                                    <p className={`text-xs font-medium capitalize ${isKing ? "text-amber-600 dark:text-amber-400" : "text-rose-500 dark:text-rose-400"}`}>
                                        {note.user.role} · {formattedDate}
                                    </p>
                                </div>
                                {/* Role pill */}
                                <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0 ${isKing
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                    }`}>
                                    <Crown className="h-2.5 w-2.5" />
                                    {note.user.role}
                                </span>
                            </div>
                        )}

                        {/* Content */}
                        <div className="prose prose-pink max-w-none text-lg leading-loose text-foreground/90 whitespace-pre-wrap font-serif">
                            {note.content}
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments section */}
            <CommentsSection noteId={resolvedParams.id} />
        </motion.div>
    );
}
