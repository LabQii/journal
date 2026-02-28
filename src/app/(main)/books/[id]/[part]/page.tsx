"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowLeft, ArrowRight, Settings2, BookOpen, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Part {
    id: string;
    title: string;
    content: string;
    partNumber: number;
    bookId: string;
    createdAt: string;
}

interface Book {
    id: string;
    title: string;
    description: string;
    author: string;
    cover: string | null;
    createdAt: string;
    parts: Part[];
}

export default function BookPartPage({ params }: { params: Promise<{ id: string; part: string }> }) {
    const resolvedParams = use(params);
    const { lang } = useLanguage();
    const [book, setBook] = useState<Book | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const [fontSize, setFontSize] = useState("text-lg");
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchBook();
    }, [resolvedParams.id, resolvedParams.part]);

    const fetchBook = async () => {
        try {
            const res = await fetch(`/api/books/${resolvedParams.id}`);
            if (res.ok) {
                const data = await res.json();
                setBook(data);
            }
        } catch (error) {
            console.error("Failed to fetch book:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-32 min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const partIndex = book?.parts?.findIndex(p => p.id === resolvedParams.part) ?? -1;
    const part = book?.parts?.[partIndex];

    if (!book || !part) {
        return (
            <div className="w-full max-w-2xl mx-auto px-4 md:px-6 lg:px-10 py-20 text-center min-h-screen">
                <h1 className="text-2xl font-bold mb-4">{lang === "id" ? "Bab tidak ditemukan" : lang === "jp" ? "章が見つかりません" : "Chapter not found"}</h1>
                <Link href={`/books/${resolvedParams.id}`} className="text-primary hover:underline">{lang === "id" ? "Kembali ke Buku" : lang === "jp" ? "本に戻る" : "Return to Book"}</Link>
            </div>
        );
    }

    const prevPart = partIndex > 0 ? book.parts[partIndex - 1] : null;
    const nextPart = partIndex < book.parts.length - 1 ? book.parts[partIndex + 1] : null;

    return (
        <div className="bg-background min-h-screen relative font-serif">
            {/* Reading Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-primary origin-left z-50"
                style={{ scaleX }}
            />

            {/* Top Navigation */}
            <div className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-border/50 py-3 px-4 font-sans transition-all">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link href={`/books/${book.id}`} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
                        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden sm:inline">{book.title}</span>
                        <span className="sm:hidden">{lang === "id" ? "Kembali" : lang === "jp" ? "戻る" : "Back"}</span>
                    </Link>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative"
                        >
                            <Settings2 className="h-5 w-5" />
                        </button>

                    </div>
                </div>

                {/* Reading Settings Popup */}
                {showSettings && (
                    <div className="absolute right-4 top-14 bg-card border border-border rounded-xl shadow-lg p-4 w-64 z-50">
                        <h4 className="text-sm font-bold mb-3 border-b border-border pb-2">{lang === "id" ? "Pengaturan Membaca" : lang === "jp" ? "読書設定" : "Reading Settings"}</h4>
                        <div className="space-y-4">
                            <div>
                                <span className="text-xs text-muted-foreground mb-2 block">{lang === "id" ? "Ukuran Teks" : lang === "jp" ? "文字サイズ" : "Text Size"}</span>
                                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
                                    <button onClick={() => setFontSize("text-base")} className={`flex-1 py-1 rounded-md text-sm ${fontSize === "text-base" ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>A</button>
                                    <button onClick={() => setFontSize("text-lg")} className={`flex-1 py-1 rounded-md text-base ${fontSize === "text-lg" ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>A</button>
                                    <button onClick={() => setFontSize("text-xl")} className={`flex-1 py-1 rounded-md text-lg ${fontSize === "text-xl" ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>A</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <motion.article
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl mx-auto px-6 py-12 md:py-20"
            >
                <div className="text-center mb-16 space-y-4 font-sans">
                    <span className="text-accent font-bold tracking-widest text-sm uppercase">{lang === "id" ? "Bab" : lang === "jp" ? "章" : "Chapter"} {partIndex + 1}</span>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
                        {part.title}
                    </h1>
                    <div className="w-16 h-1 bg-primary/30 mx-auto rounded-full mt-6"></div>
                </div>

                <div className={`prose prose-pink max-w-none ${fontSize} leading-loose text-foreground/90 whitespace-pre-wrap`}>
                    {part.content}


                </div>

                {/* Chapter Navigation */}
                <div className="mt-20 pt-10 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
                    {prevPart ? (
                        <Link
                            href={`/books/${book.id}/${prevPart.id}`}
                            className="flex items-center group px-6 py-4 rounded-2xl hover:bg-muted/50 transition-colors w-full sm:w-auto"
                        >
                            <div className="h-10 w-10 shrink-0 rounded-full border border-border flex items-center justify-center mr-4 group-hover:bg-background group-hover:shadow-sm transition-all text-muted-foreground group-hover:text-foreground group-hover:-translate-x-1">
                                <ArrowLeft className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{lang === "id" ? "Sebelumnya" : lang === "jp" ? "前へ" : "Previous"}</span>
                                <span className="font-bold group-hover:text-primary transition-colors line-clamp-1">{prevPart.title}</span>
                            </div>
                        </Link>
                    ) : (
                        <div className="w-full sm:w-1/2"></div>
                    )}

                    {nextPart ? (
                        <Link
                            href={`/books/${book.id}/${nextPart.id}`}
                            className="flex items-center justify-end flex-row-reverse group px-6 py-4 rounded-2xl hover:bg-muted/50 transition-colors w-full sm:w-auto text-right"
                        >
                            <div className="h-10 w-10 shrink-0 rounded-full border border-border flex items-center justify-center ml-4 group-hover:bg-background group-hover:shadow-sm transition-all text-muted-foreground group-hover:text-foreground group-hover:translate-x-1">
                                <ArrowRight className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{lang === "id" ? "Selanjutnya" : lang === "jp" ? "次へ" : "Next"}</span>
                                <span className="font-bold group-hover:text-primary transition-colors line-clamp-1">{nextPart.title}</span>
                            </div>
                        </Link>
                    ) : (
                        <div className="flex items-center justify-end px-6 py-4 w-full sm:w-auto text-right text-muted-foreground">
                            <div className="flex flex-col">
                                <span className="font-bold flex items-center gap-2"><BookOpen className="h-4 w-4" /> {lang === "id" ? "Akhir Buku" : lang === "jp" ? "本の終わり" : "End of Book"}</span>
                            </div>
                        </div>
                    )}
                </div>
            </motion.article>
        </div>
    );
}
