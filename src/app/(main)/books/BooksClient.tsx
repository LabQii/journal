"use client";

import { useState, useRef, useCallback, memo, useReducer, startTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Heart, Plus, Loader2, X, ImageIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { SmartImage } from "@/components/SmartImage";
import { uploadToSupabase } from "@/lib/uploadToSupabase";

export interface Book {
    id: string;
    title: string;
    description: string;
    author: string;
    cover: string | null;
    status: string;
    isFavorite: boolean;
    createdAt: string;
    _count?: { parts: number };
}

// ─── Modal animation variants ────────────────────────────────────────
const modalBackdrop = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const modalContent = {
    hidden: { opacity: 0, scale: 0.96, y: 8 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" as const } },
    exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.12 } },
};

// ─── Book Form state ─────────────────────────────────────────────────
interface FormState {
    title: string; author: string; description: string; status: string;
    coverFile: File | null; coverPreview: string; coverError: string;
}
type FormAction =
    | { type: "SET"; field: "title" | "author" | "description" | "status"; value: string }
    | { type: "SET_COVER"; file: File; preview: string }
    | { type: "SET_COVER_ERROR"; msg: string }
    | { type: "RESET" };

const formInit: FormState = { title: "", author: "", description: "", status: "ONGOING", coverFile: null, coverPreview: "", coverError: "" };
function formReducer(s: FormState, a: FormAction): FormState {
    switch (a.type) {
        case "SET": return { ...s, [a.field]: a.value };
        case "SET_COVER": return { ...s, coverFile: a.file, coverPreview: a.preview, coverError: "" };
        case "SET_COVER_ERROR": return { ...s, coverError: a.msg };
        case "RESET": return formInit;
    }
}

// ─── Memoized Book Card ──────────────────────────────────────────────
const BookCard = memo(function BookCard({
    book, canCreate, canUpdate, onToggleFavorite, t,
}: {
    book: Book; canCreate: boolean; canUpdate: boolean;
    onToggleFavorite: (book: Book, e: React.MouseEvent) => void;
    t: (key: string) => string;
}) {
    return (
        <div className="group relative animate-fadeIn">
            <Link
                href={`/books/${book.id}`}
                className="block relative aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 mb-4 group-hover:-translate-y-2"
            >
                <SmartImage
                    src={book.cover || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop"}
                    alt={book.title}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110 will-change-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 pointer-events-none">
                    <p className="text-white text-sm font-medium line-clamp-2 mb-2">{book.description}</p>
                    <span className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow-sm text-center">
                        {t("books_read_now")}
                    </span>
                </div>
                {canCreate && (
                    <button
                        onClick={(e) => onToggleFavorite(book, e)}
                        className="absolute top-2 right-2 bg-white/85 dark:bg-black/50 backdrop-blur-md rounded-full p-2 transition-transform duration-200 hover:scale-110 shadow-sm z-10 pointer-events-auto"
                        aria-label={book.isFavorite ? "Unfavorite" : "Favorite"}
                    >
                        <Heart
                            className={`h-4 w-4 transition-colors duration-200 ${book.isFavorite
                                ? "fill-pink-500 stroke-pink-500 text-pink-500"
                                : "stroke-slate-700 dark:stroke-slate-300 fill-transparent"
                                }`}
                        />
                    </button>
                )}
            </Link>
            <div className="space-y-1">
                <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
                    <Link href={`/books/${book.id}`}>{book.title}</Link>
                </h3>
                <p className="text-sm text-muted-foreground">{book.author}</p>
                <div className="flex items-center gap-3 mt-2 text-xs font-medium text-accent">
                    <span className="flex items-center gap-1 bg-accent/10 px-2 py-0.5 rounded-sm">
                        <BookOpen className="h-3 w-3" /> {book._count?.parts || 0} {t("books_parts")}
                    </span>
                </div>
            </div>
        </div>
    );
});

// ─── Main Client Component ────────────────────────────────────────────
export default function BooksClient({ initialBooks }: { initialBooks: Book[] }) {
    const [books, setBooks] = useState<Book[]>(initialBooks);
    const [isCreating, setIsCreating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [touched, setTouched] = useState(false);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const { t, lang } = useLanguage();
    const { canCreate, canUpdate } = useAuth();

    const [form, dispatchForm] = useReducer(formReducer, formInit);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const handleToggleFavorite = useCallback(async (book: Book, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!canCreate) return;
        const newFavorite = !book.isFavorite;
        startTransition(() => {
            setBooks(prev => {
                const updated = prev.map(b => b.id === book.id ? { ...b, isFavorite: newFavorite } : b);
                return [...updated.filter(b => b.isFavorite), ...updated.filter(b => !b.isFavorite)];
            });
            if (selectedBook?.id === book.id) {
                setSelectedBook(prev => prev ? { ...prev, isFavorite: newFavorite } : null);
            }
        });
        try {
            const res = await fetch("/api/favorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "book", itemId: book.id, isFavorite: newFavorite }),
            });
            if (!res.ok) throw new Error("Failed to toggle favorite");
        } catch (error) {
            console.error(error);
            startTransition(() => {
                setBooks(prev => {
                    const reverted = prev.map(b => b.id === book.id ? { ...b, isFavorite: !newFavorite } : b);
                    return [...reverted.filter(b => b.isFavorite), ...reverted.filter(b => !b.isFavorite)];
                });
                if (selectedBook?.id === book.id) {
                    setSelectedBook(prev => prev ? { ...prev, isFavorite: !newFavorite } : null);
                }
            });
        }
    }, [selectedBook, canCreate]);

    const handleCoverFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) { dispatchForm({ type: "RESET" }); return; }
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            dispatchForm({ type: "SET_COVER_ERROR", msg: "Only JPG, PNG, or WebP images allowed." }); return;
        }
        if (file.size > 2 * 1024 * 1024) {
            dispatchForm({ type: "SET_COVER_ERROR", msg: "File must be under 2MB." }); return;
        }
        dispatchForm({ type: "SET_COVER", file, preview: URL.createObjectURL(file) });
    }, []);

    const resetForm = useCallback(() => {
        dispatchForm({ type: "RESET" });
        setTouched(false);
    }, []);

    const handleCreateBook = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        if (!form.title.trim() || !form.author.trim() || !form.description.trim() || !form.coverFile) {
            if (!form.coverFile) dispatchForm({ type: "SET_COVER_ERROR", msg: "Please select a cover image." });
            return;
        }
        setIsSaving(true);
        try {
            let coverUrl: string;
            try {
                coverUrl = await uploadToSupabase(form.coverFile, "books");
            } catch (uploadErr: any) {
                dispatchForm({ type: "SET_COVER_ERROR", msg: uploadErr.message || "Upload failed." });
                return;
            }
            const res = await fetch("/api/books", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: form.title, author: form.author, description: form.description, cover: coverUrl, status: form.status }),
            });
            if (res.ok) {
                const newBook = await res.json();
                startTransition(() => {
                    setBooks(prev => {
                        const withCount = { ...newBook, _count: { parts: 0 } };
                        return [...prev.filter(b => b.isFavorite), withCount, ...prev.filter(b => !b.isFavorite)];
                    });
                });
                setIsCreating(false);
                resetForm();
            } else {
                const data = await res.json();
                dispatchForm({ type: "SET_COVER_ERROR", msg: "Failed to create book: " + (data.error ? JSON.stringify(data.error) : "unknown error") });
            }
        } catch (error: any) {
            dispatchForm({ type: "SET_COVER_ERROR", msg: error.message || "An unexpected error occurred." });
        } finally {
            setIsSaving(false);
        }
    }, [form, resetForm]);

    return (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-10 mt-8 space-y-12 min-h-screen pb-20">

            {/* Hero */}
            <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-4 relative animate-fadeIn">
                <div className="bg-secondary/10 p-4 rounded-full mb-4">
                    <BookOpen className="h-8 w-8 text-secondary" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{t("books_h1")}</h1>
                <p className="text-muted-foreground text-lg">{t("books_subtitle")}</p>
                {canCreate && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="mt-6 flex items-center gap-2 bg-primary text-primary-foreground font-medium px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
                    >
                        <Plus className="h-5 w-5" /> {t("books_add")}
                    </button>
                )}
            </div>

            {/* Book Grid */}
            {books.length === 0 ? (
                <div className="text-center py-20 bg-card/40 rounded-3xl border border-dashed border-border mt-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">{t("books_empty")}</h3>
                    <p className="text-muted-foreground">{t("books_empty_hint")}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                    {books.map(book => (
                        <BookCard
                            key={book.id}
                            book={book}
                            canCreate={canCreate}
                            canUpdate={canUpdate}
                            onToggleFavorite={handleToggleFavorite}
                            t={t}
                        />
                    ))}
                </div>
            )}

            {/* Create Book Modal */}
            <AnimatePresence>
                {isCreating && (
                    <motion.div key="create-backdrop" variants={modalBackdrop} initial="hidden" animate="visible" exit="exit"
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                        <motion.div key="create-modal" variants={modalContent} initial="hidden" animate="visible" exit="exit"
                            className="bg-card w-full max-w-lg rounded-3xl shadow-xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center p-6 border-b border-border">
                                <h2 className="text-2xl font-bold">{t("books_new_title")}</h2>
                                <button onClick={() => { setIsCreating(false); resetForm(); }} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <form noValidate onSubmit={handleCreateBook} className="p-6 overflow-y-auto flex-1 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("books_form_title")} <span className="text-rose-500">*</span></label>
                                    <input type="text" required value={form.title}
                                        onChange={e => { dispatchForm({ type: "SET", field: "title", value: e.target.value }); if (touched) setTouched(false); }}
                                        onBlur={() => setTouched(true)}
                                        className={`w-full bg-muted/50 border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all ${touched && !form.title.trim() ? "border-rose-400" : "border-border"}`}
                                        placeholder={lang === "id" ? "Perjalanan Epik..." : lang === "jp" ? "素晴らしい旅..." : "Epic Journey..."} />
                                    {touched && !form.title.trim() && <p className="text-xs text-rose-500 mt-1">Title is required.</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("books_form_author")} <span className="text-rose-500">*</span></label>
                                    <input type="text" required value={form.author}
                                        onChange={e => { dispatchForm({ type: "SET", field: "author", value: e.target.value }); if (touched) setTouched(false); }}
                                        onBlur={() => setTouched(true)}
                                        className={`w-full bg-muted/50 border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all ${touched && !form.author.trim() ? "border-rose-400" : "border-border"}`}
                                        placeholder={lang === "id" ? "Nama Penulis" : lang === "jp" ? "著者名" : "Jane Doe"} />
                                    {touched && !form.author.trim() && <p className="text-xs text-rose-500 mt-1">Author is required.</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("books_form_cover")} <span className="text-rose-500">*</span></label>
                                    <div className={`w-full rounded-xl border-2 border-dashed bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden ${touched && !form.coverFile ? "border-rose-400" : "border-border"}`}
                                        onClick={() => coverInputRef.current?.click()}>
                                        {form.coverPreview ? (
                                            <div className="relative aspect-[2/3] max-h-48 mx-auto">
                                                <img src={form.coverPreview} alt="Cover preview" className="w-full h-full object-cover" decoding="async" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <span className="text-white text-xs font-medium">{lang === "id" ? "Klik untuk mengganti" : lang === "jp" ? "クリックして変更" : "Click to change"}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 py-8 px-4 text-muted-foreground">
                                                <ImageIcon className="h-8 w-8" />
                                                <span className="text-sm font-medium">{lang === "id" ? "Klik untuk unggah sampul" : lang === "jp" ? "クリックしてカバーをアップロード" : "Click to upload cover"}</span>
                                                <span className="text-xs">JPG, PNG, WebP — maks 2MB</span>
                                            </div>
                                        )}
                                    </div>
                                    <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverFileChange} />
                                    {form.coverError && <p className="text-xs text-rose-500 mt-1">{form.coverError}</p>}
                                    {touched && !form.coverFile && !form.coverError && <p className="text-xs text-rose-500 mt-1">Cover image is required.</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("books_form_desc")} <span className="text-rose-500">*</span></label>
                                    <textarea required rows={4} value={form.description}
                                        onChange={e => { dispatchForm({ type: "SET", field: "description", value: e.target.value }); if (touched) setTouched(false); }}
                                        onBlur={() => setTouched(true)}
                                        className={`w-full bg-muted/50 border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none ${touched && !form.description.trim() ? "border-rose-400" : "border-border"}`}
                                        placeholder={lang === "id" ? "Cerita tentang..." : lang === "jp" ? "物語について..." : "A story about..."} />
                                    {touched && !form.description.trim() && <p className="text-xs text-rose-500 mt-1">Description is required.</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("books_form_status")}</label>
                                    <select value={form.status} onChange={e => dispatchForm({ type: "SET", field: "status", value: e.target.value })}
                                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none">
                                        <option value="ONGOING">{t("books_status_ongoing")}</option>
                                        <option value="COMPLETED">{t("books_status_completed")}</option>
                                    </select>
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => { setIsCreating(false); resetForm(); }} disabled={isSaving}
                                        className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">
                                        {t("books_cancel")}
                                    </button>
                                    <button type="submit" disabled={isSaving}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                                        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {t("books_create")}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
