"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PenLine, BookMarked, ChevronRight, BookOpen, Sparkles, Smile, CloudRain, Zap, Coffee, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const stagger = {
    visible: { transition: { staggerChildren: 0.1 } }
};

export interface BookData {
    id: string;
    title: string;
    description: string;
    author: string;
    cover: string | null;
    status: string;
    isFavorite: boolean;
    createdAt: string;
    _count: { parts: number };
    parts: { createdAt: string }[];
}

export interface NoteData {
    id: string;
    title: string;
    content: string;
    category: string;
    imageUrl: string | null;
    createdAt: string;
}

const NOTE_CATEGORIES = [
    { name: "Bahagia", icon: Smile, bg: "bg-amber-100 dark:bg-amber-500/20", text: "text-amber-600 dark:text-amber-400" },
    { name: "Sedih", icon: CloudRain, bg: "bg-blue-100 dark:bg-blue-500/20", text: "text-blue-600 dark:text-blue-400" },
    { name: "Produktif", icon: Zap, bg: "bg-emerald-100 dark:bg-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400" },
    { name: "Santai", icon: Coffee, bg: "bg-violet-100 dark:bg-violet-500/20", text: "text-violet-600 dark:text-violet-400" },
    { name: "Penting", icon: Star, bg: "bg-rose-100 dark:bg-rose-500/20", text: "text-rose-500 dark:text-rose-400" },
];

const DEFAULT_NOTE_IMAGE = "https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=800&auto=format&fit=crop";
const CATEGORY_IMAGES: Record<string, string> = {
    Bahagia: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop",
    Sedih: "https://images.unsplash.com/photo-1501436513145-30f24e19fcc8?q=80&w=800&auto=format&fit=crop",
    Produktif: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=800&auto=format&fit=crop",
    Santai: "https://images.unsplash.com/photo-1447933601428-d4db72e71f38?q=80&w=800&auto=format&fit=crop",
    Penting: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=800&auto=format&fit=crop",
};
function getCategoryImage(category: string, imageUrl: string | null): string {
    if (imageUrl) return imageUrl;
    return CATEGORY_IMAGES[category] ?? DEFAULT_NOTE_IMAGE;
}

const NEW_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000;
const NEW_BOOK_THRESHOLD_DAYS = 7;

function isNew(dateStr: string): boolean {
    return Date.now() - new Date(dateStr).getTime() < NEW_THRESHOLD_MS;
}

function isBookNew(dateStr: string): boolean {
    return Date.now() - new Date(dateStr).getTime() < NEW_BOOK_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
}

function getCatStyle(name: string) {
    return NOTE_CATEGORIES.find(c => c.name === name) ?? NOTE_CATEGORIES[3];
}

interface HomeContentProps {
    books: BookData[];
    recentNotes: NoteData[];
    isLoggedIn: boolean;
}

export default function HomeContent({ books, recentNotes, isLoggedIn }: HomeContentProps) {
    const { lang, t } = useLanguage();

    function getBookLabel(book: BookData): string | null {
        if (isBookNew(book.createdAt)) return t("home_new_book");
        if (book.parts[0] && isBookNew(book.parts[0].createdAt)) return t("home_new_part");
        return null;
    }

    const dateLocale = lang === "id" ? "id-ID" : "en-US";

    return (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-10 space-y-24">
            {/* Hero Section */}
            <motion.section initial="hidden" animate="visible" variants={stagger}
                className="relative flex flex-col items-center justify-center text-center py-20 lg:py-32 rounded-[2rem] overflow-hidden border border-rose-100/50 dark:border-border/40 shadow-sm mb-8"
            >
                {/* Soft Pink Aesthetic Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50/50 to-white dark:from-rose-950/20 dark:via-background dark:to-background pointer-events-none" />
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-pink-200/40 dark:bg-pink-900/20 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-rose-200/40 dark:bg-rose-900/20 blur-[120px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center px-4">
                    <motion.div variants={fadeIn} className="inline-flex items-center rounded-full border border-pink-200 bg-pink-50/80 dark:border-pink-500/30 dark:bg-pink-500/10 px-4 py-1.5 text-[15px] font-medium text-pink-400 dark:text-pink-400 mb-8 backdrop-blur-sm shadow-sm">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-pink-300 dark:bg-pink-400 mr-2.5 shadow-[0_0_8px_rgba(249,168,212,0.8)]"></span>
                        {t("home_badge")}
                    </motion.div>

                    <motion.h1 variants={fadeIn} className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-foreground max-w-4xl mb-6 leading-tight">
                        {t("home_h1_a")} <span className="text-slate-900 dark:text-foreground">{t("home_h1_brand")}</span>
                    </motion.h1>

                    <motion.p variants={fadeIn} className="text-base md:text-lg text-slate-600 dark:text-muted-foreground font-medium max-w-2xl mb-10 leading-relaxed">
                        {t("home_subtitle")}
                    </motion.p>

                    <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                        {isLoggedIn && (
                            <Link href="/notes" className="group flex w-full sm:w-auto h-12 md:h-14 items-center justify-center rounded-[1.5rem] bg-pink-100 hover:bg-pink-200 dark:bg-primary/20 dark:hover:bg-primary/30 text-slate-900 dark:text-primary px-6 md:px-8 text-sm md:text-base font-bold shadow-sm transition-all hover:scale-[1.02]">
                                <PenLine className="mr-2 h-4 w-4 md:h-5 md:w-5" /> {t("home_cta_note")}
                            </Link>
                        )}
                        <Link href="/books" className="group flex w-full sm:w-auto h-12 md:h-14 items-center justify-center rounded-[1.5rem] bg-white dark:bg-card px-6 md:px-8 text-sm md:text-base font-bold text-slate-900 dark:text-foreground shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
                            <BookMarked className="mr-2 h-4 w-4 md:h-5 md:w-5" /> {t("home_cta_books")}
                        </Link>
                    </motion.div>
                </div>
            </motion.section>

            {/* Recent Notes Section — only shown to logged-in users */}
            {isLoggedIn && (
                <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="space-y-8 mt-16 sm:mt-24">
                    <div className="flex items-end justify-between border-b border-border/50 pb-4">
                        <motion.div variants={fadeIn} className="flex items-center gap-3">
                            <div className="h-6 w-1 rounded-full bg-primary"></div>
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{t("home_recent_notes")}</h2>
                        </motion.div>
                        <motion.div variants={fadeIn}>
                            <Link href="/notes" className="text-sm font-medium text-accent hover:text-accent/80 transition-colors flex items-center">
                                {t("home_view_all")} <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                        </motion.div>
                    </div>

                    {recentNotes.length === 0 ? (
                        <div className="text-center py-16 bg-card/40 rounded-3xl border border-dashed border-border">
                            <PenLine className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                            <h3 className="text-xl font-medium mb-2">{t("home_no_notes")}</h3>
                            <p className="text-muted-foreground mb-6">{t("home_no_notes_sub")}</p>
                            <Link href="/notes" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-medium px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-md text-sm">
                                {t("home_create_note")}
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recentNotes.map((note) => {
                                const catStyle = getCatStyle(note.category);
                                const CatIcon = catStyle.icon;
                                const noteIsNew = isNew(note.createdAt);
                                const imgSrc = getCategoryImage(note.category, note.imageUrl);
                                return (
                                    <motion.div variants={fadeIn} key={note.id} className="group relative rounded-2xl border border-border bg-card/50 overflow-hidden hover:shadow-[0_8px_30px_rgb(248,200,220,0.12)] hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm flex flex-col">
                                        {noteIsNew && (
                                            <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                                                {lang === "id" ? "✦ BARU" : lang === "jp" ? "✦ 新着" : "✦ NEW"}
                                            </div>
                                        )}
                                        <div className="aspect-video w-full overflow-hidden bg-muted">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={imgSrc} alt={note.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_NOTE_IMAGE; }} />
                                        </div>
                                        <div className="p-5 flex flex-col flex-1">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${catStyle.bg} ${catStyle.text}`}>
                                                    <CatIcon className="h-3 w-3" />{note.category}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(note.createdAt).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" })}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">{note.title}</h3>
                                            <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-grow">
                                                {note.content.substring(0, 100)}{note.content.length > 100 ? "..." : ""}
                                            </p>
                                            <Link href={`/notes/${note.id}`} className="inline-flex items-center text-sm font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                                                {t("home_read_more")} <ChevronRight className="ml-1 h-4 w-4" />
                                            </Link>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.section>
            )}

            {/* Latest Books Section */}
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className={`space-y-8 pb-20 ${isLoggedIn ? "" : "mt-16 sm:mt-28"}`}>
                <div className="flex items-end justify-between border-b border-border/50 pb-4">
                    <motion.div variants={fadeIn} className="flex items-center gap-3">
                        <div className="h-6 w-1 rounded-full bg-secondary"></div>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{t("home_latest_books")}</h2>
                    </motion.div>
                    <motion.div variants={fadeIn}>
                        <Link href="/books" className="text-sm font-medium text-accent hover:text-accent/80 transition-colors flex items-center">
                            {t("home_view_all")} <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                    </motion.div>
                </div>

                {books.length === 0 ? (
                    <div className="text-center py-16 bg-card/40 rounded-3xl border border-dashed border-border">
                        <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                        <h3 className="text-xl font-medium mb-2">{t("home_no_books")}</h3>
                        <p className="text-muted-foreground mb-6">{t("home_no_books_sub")}</p>
                        <Link href="/books" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-medium px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-md text-sm">
                            {t("home_go_library")}
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {books.map((book) => {
                            const label = getBookLabel(book);
                            return (
                                <motion.div variants={fadeIn} key={book.id} className="group flex flex-col gap-3">
                                    <Link href={`/books/${book.id}`} className="relative aspect-[3/4] w-full rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={book.cover || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop"}
                                            alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                            <div className="text-white text-xs font-medium backdrop-blur-sm bg-white/20 px-2 py-1 rounded">{t("home_read_book")}</div>
                                        </div>
                                        {label && (
                                            <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                                                <Sparkles className="h-2.5 w-2.5" />{label}
                                            </div>
                                        )}
                                    </Link>
                                    <div>
                                        <Link href={`/books/${book.id}`} className="font-bold hover:text-primary transition-colors line-clamp-1">{book.title}</Link>
                                        <p className="text-sm text-muted-foreground">{book.author}</p>
                                        <p className="text-xs text-accent mt-1">{book._count.parts} {t("books_parts")}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </motion.section>
        </div>
    );
}
