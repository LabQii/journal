"use client";

import { useState, useRef, useCallback, memo, useReducer, startTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Download, Maximize2, ZoomIn, ZoomOut, Plus, Loader2, Pencil, Trash2, Check, ImageIcon, Heart, MoreVertical } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { SmartImage } from "@/components/SmartImage";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

export interface GalleryImage {
    id: string;
    photoUrl: string;
    photoPublicId: string | null;
    description: string | null;
    isFavorite: boolean;
    createdAt: string;
}

// ─── Memoized Card ─────────────────────────────────────────────────
const GalleryCard = memo(function GalleryCard({
    img, canCreate, canUpdate, canDelete, onSelect, onEdit, onDelete, onToggleFavorite, priority
}: {
    img: GalleryImage;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    priority: boolean;
    onSelect: (img: GalleryImage) => void;
    onEdit: (img: GalleryImage) => void;
    onDelete: (img: GalleryImage) => void;
    onToggleFavorite: (img: GalleryImage) => void;
}) {
    const { lang } = useLanguage();
    const [showMenu, setShowMenu] = useState(false);
    const hasCrud = canUpdate || canDelete;

    return (
        <div className="group relative cursor-pointer animate-fadeIn">
            <div
                className="aspect-square w-full rounded-2xl overflow-hidden shadow-sm relative border border-border/50 bg-muted"
                onClick={() => onSelect(img)}
            >
                <SmartImage
                    src={img.photoUrl}
                    alt={img.description || "Gallery image"}
                    fill
                    priority={priority}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110 will-change-transform"
                />
                {/* Desktop overlay — hover only */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 pointer-events-none">
                    <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        {img.description && (
                            <h3 className="text-white font-bold text-lg leading-tight mb-1">{img.description}</h3>
                        )}
                        <p className="text-white/80 text-xs">{new Date(img.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="bg-background/40 backdrop-blur-md p-3 rounded-full border border-white/20 text-white transform scale-50 group-hover:scale-100 transition-transform duration-300 pointer-events-auto">
                            <Maximize2 className="h-6 w-6" />
                        </div>
                    </div>
                </div>
                {/* Favorite button */}
                {canCreate && (
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(img); }}
                        className="absolute top-2 right-2 z-10 bg-white/85 dark:bg-black/50 backdrop-blur-md rounded-full p-1.5 transition-all duration-200 hover:scale-125 pointer-events-auto"
                        aria-label={img.isFavorite ? "Unfavorite" : "Favorite"}
                    >
                        <Heart
                            className={`h-4 w-4 transition-colors duration-200 ${img.isFavorite
                                ? "fill-pink-500 stroke-pink-500 text-pink-500"
                                : "stroke-slate-700 dark:stroke-slate-300 fill-transparent"
                                }`}
                        />
                    </button>
                )}
                {/* Desktop CRUD hover icons */}
                {hasCrud && (
                    <div className="hidden md:flex absolute top-2 left-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {canUpdate && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(img); }}
                                className="p-2 rounded-xl bg-background/80 backdrop-blur-md border border-border/50 text-foreground hover:text-primary hover:bg-background transition-colors shadow-sm"
                                aria-label="Edit image"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(img); }}
                                className="p-2 rounded-xl bg-background/80 backdrop-blur-md border border-border/50 text-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shadow-sm"
                                aria-label="Delete image"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                )}
                {/* Mobile ⋮ menu trigger */}
                {hasCrud && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowMenu(true); }}
                        className="md:hidden absolute top-2 left-2 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border/50 text-foreground shadow-sm"
                        aria-label="More options"
                    >
                        <MoreVertical className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Mobile Bottom Sheet */}
            <AnimatePresence>
                {showMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowMenu(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", stiffness: 400, damping: 40 }}
                            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border shadow-2xl p-4 pb-8 space-y-3"
                        >
                            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
                            <p className="text-sm font-semibold text-center text-muted-foreground mb-4">
                                {img.description || (lang === "id" ? "Foto" : "Photo")}
                            </p>
                            {canUpdate && (
                                <button
                                    onClick={() => { setShowMenu(false); onEdit(img); }}
                                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-muted/60 hover:bg-primary/10 transition-colors text-left"
                                >
                                    <div className="p-2 rounded-xl bg-primary/10">
                                        <Pencil className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="font-medium">{lang === "id" ? "Edit Foto" : "Edit Photo"}</span>
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    onClick={() => { setShowMenu(false); onDelete(img); }}
                                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-muted/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
                                >
                                    <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/30">
                                        <Trash2 className="h-4 w-4 text-rose-500" />
                                    </div>
                                    <span className="font-medium text-rose-600 dark:text-rose-400">{lang === "id" ? "Hapus Foto" : "Delete Photo"}</span>
                                </button>
                            )}
                            <button
                                onClick={() => setShowMenu(false)}
                                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-muted hover:bg-muted/80 transition-colors"
                            >
                                <X className="h-4 w-4" />
                                <span className="font-medium">{lang === "id" ? "Batal" : "Cancel"}</span>
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
});

// ─── Modal animation variants ────────────────────────────────────────
const modalBackdrop = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const modalContent = { hidden: { opacity: 0, scale: 0.96, y: 8 }, visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" as const } }, exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.12 } } };

// ─── Add-form state ──────────────────────────────────────────────────
interface AddState { file: File | null; preview: string; description: string; error: string; saving: boolean; }
type AddAction =
    | { type: "SET_FILE"; file: File; preview: string }
    | { type: "SET_DESC"; value: string }
    | { type: "SET_ERROR"; msg: string }
    | { type: "SET_SAVING"; v: boolean }
    | { type: "RESET" };

const addInit: AddState = { file: null, preview: "", description: "", error: "", saving: false };
function addReducer(s: AddState, a: AddAction): AddState {
    switch (a.type) {
        case "SET_FILE": return { ...s, file: a.file, preview: a.preview, error: "" };
        case "SET_DESC": return { ...s, description: a.value };
        case "SET_ERROR": return { ...s, error: a.msg };
        case "SET_SAVING": return { ...s, saving: a.v };
        case "RESET": return addInit;
    }
}

// ─── Edit-form state ─────────────────────────────────────────────────
interface EditState { img: GalleryImage | null; file: File | null; preview: string; description: string; error: string; saving: boolean; }
type EditAction =
    | { type: "OPEN"; img: GalleryImage }
    | { type: "SET_FILE"; file: File; preview: string }
    | { type: "SET_DESC"; value: string }
    | { type: "SET_ERROR"; msg: string }
    | { type: "SET_SAVING"; v: boolean }
    | { type: "CLOSE" };

const editInit: EditState = { img: null, file: null, preview: "", description: "", error: "", saving: false };
function editReducer(s: EditState, a: EditAction): EditState {
    switch (a.type) {
        case "OPEN": return { img: a.img, file: null, preview: a.img.photoUrl, description: a.img.description || "", error: "", saving: false };
        case "SET_FILE": return { ...s, file: a.file, preview: a.preview, error: "" };
        case "SET_DESC": return { ...s, description: a.value };
        case "SET_ERROR": return { ...s, error: a.msg };
        case "SET_SAVING": return { ...s, saving: a.v };
        case "CLOSE": return editInit;
    }
}

// ─── File validation ─────────────────────────────────────────────────
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
function validateImageFile(file: File): string {
    if (!ALLOWED_TYPES.includes(file.type)) return "Only JPG, PNG, or WebP images allowed.";
    if (file.size > 2 * 1024 * 1024) return "File must be under 2MB.";
    return "";
}

// ─── Main Client Component ────────────────────────────────────────────
export default function GalleryClient({ initialImages }: { initialImages: GalleryImage[] }) {
    const { t, lang } = useLanguage();
    const { canCreate, canUpdate, canDelete } = useAuth();

    const [images, setImages] = useState<GalleryImage[]>(initialImages);
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
    const [imageToDelete, setImageToDelete] = useState<GalleryImage | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const ZOOM_STEP = 0.25;
    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 3;

    const [isAdding, setIsAdding] = useState(false);
    const [add, dispatchAdd] = useReducer(addReducer, addInit);
    const [edit, dispatchEdit] = useReducer(editReducer, editInit);
    const newFileInputRef = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    const handleToggleFavorite = useCallback(async (img: GalleryImage) => {
        if (!canCreate) return;
        const newFavorite = !img.isFavorite;
        startTransition(() => {
            setImages(prev => {
                const updated = prev.map(i => i.id === img.id ? { ...i, isFavorite: newFavorite } : i);
                return [...updated.filter(i => i.isFavorite), ...updated.filter(i => !i.isFavorite)];
            });
        });
        try {
            const res = await fetch("/api/favorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "gallery", itemId: img.id, isFavorite: newFavorite }),
            });
            if (!res.ok) throw new Error("Failed to toggle favorite");
        } catch (e) {
            console.error(e);
            startTransition(() => {
                setImages(prev => {
                    const updated = prev.map(i => i.id === img.id ? { ...i, isFavorite: !newFavorite } : i);
                    return [...updated.filter(i => i.isFavorite), ...updated.filter(i => !i.isFavorite)];
                });
            });
        }
    }, [canCreate]);

    const handleNewFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) { dispatchAdd({ type: "RESET" }); return; }
        const err = validateImageFile(file);
        if (err) { dispatchAdd({ type: "SET_ERROR", msg: err }); return; }
        dispatchAdd({ type: "SET_FILE", file, preview: URL.createObjectURL(file) });
    }, []);

    const handleEditFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const err = validateImageFile(file);
        if (err) { dispatchEdit({ type: "SET_ERROR", msg: err }); return; }
        dispatchEdit({ type: "SET_FILE", file, preview: URL.createObjectURL(file) });
    }, []);

    const handleAddImage = useCallback(async () => {
        if (!add.file) { dispatchAdd({ type: "SET_ERROR", msg: "Please select an image." }); return; }
        dispatchAdd({ type: "SET_SAVING", v: true });
        try {
            let photoUrl: string;
            let photoPublicId: string | undefined;
            try {
                const uploadResult = await uploadToCloudinary(add.file, "gallery");
                photoUrl = uploadResult.secureUrl;
                photoPublicId = uploadResult.publicId;
            } catch (uploadErr: any) {
                dispatchAdd({ type: "SET_ERROR", msg: uploadErr.message || "Upload failed." });
                return;
            }
            const res = await fetch("/api/gallery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    photoUrl,
                    photoPublicId,
                    description: add.description.trim() || null
                }),
            });
            if (res.ok) {
                const newImage = await res.json();
                startTransition(() => {
                    setImages(prev => [...prev.filter(b => b.isFavorite), newImage, ...prev.filter(b => !b.isFavorite)]);
                });
                setIsAdding(false);
                dispatchAdd({ type: "RESET" });
            } else {
                dispatchAdd({ type: "SET_ERROR", msg: "Failed to save image." });
            }
        } catch (error: any) {
            dispatchAdd({ type: "SET_ERROR", msg: error.message || "An unexpected error occurred." });
        } finally {
            dispatchAdd({ type: "SET_SAVING", v: false });
        }
    }, [add.file, add.description]);

    const openEditImage = useCallback((img: GalleryImage) => {
        dispatchEdit({ type: "OPEN", img });
    }, []);

    const handleEditImage = useCallback(async () => {
        if (!edit.img) return;
        dispatchEdit({ type: "SET_SAVING", v: true });
        try {
            let photoUrl = edit.img.photoUrl;
            let photoPublicId = edit.img.photoPublicId || undefined;
            if (edit.file) {
                try {
                    const uploadResult = await uploadToCloudinary(edit.file, "gallery");
                    photoUrl = uploadResult.secureUrl;
                    photoPublicId = uploadResult.publicId;
                } catch (uploadErr: any) {
                    dispatchEdit({ type: "SET_ERROR", msg: uploadErr.message || "Upload failed." });
                    return;
                }
            }
            const res = await fetch(`/api/gallery/${edit.img.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    photoUrl,
                    photoPublicId,
                    description: edit.description.trim() || null
                }),
            });
            if (res.ok) {
                const updated = await res.json();
                startTransition(() => {
                    setImages(prev => prev.map(img => img.id === updated.id ? updated : img));
                    setSelectedImage(prev => prev?.id === updated.id ? updated : prev);
                });
                dispatchEdit({ type: "CLOSE" });
            } else {
                dispatchEdit({ type: "SET_ERROR", msg: "Failed to save changes." });
            }
        } catch (error: any) {
            dispatchEdit({ type: "SET_ERROR", msg: error.message || "An unexpected error occurred." });
        } finally {
            dispatchEdit({ type: "SET_SAVING", v: false });
        }
    }, [edit]);

    const handleDeleteImage = useCallback(async () => {
        if (!imageToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/gallery/${imageToDelete.id}`, { method: "DELETE" });
            if (res.ok) {
                startTransition(() => {
                    setImages(prev => prev.filter(img => img.id !== imageToDelete.id));
                    setSelectedImage(prev => prev?.id === imageToDelete.id ? null : prev);
                });
                setImageToDelete(null);
            }
        } catch (e) { console.error("Failed to delete image:", e); }
        finally { setIsDeleting(false); }
    }, [imageToDelete]);

    const closeAdd = useCallback(() => {
        setIsAdding(false);
        dispatchAdd({ type: "RESET" });
    }, []);

    return (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-10 mt-8 space-y-12 min-h-screen pb-20">

            {/* Hero */}
            <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-4 animate-fadeIn">
                <div className="bg-secondary/10 p-4 rounded-full mb-4">
                    <Camera className="h-8 w-8 text-secondary" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{t("gallery_h1")}</h1>
                <p className="text-muted-foreground text-lg">{t("gallery_subtitle")}</p>
                {canCreate && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="mt-6 flex items-center gap-2 bg-primary text-primary-foreground font-medium px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
                    >
                        <Plus className="h-5 w-5" /> {t("gallery_add")}
                    </button>
                )}
            </div>

            {/* Image Grid */}
            {images.length === 0 ? (
                <div className="text-center py-20 bg-card/40 rounded-3xl border border-dashed border-border">
                    <Camera className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">{t("gallery_empty")}</h3>
                    <p className="text-muted-foreground text-sm">{t("gallery_empty_hint")}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {images.map((img, i) => (
                        <GalleryCard
                            key={img.id}
                            img={img}
                            priority={i < 8}
                            canCreate={canCreate}
                            canUpdate={canUpdate}
                            canDelete={canDelete}
                            onSelect={setSelectedImage}
                            onEdit={openEditImage}
                            onDelete={setImageToDelete}
                            onToggleFavorite={handleToggleFavorite}
                        />
                    ))}
                </div>
            )}

            {/* ── Add Photo Modal */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div key="add-backdrop" variants={modalBackdrop} initial="hidden" animate="visible" exit="exit"
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                        <motion.div key="add-modal" variants={modalContent} initial="hidden" animate="visible" exit="exit"
                            className="bg-card w-full max-w-lg rounded-3xl shadow-xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center p-6 border-b border-border">
                                <h2 className="text-2xl font-bold">{t("gallery_add")}</h2>
                                <button onClick={closeAdd} className="p-2 hover:bg-muted rounded-full transition-colors"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Photo <span className="text-rose-500">*</span></label>
                                    <div className={`w-full rounded-xl border-2 border-dashed bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden ${add.error && !add.file ? "border-rose-400" : "border-border"}`}
                                        onClick={() => newFileInputRef.current?.click()}>
                                        {add.preview ? (
                                            <div className="aspect-video w-full relative">
                                                <img src={add.preview} alt="Preview" className="w-full h-full object-cover" decoding="async" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <span className="text-white text-xs font-medium">{lang === "id" ? "Klik untuk mengganti" : lang === "jp" ? "クリックして変更" : "Click to change"}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 py-8 px-4 text-muted-foreground">
                                                <ImageIcon className="h-8 w-8" />
                                                <span className="text-sm font-medium">{lang === "id" ? "Klik untuk unggah foto" : lang === "jp" ? "クリックして写真をアップロード" : "Click to upload photo"}</span>
                                                <span className="text-xs">JPG, PNG, WebP &mdash; maks 2MB</span>
                                            </div>
                                        )}
                                    </div>
                                    <input ref={newFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleNewFileChange} />
                                    {add.error && <p className="text-xs text-rose-500">{add.error}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("gallery_desc")} <span className="text-muted-foreground font-normal text-xs ml-1">(Optional)</span></label>
                                    <textarea
                                        rows={3}
                                        value={add.description}
                                        onChange={e => dispatchAdd({ type: "SET_DESC", value: e.target.value })}
                                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                                        placeholder={t("gallery_desc_placeholder")}
                                    />
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button onClick={closeAdd} disabled={add.saving} className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">{t("gallery_cancel")}</button>
                                    <button onClick={handleAddImage} disabled={add.saving || !add.file} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                                        {add.saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {t("gallery_save")}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Edit Photo Modal */}
            <AnimatePresence>
                {edit.img && (
                    <motion.div key="edit-backdrop" variants={modalBackdrop} initial="hidden" animate="visible" exit="exit"
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                        <motion.div key="edit-modal" variants={modalContent} initial="hidden" animate="visible" exit="exit"
                            className="bg-card w-full max-w-lg rounded-3xl shadow-xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center p-6 border-b border-border">
                                <h2 className="text-2xl font-bold">{t("gallery_edit_title")}</h2>
                                <button onClick={() => dispatchEdit({ type: "CLOSE" })} className="p-2 hover:bg-muted rounded-full transition-colors"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Photo</label>
                                    <div className="w-full rounded-xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden"
                                        onClick={() => editFileInputRef.current?.click()}>
                                        {edit.preview ? (
                                            <div className="aspect-video w-full relative">
                                                <img src={edit.preview} alt="Preview" className="w-full h-full object-cover" decoding="async" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <span className="text-white text-xs font-medium">{lang === "id" ? "Klik untuk mengganti" : lang === "jp" ? "クリックして入れ替える" : "Click to replace"}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 py-8 px-4 text-muted-foreground">
                                                <ImageIcon className="h-8 w-8" />
                                                <span className="text-sm font-medium">{lang === "id" ? "Klik untuk unggah foto baru" : lang === "jp" ? "クリックして新しい写真をアップロード" : "Click to upload new photo"}</span>
                                                <span className="text-xs">JPG, PNG, WebP &mdash; maks 2MB</span>
                                            </div>
                                        )}
                                    </div>
                                    <input ref={editFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleEditFileChange} />
                                    {edit.error && <p className="text-xs text-rose-500">{edit.error}</p>}
                                    {!edit.file && <p className="text-xs text-muted-foreground">{lang === "id" ? "Tidak ada file baru dipilih — foto saat ini akan dipertahankan." : lang === "jp" ? "新しいファイルが選択されていません — 現在の写真が保持されます。" : "No new file selected — current photo will be kept."}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("gallery_desc")} <span className="text-muted-foreground font-normal text-xs ml-1">(Optional)</span></label>
                                    <textarea
                                        rows={3}
                                        value={edit.description}
                                        onChange={e => dispatchEdit({ type: "SET_DESC", value: e.target.value })}
                                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                                        placeholder={t("gallery_desc_placeholder")}
                                    />
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button onClick={() => dispatchEdit({ type: "CLOSE" })} disabled={edit.saving} className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">{t("gallery_cancel")}</button>
                                    <button onClick={handleEditImage} disabled={edit.saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                                        {edit.saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                        <Check className="h-4 w-4" /> {t("gallery_save_changes")}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Delete Confirmation */}
            <AnimatePresence>
                {imageToDelete && (
                    <motion.div key="delete-backdrop" variants={modalBackdrop} initial="hidden" animate="visible" exit="exit"
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                        <motion.div key="delete-modal" variants={modalContent} initial="hidden" animate="visible" exit="exit"
                            className="bg-card w-full max-w-md rounded-3xl shadow-xl border border-border p-8 text-center">
                            <div className="bg-rose-500/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="h-8 w-8 text-rose-500" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">{t("gallery_delete_title")}</h2>
                            <p className="text-muted-foreground mb-8">{t("gallery_delete_confirm")}</p>
                            <div className="flex justify-center gap-3">
                                <button onClick={() => setImageToDelete(null)} disabled={isDeleting} className="px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">{t("gallery_cancel")}</button>
                                <button onClick={handleDeleteImage} disabled={isDeleting} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-50">
                                    {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />} {t("gallery_delete_btn")}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div key="lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/90"
                        onClick={() => { setSelectedImage(null); setZoomLevel(1); }}>
                        <button
                            className="absolute top-6 right-6 p-2 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors z-50"
                            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); setZoomLevel(1); }}
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <div className="absolute bottom-6 sm:bottom-10 flex items-center z-50">
                            <div className="flex items-center bg-background/70 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl overflow-hidden divide-x divide-border/50">
                                {canUpdate && (
                                    <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                                        onClick={(e) => { e.stopPropagation(); openEditImage(selectedImage); setSelectedImage(null); setZoomLevel(1); }}>
                                        <Pencil className="h-4 w-4" /> Edit
                                    </button>
                                )}
                                {canDelete && (
                                    <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
                                        onClick={(e) => { e.stopPropagation(); setImageToDelete(selectedImage); setSelectedImage(null); setZoomLevel(1); }}>
                                        <Trash2 className="h-4 w-4" /> {lang === "id" ? "Hapus" : lang === "jp" ? "削除" : "Delete"}
                                    </button>
                                )}
                                <div className="w-px h-6 bg-border/60" />
                                <button className="px-3.5 py-2.5 text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40"
                                    disabled={zoomLevel <= MIN_ZOOM}
                                    onClick={(e) => { e.stopPropagation(); setZoomLevel(z => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2))); }}
                                    aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></button>
                                <span className="px-3 py-2.5 text-xs font-mono font-semibold text-muted-foreground min-w-[3rem] text-center select-none">
                                    {Math.round(zoomLevel * 100)}%
                                </span>
                                <button className="px-3.5 py-2.5 text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40"
                                    disabled={zoomLevel >= MAX_ZOOM}
                                    onClick={(e) => { e.stopPropagation(); setZoomLevel(z => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2))); }}
                                    aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></button>
                                {zoomLevel !== 1 && (
                                    <button className="px-3 py-2.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                                        onClick={(e) => { e.stopPropagation(); setZoomLevel(1); }}>{lang === "id" ? "Setel Ulang" : lang === "jp" ? "リセット" : "Reset"}</button>
                                )}
                                <div className="w-px h-6 bg-border/60" />
                                <a href={selectedImage.photoUrl} download target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                                    onClick={(e) => e.stopPropagation()}>
                                    <Download className="h-4 w-4" /> {lang === "id" ? "Unduh" : lang === "jp" ? "ダウンロード" : "Download"}
                                </a>
                            </div>
                        </div>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.18 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row bg-card border border-border/50">
                            <div className="w-full md:w-2/3 h-[50vh] md:h-auto bg-black relative flex items-center justify-center overflow-hidden">
                                <img
                                    src={selectedImage.photoUrl}
                                    alt={selectedImage.description || "Gallery image"}
                                    className="transition-transform duration-200 ease-out max-w-full max-h-full object-contain will-change-transform"
                                    style={{ transform: `scale(${zoomLevel})`, cursor: zoomLevel > 1 ? "zoom-out" : "zoom-in" }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (zoomLevel < MAX_ZOOM) setZoomLevel(z => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
                                        else setZoomLevel(1);
                                    }}
                                />
                            </div>
                            <div className="w-full md:w-1/3 p-6 md:p-8 flex flex-col justify-center bg-card/90 backdrop-blur-md">
                                <h2 className="text-3xl font-bold mb-2 text-foreground tracking-tight">{t("gallery_photo_details")}</h2>
                                <p className="text-muted-foreground mb-6 flex items-center text-sm font-medium">
                                    {new Date(selectedImage.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </p>
                                {selectedImage.description && (
                                    <p className="text-muted-foreground/90 text-sm leading-relaxed mb-8">{selectedImage.description}</p>
                                )}
                                <div className="mt-auto space-y-4">
                                    <div className="flex items-center gap-3 border-t border-border pt-6">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent overflow-hidden shadow-inner" />
                                        <div>
                                            <p className="font-bold text-sm">{t("gallery_curation")}</p>
                                            <p className="text-xs text-muted-foreground">{t("gallery_curated")}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
