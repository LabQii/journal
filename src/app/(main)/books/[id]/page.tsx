"use client";
// Force HMR rebuild
import { useState, useEffect, use, useRef, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, BookOpen, Clock, Heart, Share2, Play,
    Edit3, Trash2, Plus, Loader2, X, Check, Pencil, ImageIcon, MoreVertical
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";

// --- Mobile Action Menu Component ---
function MobileActionMenu({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative inline-block md:hidden" ref={menuRef}>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(!isOpen);
                }}
                className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/50 transition-colors"
            >
                <MoreVertical className="h-5 w-5" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-card border border-border shadow-xl rounded-xl p-2 z-50 flex flex-col gap-1.5"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

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
    coverPublicId: string | null;
    publishedDate: string | null;
    status: string;
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string;
    parts: Part[];
}

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { canCreate, canUpdate, canDelete } = useAuth();
    const { t, lang } = useLanguage();
    const [book, setBook] = useState<Book | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Edit book state
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editAuthor, setEditAuthor] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editCover, setEditCover] = useState("");
    const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
    const [editCoverPreview, setEditCoverPreview] = useState("");
    const [editCoverError, setEditCoverError] = useState("");
    const editCoverInputRef = useRef<HTMLInputElement>(null);
    const [editPublishedDate, setEditPublishedDate] = useState("");
    const [editStatus, setEditStatus] = useState("ONGOING");
    const [isSaving, setIsSaving] = useState(false);

    // Notifications
    const [showNotification, setShowNotification] = useState(false);
    const [showFullSynopsis, setShowFullSynopsis] = useState(false);
    const SYNOPSIS_LIMIT = 500;

    // Delete book state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Add Part state
    const [isAddingPart, setIsAddingPart] = useState(false);
    const [partTitle, setPartTitle] = useState("");
    const [partContent, setPartContent] = useState("");
    const [isSavingPart, setIsSavingPart] = useState(false);

    // Edit Part state
    const [editingPart, setEditingPart] = useState<Part | null>(null);
    const [editPartTitle, setEditPartTitle] = useState("");
    const [editPartContent, setEditPartContent] = useState("");
    const [isSavingEditPart, setIsSavingEditPart] = useState(false);

    // Delete Part state
    const [deletingPartId, setDeletingPartId] = useState<string | null>(null);
    const [partToDelete, setPartToDelete] = useState<Part | null>(null);

    useEffect(() => {
        fetchBook();
    }, [resolvedParams.id]);

    const fetchBook = async () => {
        try {
            const res = await fetch(`/api/books/${resolvedParams.id}`);
            if (res.ok) {
                const data = await res.json();
                setBook(data);
                setEditTitle(data.title);
                setEditAuthor(data.author);
                setEditDescription(data.description);
                setEditCover(data.cover || "");
                setEditCoverPreview(data.cover || "");
                setEditStatus(data.status || "ONGOING");
                setEditPublishedDate(data.publishedDate ? data.publishedDate.substring(0, 10) : "");
            }
        } catch (error) {
            console.error("Failed to fetch book:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setEditCoverFile(null);
            setEditCoverPreview(editCover);
            return;
        }
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            setEditCoverError("Only JPG, PNG, or WebP allowed."); return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setEditCoverError("File must be under 2MB."); return;
        }
        setEditCoverFile(file);
        setEditCoverPreview(URL.createObjectURL(file));
        setEditCoverError("");
    };

    const handleUpdate = async () => {
        if (!book) return;

        // Optimistic UI updates
        const optimisticBook: Book = {
            ...book,
            title: editTitle,
            author: editAuthor,
            description: editDescription,
            status: editStatus,
            publishedDate: editPublishedDate || book.publishedDate,
            cover: editCoverPreview || book.cover,
            coverPublicId: book.coverPublicId,
        };

        const formValues = {
            title: editTitle,
            author: editAuthor,
            description: editDescription,
            status: editStatus,
            publishedDate: editPublishedDate,
            coverPreview: editCoverPreview,
            coverFile: editCoverFile,
            oldCover: editCover,
        };

        startTransition(() => {
            setBook(optimisticBook);
        });
        setIsEditing(false);

        // Background sync
        (async () => {
            try {
                let coverUrl = formValues.oldCover;
                let coverPublicId: string | undefined;

                if (formValues.coverFile) {
                    const { uploadToCloudinary } = await import("@/lib/uploadToCloudinary");
                    const uploadResult = await uploadToCloudinary(formValues.coverFile, "books");
                    coverUrl = uploadResult.secureUrl;
                    coverPublicId = uploadResult.publicId;
                }

                const res = await fetch(`/api/books/${book.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: formValues.title,
                        author: formValues.author,
                        description: formValues.description,
                        cover: coverUrl || null,
                        coverPublicId: coverPublicId,
                        status: formValues.status,
                        publishedDate: formValues.publishedDate || null,
                    }),
                });

                if (res.ok) {
                    const updated = await res.json();
                    startTransition(() => {
                        setBook(prev => prev ? { ...prev, ...updated } : prev);
                    });
                } else {
                    console.error("Failed to update book");
                }
            } catch (error) {
                console.error("Failed to update book:", error);
            }
        })();
    };

    const handleDelete = async () => {
        if (!book) return;
        setIsDeleting(true);
        setShowDeleteConfirm(false);

        try {
            const res = await fetch(`/api/books/${book.id}`, { method: "DELETE" });
            if (res.ok) {
                // Navigate first, then refresh so the books list page re-fetches
                // fresh data from the server (without the deleted book).
                router.push("/books");
                router.refresh();
            } else {
                console.error("Failed to delete book");
            }
        } catch (error) {
            console.error("Failed to delete book:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    // ── Heart / Favorite ──────────────────────────────────────────────────────
    const handleToggleFavorite = async () => {
        if (!book) return;
        const newFav = !book.isFavorite;
        setBook({ ...book, isFavorite: newFav });
        try {
            await fetch(`/api/books/${book.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isFavorite: newFav }),
            });
        } catch {
            setBook({ ...book, isFavorite: book.isFavorite }); // revert
        }
    };

    // ── Add Part ──────────────────────────────────────────────────────────────
    const handleAddPart = async () => {
        if (!book || !partTitle.trim() || !partContent.trim()) return;
        setIsSavingPart(true);
        try {
            const res = await fetch(`/api/books/${book.id}/parts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: partTitle,
                    content: partContent,
                    partNumber: (book.parts?.length || 0) + 1,
                }),
            });
            if (res.ok) {
                const newPart = await res.json();
                setBook({ ...book, parts: [...(book.parts || []), newPart] });
                setIsAddingPart(false);
                setPartTitle("");
                setPartContent("");
            }
        } catch (error) {
            console.error("Failed to add part:", error);
        } finally {
            setIsSavingPart(false);
        }
    };

    // ── Edit Part ─────────────────────────────────────────────────────────────
    const openEditPart = (part: Part) => {
        setEditingPart(part);
        setEditPartTitle(part.title);
        setEditPartContent(part.content);
    };

    const handleEditPart = async () => {
        if (!book || !editingPart) return;
        setIsSavingEditPart(true);
        try {
            const res = await fetch(`/api/books/${book.id}/parts/${editingPart.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: editPartTitle, content: editPartContent }),
            });
            if (res.ok) {
                const updated = await res.json();
                setBook({
                    ...book,
                    parts: book.parts.map((p) => (p.id === updated.id ? updated : p)),
                });
                setEditingPart(null);
            }
        } catch (error) {
            console.error("Failed to edit part:", error);
        } finally {
            setIsSavingEditPart(false);
        }
    };

    // ── Delete Part ───────────────────────────────────────────────────────────
    const handleDeletePart = async () => {
        if (!book || !partToDelete) return;
        setDeletingPartId(partToDelete.id);
        try {
            const res = await fetch(`/api/books/${book.id}/parts/${partToDelete.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setBook({ ...book, parts: book.parts.filter((p) => p.id !== partToDelete.id) });
                setPartToDelete(null);
            }
        } catch (error) {
            console.error("Failed to delete part:", error);
        } finally {
            setDeletingPartId(null);
        }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 2000);
        } catch (err) {
            console.error("Failed to copy URL:", err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-32 min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!book) {
        return (
            <div className="w-full max-w-4xl mx-auto px-4 md:px-6 lg:px-10 py-20 text-center min-h-screen">
                <h1 className="text-2xl font-bold mb-4">{lang === "id" ? "Buku tidak ditemukan" : lang === "jp" ? "本が見つかりません" : "Book not found"}</h1>
                <Link href="/books" className="text-primary hover:underline">{lang === "id" ? "Kembali ke Perpustakaan" : lang === "jp" ? "ライブラリに戻る" : "Return to Library"}</Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-4 md:px-6 lg:px-10 mt-8 space-y-12 min-h-screen pb-20">
            {/* Top bar */}
            <div className="flex justify-between items-center">
                <Link href="/books" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    {lang === "id" ? "Kembali ke Perpustakaan" : lang === "jp" ? "ライブラリに戻る" : "Back to Library"}
                </Link>
                <div className="flex gap-2">
                    {canUpdate && (
                        <button
                            onClick={() => {
                                setEditTitle(book.title);
                                setEditAuthor(book.author);
                                setEditDescription(book.description);
                                setEditCover(book.cover || "");
                                setEditCoverPreview(book.cover || "");
                                setEditCoverFile(null);
                                setEditCoverError("");
                                setEditStatus(book.status);
                                setEditPublishedDate(book.publishedDate ? book.publishedDate.substring(0, 10) : "");
                                setIsEditing(true);
                            }}
                            className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-full bg-pink-50/40 text-pink-300 hover:bg-pink-50 hover:text-pink-400 hover:border-pink-200/60 transition-colors border border-pink-100/50 shadow-sm"
                        >
                            <Edit3 className="h-4 w-4" /> Edit
                        </button>
                    )}
                    {canDelete && (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-full bg-pink-100/50 text-rose-500 hover:bg-pink-100 hover:border-pink-300 transition-colors border border-pink-200/80 shadow-sm"
                        >
                            <Trash2 className="h-4 w-4" /> {lang === "id" ? "Hapus" : lang === "jp" ? "削除" : "Delete"}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                {/* Book Cover Column */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full md:w-1/3 shrink-0 md:sticky md:top-24 md:self-start"
                >
                    <div className="relative aspect-[2/3] w-full max-w-sm mx-auto rounded-3xl overflow-hidden shadow-2xl border border-border/50">
                        <img src={book.cover || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop"} alt={book.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                    </div>

                    <div className="mt-8 flex gap-3 max-w-sm mx-auto">
                        {book.parts && book.parts.length > 0 ? (
                            <Link
                                href={`/books/${book.id}/${book.parts[0]?.id || "1"}`}
                                className="flex-1 flex justify-center items-center gap-2 bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                            >
                                <Play className="h-4 w-4 fill-current" /> {t("books_read_now")}
                            </Link>
                        ) : (
                            <button disabled className="flex-1 flex justify-center items-center gap-2 bg-muted text-muted-foreground font-bold py-3.5 rounded-xl cursor-not-allowed">
                                {lang === "id" ? "Belum Ada Bagian" : lang === "jp" ? "まだ章がありません" : "No Parts Yet"}
                            </button>
                        )}
                        {/* Heart toggle — only king can favorite */}
                        {canUpdate && (
                            <button
                                onClick={handleToggleFavorite}
                                aria-label={book.isFavorite ? "Unfavorite" : "Favorite"}
                                className={`p-3.5 rounded-xl border transition-all duration-200 ${book.isFavorite
                                    ? "bg-pink-50 dark:bg-pink-950/30 border-pink-300 dark:border-pink-700"
                                    : "bg-card/50 border-border hover:border-pink-300 hover:bg-pink-50/50 dark:hover:bg-pink-950/20"
                                    }`}
                            >
                                <Heart
                                    className="h-5 w-5 transition-all duration-200"
                                    style={{
                                        fill: book.isFavorite ? "#C2185B" : "none",
                                        stroke: "#C2185B",
                                        strokeWidth: 2,
                                    }}
                                />
                            </button>
                        )}
                        <button onClick={handleShare} className="p-3.5 rounded-xl border border-border bg-card/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative">
                            <Share2 className="h-5 w-5" />
                            <AnimatePresence>
                                {showNotification && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.9 }}
                                        className="absolute -top-12 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap z-50 pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-foreground"
                                    >
                                        {lang === "id" ? "Salin tautan sukses." : lang === "jp" ? "リンクをコピーしました。" : "Copy URL Success."}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    </div>
                </motion.div>

                {/* Book Info Column */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 space-y-8"
                >
                    <div className="space-y-3 mb-2">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-rose-950 dark:text-rose-50">
                            {book.title}
                        </h1>
                        <p className="text-base md:text-lg text-rose-800/80 dark:text-rose-200/80 font-medium pb-4">{lang === "id" ? "Karya " : lang === "jp" ? "著者: " : "By "}{book.author}</p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                        {/* Chapters */}
                        <div className="flex flex-col justify-center gap-1.5 p-5 sm:p-6 bg-pink-50/40 dark:bg-pink-950/10 border border-pink-100/60 dark:border-border/40 rounded-[2rem] shadow-sm backdrop-blur-sm">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-pink-400/90">{lang === "id" ? "Bab" : lang === "jp" ? "章" : "Chapters"}</span>
                            <span className="text-xl sm:text-2xl font-black text-rose-950 dark:text-rose-50">{book.parts?.length || 0}</span>
                        </div>

                        {/* Date */}
                        <div className="flex flex-col justify-center gap-1.5 p-5 sm:p-6 bg-pink-50/40 dark:bg-pink-950/10 border border-pink-100/60 dark:border-border/40 rounded-[2rem] shadow-sm backdrop-blur-sm">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-pink-400/90">{lang === "id" ? "Tanggal" : lang === "jp" ? "日付" : "Date"}</span>
                            <span className="text-xl sm:text-2xl font-black text-rose-950 dark:text-rose-50 flex items-center h-full">
                                {new Date(book.publishedDate || book.createdAt).toLocaleDateString(
                                    lang === "id" ? "id-ID" : lang === "jp" ? "ja-JP" : "en-US",
                                    { day: "numeric", month: "short", year: "numeric" }
                                )}
                            </span>
                        </div>

                        {/* Status */}
                        <div className="col-span-2 sm:col-span-1 flex flex-col justify-center gap-1.5 p-5 sm:p-6 bg-pink-50/40 dark:bg-pink-950/10 border border-pink-100/60 dark:border-border/40 rounded-[2rem] shadow-sm backdrop-blur-sm items-start sm:items-stretch">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-pink-400/90">{t("books_form_status")}</span>
                            <div className="mt-1">
                                <span className={`inline-flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-bold tracking-wide border shadow-sm ${book.status === "COMPLETED"
                                    ? "bg-rose-100 text-rose-700 border-rose-200/60 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30"
                                    : "bg-pink-100 text-pink-700 border-pink-200/60 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-500/30"
                                    }`}>
                                    {book.status === "COMPLETED" ? t("books_status_completed") : t("books_status_ongoing")}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Synopsis */}
                    <div className="bg-card/20 border border-border/40 rounded-[2rem] p-7 md:p-8 space-y-3 shadow-sm backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-5 w-1.5 rounded-full bg-secondary"></div>
                            <h3 className="text-lg font-bold tracking-tight">{lang === "id" ? "Sinopsis" : lang === "jp" ? "あらすじ" : "Synopsis"}</h3>
                        </div>
                        <p className="text-[15px] text-foreground/75 leading-[1.85] font-normal whitespace-pre-wrap">
                            {showFullSynopsis || book.description.length <= SYNOPSIS_LIMIT
                                ? book.description
                                : book.description.slice(0, SYNOPSIS_LIMIT) + "…"}
                        </p>
                        {book.description.length > SYNOPSIS_LIMIT && (
                            <button
                                onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                                className="text-sm font-semibold text-secondary hover:text-secondary/80 transition-colors mt-1"
                            >
                                {showFullSynopsis ? (lang === "id" ? "Tampilkan Lebih Sedikit ↑" : lang === "jp" ? "一部を表示 ↑" : "Show Less ↑") : (lang === "id" ? "Lebih Lanjut ↓" : lang === "jp" ? "続きを読む ↓" : "Read More ↓")}
                            </button>
                        )}
                    </div>

                    {/* Table of Contents */}
                    <div className="bg-card/20 border border-border/40 rounded-[2rem] p-7 md:p-8 shadow-sm md:max-w-4xl backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6 md:mb-8">
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-1.5 rounded-full bg-secondary"></div>
                                <h3 className="text-xl md:text-2xl font-bold tracking-tight">{lang === "id" ? "Daftar Isi" : lang === "jp" ? "目次" : "Table of Contents"}</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                {canCreate && (
                                    <button
                                        onClick={() => setIsAddingPart(true)}
                                        className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full bg-pink-50/50 text-pink-400 hover:bg-pink-100/50 border border-pink-100 transition-colors shadow-sm"
                                    >
                                        <Plus className="h-4 w-4" /> {lang === "id" ? "Tambah Bagian" : lang === "jp" ? "章を追加" : "Add Part"}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Add Part Form */}
                        <AnimatePresence>
                            {isAddingPart && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-8 bg-primary/5 border border-primary/20 rounded-[1.5rem] p-6 shadow-sm overflow-hidden"
                                >
                                    <h4 className="font-bold mb-4 text-primary flex items-center gap-2">
                                        <Plus className="h-5 w-5" /> {lang === "id" ? "Bab Baru" : lang === "jp" ? "新しい章" : "New Chapter"}
                                    </h4>
                                    <input
                                        type="text"
                                        placeholder={lang === "id" ? "Judul Bab" : lang === "jp" ? "章のタイトル" : "Chapter Title"}
                                        value={partTitle}
                                        onChange={e => setPartTitle(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 mb-3 transition-all text-foreground placeholder:text-muted-foreground text-[15px]"
                                    />
                                    <textarea
                                        placeholder={lang === "id" ? "Konten bab..." : lang === "jp" ? "章の内容..." : "Chapter content..."}
                                        value={partContent}
                                        onChange={e => setPartContent(e.target.value)}
                                        rows={8}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 resize-y mb-4 transition-all text-foreground placeholder:text-muted-foreground text-[15px]"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => { setIsAddingPart(false); setPartTitle(""); setPartContent(""); }} disabled={isSavingPart} className="px-5 py-2.5 text-sm font-medium rounded-xl hover:bg-muted transition-colors disabled:opacity-50">
                                            {t("books_cancel")}
                                        </button>
                                        <button onClick={handleAddPart} disabled={isSavingPart || !partTitle.trim() || !partContent.trim()} className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm">
                                            {isSavingPart && <Loader2 className="h-4 w-4 animate-spin" />}
                                            <Check className="h-4 w-4" /> {lang === "id" ? "Tambah Bab" : lang === "jp" ? "章を追加" : "Add Chapter"}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Parts List */}
                        <div className="space-y-3">
                            {book.parts && book.parts.length > 0 ? (
                                book.parts.map((part, index) => (
                                    <div key={part.id} className="group flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-border/60 bg-card/20 hover:bg-card/60 transition-all shadow-none hover:shadow-sm">
                                        <Link href={`/books/${book.id}/${part.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="h-10 w-10 shrink-0 rounded-full bg-pink-50/50 flex items-center justify-center font-bold text-pink-300 group-hover:bg-pink-100 group-hover:text-pink-400 transition-colors">
                                                {index + 1}
                                            </div>
                                            <span className="font-medium text-base text-pink-300 group-hover:text-pink-400 transition-colors truncate">{part.title}</span>
                                        </Link>
                                        {/* Part actions — king only */}
                                        {(canUpdate || canDelete) && (
                                            <div className="flex justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity ml-3 shrink-0">
                                                {/* Desktop Actions */}
                                                <div className="hidden md:flex items-center gap-2">
                                                    {canUpdate && (
                                                        <button
                                                            onClick={() => openEditPart(part)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-pink-300 bg-pink-50/40 border border-pink-100/50 hover:bg-pink-50 hover:text-pink-400 hover:border-pink-200/60 transition-colors shadow-sm"
                                                            aria-label="Edit part"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" /> <span>Edit</span>
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => setPartToDelete(part)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-rose-500 bg-pink-100/50 border border-pink-200/80 hover:bg-pink-100 hover:border-pink-300 transition-colors shadow-sm"
                                                            aria-label="Delete part"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" /> <span>Delete</span>
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Mobile 3-dot Actions */}
                                                <MobileActionMenu>
                                                    {canUpdate && (
                                                        <button
                                                            onClick={() => openEditPart(part)}
                                                            className="flex items-center gap-2 px-3 py-2 w-full text-left rounded-lg text-sm font-medium text-pink-500 hover:bg-pink-50/50 transition-colors"
                                                        >
                                                            <Pencil className="h-4 w-4" /> Edit
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => setPartToDelete(part)}
                                                            className="flex items-center gap-2 px-3 py-2 w-full text-left rounded-lg text-sm font-medium text-rose-500 hover:bg-rose-50/50 transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" /> Delete
                                                        </button>
                                                    )}
                                                </MobileActionMenu>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-card/10 border border-dashed border-border/50 rounded-2xl">
                                    <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-muted-foreground text-sm">{lang === "id" ? "Belum ada bab. Tambahkan yang pertama!" : lang === "jp" ? "まだ章がありません。最初の章を追加してください！" : "No chapters yet. Add the first one!"}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ── Edit Book Modal ─────────────────────────────────────────── */}
            <AnimatePresence>
                {isEditing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card w-full max-w-lg rounded-3xl shadow-xl overflow-hidden border border-border flex flex-col max-h-[90vh]"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-border">
                                <h2 className="text-2xl font-bold">{lang === "id" ? "Edit Buku" : lang === "jp" ? "本を編集" : "Edit Book"}</h2>
                                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-muted rounded-full transition-colors"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1 space-y-4">
                                {[
                                    { label: t("books_form_title"), value: editTitle, set: setEditTitle, type: "text" },
                                    { label: t("books_form_author"), value: editAuthor, set: setEditAuthor, type: "text" },
                                    { label: "Published Date", value: editPublishedDate, set: setEditPublishedDate, type: "date" },
                                ].map(({ label, value, set, type }) => (
                                    <div key={label} className="space-y-2">
                                        <label className="text-sm font-medium">{label}</label>
                                        <input type={type} value={value} onChange={e => set(e.target.value)} className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                                    </div>
                                ))}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("books_form_cover")}</label>
                                    <div className={`w-full rounded-xl border-2 border-dashed bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden border-border`}
                                        onClick={() => editCoverInputRef.current?.click()}>
                                        {editCoverPreview ? (
                                            <div className="relative aspect-[2/3] max-h-48 mx-auto">
                                                <img src={editCoverPreview} alt="Cover preview" className="w-full h-full object-cover" decoding="async" />
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
                                    <input ref={editCoverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleEditCoverChange} />
                                    {editCoverError && <p className="text-xs text-rose-500 mt-1">{editCoverError}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("books_form_desc")}</label>
                                    <textarea rows={4} value={editDescription} onChange={e => setEditDescription(e.target.value)} className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("books_form_status")}</label>
                                    <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none">
                                        <option value="ONGOING">{t("books_status_ongoing")}</option>
                                        <option value="COMPLETED">{t("books_status_completed")}</option>
                                    </select>
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button onClick={() => setIsEditing(false)} disabled={isSaving} className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">{t("books_cancel")}</button>
                                    <button onClick={handleUpdate} disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                                        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                        <Check className="h-4 w-4" /> {lang === "id" ? "Simpan Perubahan" : lang === "jp" ? "変更を保存" : "Save Changes"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Delete Book Modal ───────────────────────────────────────── */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-border p-8 text-center"
                        >
                            <div className="bg-rose-500/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="h-8 w-8 text-rose-500" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">{lang === "id" ? "Hapus Buku" : lang === "jp" ? "本を削除" : "Delete Book"}</h2>
                            <p className="text-muted-foreground mb-8">
                                {lang === "id" ? `Yakin ingin menghapus "${book.title}"? Tindakan ini tidak dapat dibatalkan dan semua bab akan dihapus.` : lang === "jp" ? `"${book.title}" を削除してもよろしいですか？この操作は元に戻せず、すべての章が削除されます。` : `Are you sure you want to delete "${book.title}"? This action cannot be undone and all chapters will be removed.`}
                            </p>
                            <div className="flex justify-center gap-3">
                                <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">{t("books_cancel")}</button>
                                <button onClick={handleDelete} disabled={isDeleting} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-50">
                                    {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />} {lang === "id" ? "Hapus Buku" : lang === "jp" ? "本を削除" : "Delete Book"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Edit Part Modal ─────────────────────────────────────────── */}
            <AnimatePresence>
                {editingPart && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card w-full max-w-lg rounded-3xl shadow-xl overflow-hidden border border-border flex flex-col max-h-[90vh]"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-border">
                                <h2 className="text-xl font-bold">{lang === "id" ? "Edit Bab" : lang === "jp" ? "章を編集" : "Edit Chapter"}</h2>
                                <button onClick={() => setEditingPart(null)} className="p-2 hover:bg-muted rounded-full transition-colors"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("books_form_title")}</label>
                                    <input type="text" value={editPartTitle} onChange={e => setEditPartTitle(e.target.value)} className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{lang === "id" ? "Konten" : lang === "jp" ? "内容" : "Content"}</label>
                                    <textarea rows={10} value={editPartContent} onChange={e => setEditPartContent(e.target.value)} className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none" />
                                </div>
                                <div className="pt-2 flex justify-end gap-3">
                                    <button onClick={() => setEditingPart(null)} disabled={isSavingEditPart} className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">{t("books_cancel")}</button>
                                    <button onClick={handleEditPart} disabled={isSavingEditPart || !editPartTitle.trim()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                                        {isSavingEditPart && <Loader2 className="h-4 w-4 animate-spin" />}
                                        <Check className="h-4 w-4" /> {lang === "id" ? "Simpan Bab" : lang === "jp" ? "章を保存" : "Save Chapter"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Delete Part Confirmation ────────────────────────────────── */}
            <AnimatePresence>
                {partToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card w-full max-w-md rounded-3xl shadow-xl border border-border p-8 text-center"
                        >
                            <div className="bg-rose-500/10 h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="h-6 w-6 text-rose-500" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">{lang === "id" ? "Hapus Bab" : lang === "jp" ? "章を削除" : "Delete Chapter"}</h2>
                            <p className="text-muted-foreground mb-6">
                                {lang === "id" ? `Yakin ingin menghapus "${partToDelete.title}"? Ini tidak bisa dibatalkan.` : lang === "jp" ? `"${partToDelete.title}" を削除してもよろしいですか？この操作は元に戻せません。` : `Are you sure you want to delete "${partToDelete.title}"? This cannot be undone.`}
                            </p>
                            <div className="flex justify-center gap-3">
                                <button onClick={() => setPartToDelete(null)} disabled={!!deletingPartId} className="px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">{t("books_cancel")}</button>
                                <button onClick={handleDeletePart} disabled={!!deletingPartId} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-50">
                                    {deletingPartId && <Loader2 className="h-4 w-4 animate-spin" />} {lang === "id" ? "Hapus" : lang === "jp" ? "削除" : "Delete"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
