"use client";

import { useState, useEffect, useCallback, useReducer, startTransition, memo, useDeferredValue, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, LayoutGrid, Loader2, ExternalLink, Pencil, Trash2, X, Check, Smile, CloudRain, Zap, Coffee, Star, MoreVertical, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { usePolling } from "@/hooks/usePolling";

// ─── Constants ──────────────────────────────────────────────────────
const CATEGORY_IMAGES: Record<string, string> = {
    Bahagia: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop",
    Sedih: "https://images.unsplash.com/photo-1501436513145-30f24e19fcc8?q=80&w=800&auto=format&fit=crop",
    Produktif: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=800&auto=format&fit=crop",
    Santai: "https://images.unsplash.com/photo-1447933601428-d4db72e71f38?q=80&w=800&auto=format&fit=crop",
    Penting: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=800&auto=format&fit=crop",
};
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=800&auto=format&fit=crop";

function getCategoryImage(category: string, imageUrl: string | null): string {
    if (imageUrl) return imageUrl;
    return CATEGORY_IMAGES[category] ?? DEFAULT_IMAGE;
}

const CATEGORIES = [
    { name: "All Notes", icon: LayoutGrid, color: "text-foreground", bg: "bg-muted/60", activeBg: "bg-pink-100 dark:bg-pink-900/40", activeText: "text-pink-500 dark:text-pink-400" },
    { name: "Bahagia", icon: Smile, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10", activeBg: "bg-amber-100 dark:bg-amber-500/20", activeText: "text-amber-600 dark:text-amber-400" },
    { name: "Sedih", icon: CloudRain, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", activeBg: "bg-blue-100 dark:bg-blue-500/20", activeText: "text-blue-600 dark:text-blue-400" },
    { name: "Produktif", icon: Zap, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", activeBg: "bg-emerald-100 dark:bg-emerald-500/20", activeText: "text-emerald-600 dark:text-emerald-400" },
    { name: "Santai", icon: Coffee, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-500/10", activeBg: "bg-violet-100 dark:bg-violet-500/20", activeText: "text-violet-600 dark:text-violet-400" },
    { name: "Penting", icon: Star, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10", activeBg: "bg-rose-100 dark:bg-rose-500/20", activeText: "text-rose-600 dark:text-rose-400" },
] as const;

type CategoryName = typeof CATEGORIES[number]["name"];
const NEW_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000;
function isNew(dateStr: string) { return Date.now() - new Date(dateStr).getTime() < NEW_THRESHOLD_MS; }
function getCategoryStyle(n: string) { return CATEGORIES.find(c => c.name === n) ?? CATEGORIES[4]; }

function getCategoryName(name: string, lang: string): string {
    if (lang === "id") {
        if (name === "All Notes") return "Semua Catatan";
        return name;
    } else {
        if (name === "Bahagia") return "Happy";
        if (name === "Sedih") return "Sad";
        if (name === "Produktif") return "Productive";
        if (name === "Santai") return "Relaxing";
        if (name === "Penting") return "Important";
        return name;
    }
}

interface Note {
    id: string; title: string; content: string;
    url: string | null; category: string;
    imageUrl: string | null; createdAt: string;
    user?: { username: string; role: "king" | "queen" } | null;
    _count?: { comments: number };
}

// ─── Create-form reducer (6 useState → 1) ───────────────────────────
interface CreateState { title: string; content: string; category: string; saving: boolean; error: string; }
type CreateAction =
    | { type: "SET"; field: "title" | "content" | "category"; value: string }
    | { type: "SET_SAVING"; v: boolean }
    | { type: "SET_ERROR"; msg: string }
    | { type: "RESET" };
const createInit: CreateState = { title: "", content: "", category: "Santai", saving: false, error: "" };
function createReducer(s: CreateState, a: CreateAction): CreateState {
    switch (a.type) {
        case "SET": return { ...s, [a.field]: a.value };
        case "SET_SAVING": return { ...s, saving: a.v };
        case "SET_ERROR": return { ...s, error: a.msg };
        case "RESET": return createInit;
    }
}

// ─── Edit-form reducer (6 useState → 1) ─────────────────────────────
interface EditState {
    note: Note | null; title: string; content: string;
    category: string; imageUrl: string; saving: boolean;
}
type EditAction =
    | { type: "OPEN"; note: Note }
    | { type: "SET"; field: "title" | "content" | "category" | "imageUrl"; value: string }
    | { type: "SET_SAVING"; v: boolean }
    | { type: "CLOSE" };
const editInit: EditState = { note: null, title: "", content: "", category: "Santai", imageUrl: "", saving: false };
function editReducer(s: EditState, a: EditAction): EditState {
    switch (a.type) {
        case "OPEN": return { note: a.note, title: a.note.title, content: a.note.content, category: a.note.category, imageUrl: a.note.imageUrl || "", saving: false };
        case "SET": return { ...s, [a.field]: a.value };
        case "SET_SAVING": return { ...s, saving: a.v };
        case "CLOSE": return editInit;
    }
}

// ─── Memoized NoteCard — prevents full-grid re-render ───────────────
const NoteCard = memo(function NoteCard({
    note, canUpdate, canDelete, onEdit, onDelete,
}: {
    note: Note; canUpdate: boolean; canDelete: boolean;
    onEdit: (n: Note) => void; onDelete: (n: Note) => void;
}) {
    const { lang } = useLanguage();
    const [showMenu, setShowMenu] = useState(false);
    const catStyle = getCategoryStyle(note.category);
    const noteIsNew = isNew(note.createdAt);
    const imgSrc = getCategoryImage(note.category, note.imageUrl);
    const hasCrud = canUpdate || canDelete;

    return (
        <div className="group relative bg-card/40 backdrop-blur-sm border border-border hover:border-primary/40 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col animate-fadeIn">
            {noteIsNew && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                    ✦ {lang === "id" ? "BARU" : lang === "jp" ? "新着" : "NEW"}
                </div>
            )}

            {/* Desktop hover-only CRUD icons (hidden on touch devices) */}
            {hasCrud && (
                <div className="hidden md:flex absolute top-3 left-3 z-10 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canUpdate && (
                        <button onClick={() => onEdit(note)} className="p-1.5 rounded-lg bg-background/80 backdrop-blur-md border border-border/50 text-foreground hover:text-primary transition-colors">
                            <Pencil className="h-3 w-3" />
                        </button>
                    )}
                    {canDelete && (
                        <button onClick={() => onDelete(note)} className="p-1.5 rounded-lg bg-background/80 backdrop-blur-md border border-border/50 text-foreground hover:text-rose-500 transition-colors">
                            <Trash2 className="h-3 w-3" />
                        </button>
                    )}
                </div>
            )}

            {/* Thumbnail — no layout shift: aspect-video reserves space */}
            <Link href={`/notes/${note.id}`} className="block">
                <div className="aspect-video w-full overflow-hidden bg-muted">
                    <img
                        src={imgSrc}
                        alt={note.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                    />
                </div>
            </Link>
            <Link href={`/notes/${note.id}`} className="flex flex-col flex-1 p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${catStyle.bg} ${catStyle.activeText}`}>
                        <catStyle.icon className="h-3 w-3" />{getCategoryName(note.category, lang)}
                    </span>
                    {note.url && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                            <ExternalLink className="h-3 w-3" /> Link
                        </span>
                    )}
                </div>
                <h3 className="text-base font-bold mb-1 group-hover:text-primary transition-colors line-clamp-2">{note.title}</h3>
                <p className="text-muted-foreground text-xs line-clamp-2 flex-1 mb-3">
                    {note.content.substring(0, 120)}{note.content.length > 120 ? "..." : ""}
                </p>
                <div className="flex items-center justify-between mt-auto gap-1 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Author pill */}
                        {note.user && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold bg-muted px-2 py-0.5 rounded-full border border-border/50">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${note.user.role === "king" ? "bg-amber-500" : "bg-rose-500"}`} />
                                {note.user.username}
                            </span>
                        )}
                        {/* Comment count — always shown */}
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${(note._count?.comments ?? 0) > 0
                            ? "bg-primary/20 border-primary/30 text-pink-600 dark:text-pink-400"
                            : "bg-muted/60 border-border/40 text-muted-foreground/50"
                            }`}>
                            <MessageCircle className="h-3 w-3 flex-shrink-0" />
                            {note._count?.comments ?? 0}
                        </span>
                    </div>
                    {/* Date */}
                    <span className="text-[11px] text-muted-foreground/60 font-medium ml-auto">
                        {new Date(note.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {/* Mobile ⋮ button — only visible on touch devices */}
                    {hasCrud && (
                        <button
                            onClick={(e) => { e.preventDefault(); setShowMenu(true); }}
                            className="md:hidden p-1.5 rounded-lg bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="More options"
                        >
                            <MoreVertical className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </Link >

            {/* Mobile Bottom Sheet Action Menu */}
            <AnimatePresence>
                {
                    showMenu && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                                onClick={() => setShowMenu(false)}
                            />
                            {/* Sheet */}
                            <motion.div
                                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                                transition={{ type: "spring", stiffness: 400, damping: 40 }}
                                className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border shadow-2xl p-4 pb-8 space-y-3"
                            >
                                {/* Handle bar */}
                                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
                                <p className="text-sm font-semibold text-center text-muted-foreground mb-4">{note.title}</p>
                                {canUpdate && (
                                    <button
                                        onClick={() => { setShowMenu(false); onEdit(note); }}
                                        className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-muted/60 hover:bg-primary/10 transition-colors text-left"
                                    >
                                        <div className="p-2 rounded-xl bg-primary/10">
                                            <Pencil className="h-4 w-4 text-primary" />
                                        </div>
                                        <span className="font-medium">{lang === "id" ? "Edit Catatan" : lang === "jp" ? "編集" : "Edit Note"}</span>
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        onClick={() => { setShowMenu(false); onDelete(note); }}
                                        className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-muted/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
                                    >
                                        <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/30">
                                            <Trash2 className="h-4 w-4 text-rose-500" />
                                        </div>
                                        <span className="font-medium text-rose-600 dark:text-rose-400">{lang === "id" ? "Hapus Catatan" : lang === "jp" ? "削除" : "Delete Note"}</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowMenu(false)}
                                    className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-muted hover:bg-muted/80 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                    <span className="font-medium">{lang === "id" ? "Batal" : lang === "jp" ? "キャンセル" : "Cancel"}</span>
                                </button>
                            </motion.div>
                        </>
                    )
                }
            </AnimatePresence >
        </div >
    );
});

// ─── Modal variants ──────────────────────────────────────────────────
const modalScale = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.15, ease: "easeOut" as const } },
    exit: { opacity: 0, scale: 0.96, transition: { duration: 0.1 } },
};

// ─── Main Page ───────────────────────────────────────────────────────
export default function NotesPage() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState<CategoryName>("All Notes");
    const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const { t, lang } = useLanguage();
    const { canCreate, canUpdate, canDelete } = useAuth();

    // Defer search so the input paints instantly on every keystroke;
    // the filtered list updates in a lower-priority background pass.
    const deferredSearch = useDeferredValue(searchQuery);
    const deferredCategory = useDeferredValue(activeCategory);

    const [create, dispatchCreate] = useReducer(createReducer, createInit);
    const [edit, dispatchEdit] = useReducer(editReducer, editInit);

    const fetchNotes = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/notes");
            if (res.ok) {
                const data = await res.json();
                startTransition(() => setNotes(data));
            }
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchNotes(); }, [fetchNotes]);

    // Background polling — re-fetch every 30s when tab is visible
    // Paused while compose/edit dialogs are open to avoid stale‑write conflicts
    usePolling(fetchNotes, 30_000, !isComposing && !edit.note);


    // Memoized — only recomputes when deferred values change, never on raw keystroke
    const filteredNotes = useMemo(() => {
        const q = deferredSearch.toLowerCase();
        return notes.filter(n => {
            const matchCat = deferredCategory === "All Notes" || n.category === deferredCategory;
            return matchCat && (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
        });
    }, [notes, deferredSearch, deferredCategory]);

    const countForCategory = useCallback((cat: CategoryName) =>
        cat === "All Notes" ? notes.length : notes.filter(n => n.category === cat).length,
        [notes]);

    const handleSaveNote = useCallback(async () => {
        if (!create.title.trim() || !create.content.trim()) return;
        dispatchCreate({ type: "SET_SAVING", v: true });
        try {
            const res = await fetch("/api/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: create.title.trim(), content: create.content.trim(), category: create.category }),
            });
            if (res.ok) {
                const newNote = await res.json();
                // Non-urgent list update
                startTransition(() => setNotes(prev => [newNote, ...prev]));
                setIsComposing(false);
                dispatchCreate({ type: "RESET" });
            } else {
                const err = await res.json();
                dispatchCreate({ type: "SET_ERROR", msg: err?.error ? JSON.stringify(err.error) : t("notes_network_error") });
            }
        } catch (e) {
            dispatchCreate({ type: "SET_ERROR", msg: t("notes_network_error") });
        } finally { dispatchCreate({ type: "SET_SAVING", v: false }); }
    }, [create, t]);

    const openEditNote = useCallback((note: Note) => {
        dispatchEdit({ type: "OPEN", note });
    }, []);

    const handleEditNote = useCallback(async () => {
        if (!edit.note || !edit.title.trim() || !edit.content.trim()) return;
        dispatchEdit({ type: "SET_SAVING", v: true });
        try {
            const res = await fetch(`/api/notes/${edit.note.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: edit.title, content: edit.content, category: edit.category, imageUrl: edit.imageUrl.trim() || null }),
            });
            if (res.ok) {
                const updated = await res.json();
                startTransition(() => setNotes(prev => prev.map(n => n.id === updated.id ? updated : n)));
                dispatchEdit({ type: "CLOSE" });
            }
        } catch (e) { console.error(e); }
        finally { dispatchEdit({ type: "SET_SAVING", v: false }); }
    }, [edit]);

    const handleDeleteNote = useCallback(async () => {
        if (!noteToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/notes/${noteToDelete.id}`, { method: "DELETE" });
            if (res.ok) {
                startTransition(() => setNotes(prev => prev.filter(n => n.id !== noteToDelete.id)));
                setNoteToDelete(null);
            }
        } catch (e) { console.error(e); }
        finally { setIsDeleting(false); }
    }, [noteToDelete]);

    return (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-10 flex flex-col md:flex-row gap-8 mt-8 min-h-screen pb-20">

            {/* ── Sidebar — plain div, CSS animation; no blocking motion.aside ── */}
            <aside className="w-full md:w-64 shrink-0 animate-fadeIn">
                <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 shadow-sm sticky top-24 space-y-2">
                    {canCreate && (
                        <button
                            onClick={() => setIsComposing(true)}
                            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-medium transition-all hover:shadow-md mb-4"
                        >
                            <Plus className="h-4 w-4" /> {t("notes_new")}
                        </button>
                    )}
                    {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = activeCategory === cat.name;
                        const count = countForCategory(cat.name as CategoryName);
                        return (
                            <button
                                key={cat.name}
                                onClick={() => setActiveCategory(cat.name as CategoryName)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${isActive
                                    ? `${cat.activeBg} ${cat.activeText} font-semibold`
                                    : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"}`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Icon className={`h-4 w-4 ${isActive ? cat.activeText : cat.color}`} />
                                    {getCategoryName(cat.name, lang)}
                                </div>
                                <span className="text-xs bg-background/70 border border-border/50 px-2 py-0.5 rounded-full">{count}</span>
                            </button>
                        );
                    })}
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className="flex-1 space-y-6">
                {/* Header — CSS animation, no motion.div */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fadeIn">
                    <h1 className="text-3xl font-bold tracking-tight">
                        {activeCategory === "All Notes" ? t("notes_all") : getCategoryName(activeCategory, lang)}
                    </h1>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t("notes_search")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-card/50 backdrop-blur-sm border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-full py-2 pl-9 pr-4 text-sm transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Composer */}
                <AnimatePresence>
                    {isComposing && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, scale: 0.95 }}
                            animate={{ opacity: 1, height: "auto", scale: 1 }}
                            exit={{ opacity: 0, height: 0, scale: 0.95 }}
                            className="bg-card/80 backdrop-blur-md border border-primary/20 rounded-2xl p-5 shadow-lg overflow-hidden"
                        >
                            <div className="relative">
                                <input
                                    type="text" placeholder={t("notes_title_placeholder")}
                                    value={create.title}
                                    onChange={e => dispatchCreate({ type: "SET", field: "title", value: e.target.value })}
                                    className={`w-full bg-transparent border-b-2 text-xl font-bold placeholder:text-muted-foreground/50 focus:outline-none mb-1 outline-none pr-6 ${create.error && !create.title.trim() ? "border-rose-400" : "border-transparent focus:border-primary/50"}`}
                                />
                                <span className="absolute right-2 top-1 text-rose-500 font-bold">*</span>
                            </div>
                            {!create.title.trim() && create.error && <p className="text-xs text-rose-500 mb-2 mt-1">Title is required.</p>}
                            <div className={`relative mt-4 border-2 rounded-xl p-2 ${create.error && !create.content.trim() ? "border-rose-400 bg-rose-50/50 dark:bg-rose-950/20" : "border-transparent bg-muted/30 focus-within:border-primary/30"}`}>
                                <textarea
                                    placeholder={t("notes_content_placeholder")}
                                    value={create.content}
                                    onChange={e => dispatchCreate({ type: "SET", field: "content", value: e.target.value })}
                                    rows={4}
                                    className="w-full bg-transparent border-none resize-none placeholder:text-muted-foreground/50 focus:outline-none text-sm outline-none pr-6 block"
                                />
                                <span className="absolute right-2 top-2 text-rose-500 font-bold">*</span>
                            </div>
                            {!create.content.trim() && create.error && <p className="text-xs text-rose-500 mb-2 mt-1">Content is required.</p>}
                            <div className="mb-3 mt-4">
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("notes_category")}</label>
                                <select
                                    value={create.category}
                                    onChange={e => dispatchCreate({ type: "SET", field: "category", value: e.target.value })}
                                    className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    {CATEGORIES.filter(c => c.name !== "All Notes").map(c => (
                                        <option key={c.name} value={c.name}>{getCategoryName(c.name, lang)}</option>
                                    ))}
                                </select>
                            </div>
                            {create.error && <p className="text-xs text-rose-500 mb-2 px-1">⚠ {create.error}</p>}
                            <div className="flex items-center justify-end border-t border-border pt-3 gap-2">
                                <button onClick={() => { setIsComposing(false); dispatchCreate({ type: "RESET" }); }} disabled={create.saving}
                                    className="px-4 py-1.5 text-sm rounded-full hover:bg-muted transition-colors text-muted-foreground">
                                    {t("notes_cancel")}
                                </button>
                                <button onClick={handleSaveNote} disabled={create.saving}
                                    className="flex items-center gap-2 px-4 py-1.5 text-sm rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium shadow-sm disabled:opacity-50">
                                    {create.saving && <Loader2 className="h-4 w-4 animate-spin" />} {t("notes_save")}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Notes Grid — plain CSS grid, NO motion.div layout (was causing CLS 0.18) */}
                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : filteredNotes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredNotes.map(note => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                canUpdate={canUpdate}
                                canDelete={canDelete}
                                onEdit={openEditNote}
                                onDelete={setNoteToDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-card/20 border border-dashed border-border rounded-3xl">
                        <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="h-8 w-8 text-primary/60" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">
                            {activeCategory === "All Notes" ? t("notes_no_results") : t("notes_no_results_cat")}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                            {activeCategory === "All Notes" ? t("notes_no_results_hint") : t("notes_no_results_cat_hint")}
                        </p>
                    </div>
                )}
            </div>

            {/* ── Edit Note Modal ── */}
            <AnimatePresence>
                {edit.note && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <motion.div variants={modalScale} initial="hidden" animate="visible" exit="exit"
                            className="bg-card w-full max-w-lg rounded-3xl shadow-xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center p-6 border-b border-border">
                                <h2 className="text-2xl font-bold">{t("notes_edit_title")}</h2>
                                <button onClick={() => dispatchEdit({ type: "CLOSE" })} className="p-2 hover:bg-muted rounded-full"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("books_form_title")}</label>
                                    <input type="text" value={edit.title}
                                        onChange={e => dispatchEdit({ type: "SET", field: "title", value: e.target.value })}
                                        className={`w-full bg-muted/50 border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 ${!edit.title.trim() ? "border-rose-400" : "border-border"}`} />
                                    {!edit.title.trim() && <p className="text-xs text-rose-500 mt-1">Title is required.</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Content <span className="text-rose-500">*</span></label>
                                    <textarea rows={6} value={edit.content}
                                        onChange={e => dispatchEdit({ type: "SET", field: "content", value: e.target.value })}
                                        className={`w-full bg-muted/50 border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 resize-none ${!edit.content.trim() ? "border-rose-400" : "border-border"}`} />
                                    {!edit.content.trim() && <p className="text-xs text-rose-500 mt-1">Content is required.</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("notes_category")}</label>
                                    <select value={edit.category}
                                        onChange={e => dispatchEdit({ type: "SET", field: "category", value: e.target.value })}
                                        className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 text-sm">
                                        {CATEGORIES.filter(c => c.name !== "All Notes").map(c => (
                                            <option key={c.name} value={c.name}>{getCategoryName(c.name, lang)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("notes_image_url")} <span className="text-muted-foreground font-normal">{t("notes_image_optional")}</span></label>
                                    <input type="url" value={edit.imageUrl}
                                        onChange={e => dispatchEdit({ type: "SET", field: "imageUrl", value: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                                    {!edit.imageUrl && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <img src={getCategoryImage(edit.category, null)} alt="preview" className="h-10 w-16 object-cover rounded-lg border border-border" />
                                            <span className="text-xs text-muted-foreground">{t("notes_default_cat_img")} <strong>{getCategoryName(edit.category, lang)}</strong></span>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-2 flex justify-end gap-3">
                                    <button onClick={() => dispatchEdit({ type: "CLOSE" })} disabled={edit.saving}
                                        className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">{t("notes_cancel")}</button>
                                    <button onClick={handleEditNote} disabled={edit.saving || !edit.title.trim() || !edit.content.trim()}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                                        {edit.saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                        <Check className="h-4 w-4" /> {t("notes_save_changes")}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Delete Confirmation ── */}
            <AnimatePresence>
                {noteToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <motion.div variants={modalScale} initial="hidden" animate="visible" exit="exit"
                            className="bg-card w-full max-w-md rounded-3xl shadow-xl border border-border p-8 text-center">
                            <div className="bg-rose-500/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="h-8 w-8 text-rose-500" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">{t("notes_delete_title")}</h2>
                            <p className="text-muted-foreground mb-8">{t("notes_delete_confirm")}</p>
                            <div className="flex justify-center gap-3">
                                <button onClick={() => setNoteToDelete(null)} disabled={isDeleting}
                                    className="px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors">{t("notes_cancel")}</button>
                                <button onClick={handleDeleteNote} disabled={isDeleting}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors">
                                    {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />} {t("notes_delete_btn")}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
