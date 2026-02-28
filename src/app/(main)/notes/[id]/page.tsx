"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, ExternalLink, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Note {
    id: string;
    title: string;
    content: string;
    url: string | null;
    createdAt: string;
}

export default function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { lang } = useLanguage();
    const [note, setNote] = useState<Note | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNote = async () => {
            try {
                const res = await fetch(`/api/notes`);
                if (res.ok) {
                    const notes: Note[] = await res.json();
                    const foundNote = notes.find(n => n.id === resolvedParams.id);
                    if (foundNote) setNote(foundNote);
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
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-card/60">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" /> {new Date(note.createdAt).toLocaleDateString(lang === "id" ? "id-ID" : lang === "jp" ? "ja-JP" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                    </div>
                    {note.url && (
                        <a
                            href={note.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent text-sm font-medium rounded-lg hover:bg-accent/20 transition-colors"
                        >
                            <ExternalLink className="h-4 w-4" /> {lang === "id" ? "Buka Tautan" : lang === "jp" ? "リンクを開く" : "Open Link"}
                        </a>
                    )}
                </div>

                <div className="p-6 md:p-10">
                    <div className="space-y-8">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
                            {note.title}
                        </h1>
                        <div className="prose prose-pink max-w-none text-lg leading-loose text-foreground/90 whitespace-pre-wrap font-serif">
                            {note.content}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
