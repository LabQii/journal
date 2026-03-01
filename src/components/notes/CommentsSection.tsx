"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Trash2, CornerDownRight, Search, X, Crown, Loader2, MessageSquareDashed, Pencil, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabaseClient } from "@/lib/supabase-client";

interface CommentUser {
    id: string;
    username: string;
    role: "king" | "queen";
}

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    userId: string;
    parentId: string | null;
    user: CommentUser;
    replies: Comment[];
}

function timeAgo(dateStr: string, t: (k: string) => string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return t("comment_just_now");
    if (m < 60) return `${m}${t("comment_minutes_ago")}`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}${t("comment_hours_ago")}`;
    return `${Math.floor(h / 24)}${t("comment_days_ago")}`;
}

function RoleBadge({ role }: { role: "king" | "queen" }) {
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${role === "king"
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
            }`}>
            <Crown className="h-2.5 w-2.5" />
            {role === "king" ? "King" : "Queen"}
        </span>
    );
}

interface CommentItemProps {
    comment: Comment;
    noteId: string;
    onDelete: (id: string, parentId?: string) => void;
    onEdit: (id: string, content: string, parentId?: string) => void;
    onReplyAdded: (reply: Comment, parentId: string) => void;
    level?: number;
    canDeleteComment: (authorId: string) => boolean;
    canEditComment: (authorId: string) => boolean;
    canComment: boolean;
    isLoggedIn: boolean;
    t: (k: string) => string;
}

function CommentItem({
    comment, noteId, onDelete, onEdit, onReplyAdded, level = 0,
    canDeleteComment, canEditComment, canComment, isLoggedIn, t
}: CommentItemProps) {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [replyError, setReplyError] = useState("");
    const [replyTouched, setReplyTouched] = useState(false);

    // Inline edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.content);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [editError, setEditError] = useState("");

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleReply = async () => {
        if (!replyText.trim()) { setReplyTouched(true); return; }
        setIsSending(true);
        setReplyError("");
        try {
            const res = await fetch(`/api/notes/${noteId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: replyText.trim(), parentId: comment.id }),
            });
            if (res.ok) {
                const reply = await res.json();
                onReplyAdded(reply, comment.id);
                setReplyText("");
                setShowReplyForm(false);
                setReplyTouched(false);
            } else {
                const err = await res.json();
                setReplyError(err.error ?? t("comment_error_network"));
            }
        } catch {
            setReplyError(t("comment_error_network"));
        } finally {
            setIsSending(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editText.trim()) return;
        setIsSavingEdit(true);
        setEditError("");
        try {
            const res = await fetch(`/api/notes/${noteId}/comments/${comment.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: editText.trim() }),
            });
            if (res.ok) {
                onEdit(comment.id, editText.trim(), comment.parentId ?? undefined);
                setIsEditing(false);
            } else {
                const err = await res.json();
                setEditError(err.error ?? t("comment_error_network"));
            }
        } catch {
            setEditError(t("comment_error_network"));
        } finally {
            setIsSavingEdit(false);
        }
    };

    return (
        <div id={`comment-${comment.id}`} className={`${level > 0 ? "ml-6 md:ml-10 border-l-2 border-border/50 pl-4" : ""}`}>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative bg-card/40 backdrop-blur-sm border border-border/60 hover:border-pink-200 dark:hover:border-pink-900/40 rounded-[2rem] p-4 md:p-5 mb-4 transition-all duration-300 hover:shadow-sm"
            >
                <div className="flex gap-4">
                    {/* Avatar */}
                    <div className={`shrink-0 h-10 w-10 md:h-11 md:w-11 rounded-full flex items-center justify-center font-bold text-sm md:text-base uppercase shadow-sm
                        ${comment.user.role === "king"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 border border-rose-200"
                        }`}>
                        {comment.user.username.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Header: Name, Badge, Time */}
                        <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                            <span className="text-[15px] font-bold text-foreground">{comment.user.username}</span>
                            <RoleBadge role={comment.user.role} />
                            <span className="text-xs text-muted-foreground/80 font-medium">
                                {timeAgo(comment.createdAt, t)}
                            </span>
                        </div>

                        {/* Inline edit form OR content */}
                        {isEditing ? (
                            <div className="mt-1">
                                <textarea
                                    value={editText}
                                    onChange={e => setEditText(e.target.value)}
                                    rows={2}
                                    placeholder={t("comment_edit_placeholder")}
                                    className="w-full bg-muted/60 border border-primary/40 rounded-xl px-3 py-2 text-sm focus:outline-none resize-none"
                                    autoFocus
                                />
                                {editError && <p className="text-xs text-rose-500 mt-1">⚠ {editError}</p>}
                                <div className="flex gap-2 mt-2">
                                    <button onClick={handleSaveEdit} disabled={isSavingEdit || !editText.trim()}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground transition-colors font-medium disabled:opacity-50">
                                        {isSavingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                        {t("comment_save")}
                                    </button>
                                    <button onClick={() => { setIsEditing(false); setEditText(comment.content); setEditError(""); }}
                                        className="px-3 py-1.5 text-xs rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                                        {t("comment_cancel")}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[15px] text-foreground/80 leading-relaxed whitespace-pre-wrap break-words">{comment.content}</p>
                        )}

                        {/* Actions */}
                        {!isEditing && (
                            <div className="flex items-center gap-4 mt-3">
                                {level === 0 && canComment && (
                                    <button
                                        onClick={() => { setShowReplyForm(v => !v); setTimeout(() => textareaRef.current?.focus(), 100); }}
                                        className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors font-medium group"
                                    >
                                        <CornerDownRight className="h-3.5 w-3.5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                                        {t("comment_reply")}
                                    </button>
                                )}
                                {canEditComment(comment.userId) && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors font-medium"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                        {t("comment_edit")}
                                    </button>
                                )}
                                {canDeleteComment(comment.userId) && (
                                    <button
                                        onClick={() => onDelete(comment.id, comment.parentId ?? undefined)}
                                        className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-rose-500 transition-colors font-medium"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        {t("comment_delete")}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Reply form */}
                <AnimatePresence>
                    {showReplyForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden ml-11 mb-3"
                        >
                            <div className={`border rounded-xl p-3 bg-card/60 transition-colors ${replyTouched && !replyText.trim() ? "border-rose-400" : "border-border"}`}>
                                <textarea
                                    ref={textareaRef}
                                    value={replyText}
                                    onChange={e => { setReplyText(e.target.value); if (replyTouched) setReplyTouched(false); }}
                                    onBlur={() => setReplyTouched(true)}
                                    placeholder={t("comment_reply_placeholder")}
                                    rows={2}
                                    className="w-full bg-transparent resize-none text-sm placeholder:text-muted-foreground/50 focus:outline-none"
                                />
                                {replyTouched && !replyText.trim() && (
                                    <p className="text-xs text-rose-500 mt-1">⚠ {t("comment_required")}</p>
                                )}
                                {replyError && <p className="text-xs text-rose-500 mt-1">⚠ {replyError}</p>}
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => { setShowReplyForm(false); setReplyText(""); setReplyTouched(false); }}
                                    className="px-3 py-1.5 text-xs rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                                    {t("comment_cancel")}
                                </button>
                                <button onClick={handleReply} disabled={isSending}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50">
                                    {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                    {t("comment_send_reply")}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Nested replies */}
            {comment.replies?.map(reply => (
                <CommentItem
                    key={reply.id}
                    comment={reply}
                    noteId={noteId}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onReplyAdded={onReplyAdded}
                    level={1}
                    canDeleteComment={canDeleteComment}
                    canEditComment={canEditComment}
                    canComment={canComment}
                    isLoggedIn={isLoggedIn}
                    t={t}
                />
            ))}
        </div>
    );
}

interface CommentsSectionProps {
    noteId: string;
}

export function CommentsSection({ noteId }: CommentsSectionProps) {
    const { canComment, canDeleteComment, isKing, isLoggedIn, userId } = useAuth();
    const { t } = useLanguage();
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState("");
    const [touched, setTouched] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    /** User can only edit their own comment */
    const canEditComment = useCallback((authorId: string): boolean => {
        if (!isLoggedIn) return false;
        return userId === authorId;
    }, [isLoggedIn, userId]);

    const fetchComments = useCallback(async () => {
        // Silent background re-fetch — don't show spinner on polling ticks
        try {
            const res = await fetch(`/api/notes/${noteId}/comments`);
            if (res.ok) setComments(await res.json());
        } catch { /* silent */ }
    }, [noteId]);

    // Initial load (shows spinner)
    useEffect(() => {
        setIsLoading(true);
        fetchComments().finally(() => {
            setIsLoading(false);
            // After comments load, scroll to hash anchor if present (e.g. from notification click)
            if (typeof window !== "undefined" && window.location.hash) {
                const hash = window.location.hash;
                setTimeout(() => {
                    const el = document.querySelector(hash);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 300);
            }
        });
    }, [fetchComments]);

    // ─── Supabase Realtime subscription — replaces 20s polling ──────────
    useEffect(() => {
        // Subscribe to all changes on the Comment table filtered by noteId
        const channel = supabaseClient
            .channel(`comments:${noteId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "Comment", filter: `noteId=eq.${noteId}` },
                async (payload: { new: { id: string } }) => {
                    // Realtime payload only has raw DB columns — fetch full comment with user relation
                    try {
                        const res = await fetch(`/api/notes/${noteId}/comments`);
                        if (!res.ok) return;
                        const all: Comment[] = await res.json();
                        const inserted = all.find(c => c.id === payload.new.id);
                        if (!inserted) return;

                        setComments(prev => {
                            // Avoid duplicate (optimistic add from this user already applied)
                            if (prev.some(c => c.id === inserted.id)) return prev;
                            if (inserted.parentId) {
                                // It's a reply — append into parent's replies
                                return prev.map(c =>
                                    c.id === inserted.parentId
                                        ? { ...c, replies: [...(c.replies ?? []), inserted] }
                                        : c
                                );
                            }
                            return [...prev, inserted];
                        });
                    } catch { /* silent */ }
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "Comment", filter: `noteId=eq.${noteId}` },
                (payload: { new: Record<string, unknown> }) => {
                    const { id, content, parentId } = payload.new as { id: string; content: string; parentId: string | null };
                    setComments(prev => {
                        if (parentId) {
                            return prev.map(c =>
                                c.id === parentId
                                    ? { ...c, replies: c.replies.map(r => r.id === id ? { ...r, content } : r) }
                                    : c
                            );
                        }
                        return prev.map(c => c.id === id ? { ...c, content } : c);
                    });
                }
            )
            .on(
                "postgres_changes",
                { event: "DELETE", schema: "public", table: "Comment", filter: `noteId=eq.${noteId}` },
                (payload: { old: Record<string, unknown> }) => {
                    const { id, parentId } = payload.old as { id: string; parentId: string | null };
                    setComments(prev => {
                        if (parentId) {
                            return prev.map(c =>
                                c.id === parentId
                                    ? { ...c, replies: c.replies.filter(r => r.id !== id) }
                                    : c
                            );
                        }
                        return prev.filter(c => c.id !== id);
                    });
                }
            )
            .subscribe();

        return () => { supabaseClient.removeChannel(channel); };
    }, [noteId]);

    const handlePost = async () => {
        setTouched(true);
        if (!newComment.trim()) return;
        setIsSending(true);
        setError("");
        try {
            const res = await fetch(`/api/notes/${noteId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newComment.trim() }),
            });
            if (res.ok) {
                const comment = await res.json();
                setComments(prev => [...prev, comment]);
                setNewComment("");
                setTouched(false);
            } else {
                const err = await res.json();
                setError(err.error ?? t("comment_error_network"));
            }
        } catch {
            setError(t("comment_error_network"));
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = useCallback(async (id: string, parentId?: string) => {
        try {
            const res = await fetch(`/api/notes/${noteId}/comments/${id}`, { method: "DELETE" });
            if (res.ok) {
                setComments(prev => {
                    if (parentId) {
                        return prev.map(c => c.id === parentId
                            ? { ...c, replies: c.replies.filter(r => r.id !== id) }
                            : c
                        );
                    }
                    return prev.filter(c => c.id !== id);
                });
            }
        } catch { /* silent */ }
    }, [noteId]);

    const handleEdit = useCallback((id: string, newContent: string, parentId?: string) => {
        setComments(prev => {
            if (parentId) {
                return prev.map(c => c.id === parentId
                    ? { ...c, replies: c.replies.map(r => r.id === id ? { ...r, content: newContent } : r) }
                    : c
                );
            }
            return prev.map(c => c.id === id ? { ...c, content: newContent } : c);
        });
    }, []);

    const handleReplyAdded = useCallback((reply: Comment, parentId: string) => {
        setComments(prev => prev.map(c =>
            c.id === parentId ? { ...c, replies: [...(c.replies ?? []), reply] } : c
        ));
    }, []);

    const q = searchQuery.toLowerCase();
    const filteredComments = q
        ? comments.filter(c =>
            c.content.toLowerCase().includes(q) ||
            c.user.username.toLowerCase().includes(q) ||
            c.replies.some(r => r.content.toLowerCase().includes(q) || r.user.username.toLowerCase().includes(q))
        )
        : comments;

    const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0);

    return (
        <div className="mt-8 border-t border-border/50 pt-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-pink-100 dark:bg-pink-900/20 p-2.5 rounded-full">
                        <MessageCircle className="h-5 w-5 text-pink-500" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-foreground">
                        {t("comment_title")}
                        {totalCount > 0 && (
                            <span className="ml-2 text-lg font-medium text-muted-foreground/80">({totalCount})</span>
                        )}
                    </h3>
                </div>

                {totalCount > 2 && (
                    <div className="relative w-full sm:w-auto mt-2 sm:mt-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={t("comment_search")}
                            className="w-full sm:w-64 pl-10 pr-10 py-2.5 text-sm rounded-full border border-border/80 bg-card/40 focus:bg-card focus:border-pink-300 focus:ring-2 focus:ring-pink-100 dark:focus:border-pink-500/50 dark:focus:ring-pink-500/20 outline-none transition-all"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground bg-muted p-1 rounded-full">
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Composer */}
            {canComment ? (
                <div className="mb-10">
                    <div className={`border rounded-[2rem] p-5 md:p-6 bg-card/40 hover:bg-card/80 transition-all shadow-sm ${touched && !newComment.trim() ? "border-rose-400" : "border-border focus-within:border-pink-300 focus-within:ring-4 focus-within:ring-pink-50 dark:focus-within:border-pink-500/50 dark:focus-within:ring-pink-500/10"}`}>
                        <label className="text-base font-semibold mb-3 block text-foreground">
                            {t("comment_write")} <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            value={newComment}
                            onChange={e => { setNewComment(e.target.value); if (touched) setTouched(false); }}
                            onBlur={() => setTouched(true)}
                            placeholder="Share your thoughts..."
                            rows={3}
                            className="w-full bg-transparent resize-none text-[15px] placeholder:text-muted-foreground/60 focus:outline-none leading-relaxed"
                        />
                        {touched && !newComment.trim() && (
                            <p className="text-xs text-rose-500 mt-2 font-medium">⚠ {t("comment_required")}</p>
                        )}
                        {error && <p className="text-xs text-rose-500 mt-2 font-medium">⚠ {error}</p>}
                    </div>
                    <div className="flex justify-end mt-4">
                        <button
                            onClick={handlePost}
                            disabled={isSending || !newComment.trim()}
                            className="flex items-center gap-2.5 px-6 py-3 md:px-8 md:py-3.5 rounded-full bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:hover:bg-pink-900/50 text-[15px] md:text-base font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isSending ? <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" /> : <Send className="h-4 w-4 md:h-5 md:w-5" strokeWidth={2.5} />}
                            {t("comment_post")}
                        </button>
                    </div>
                </div>
            ) : !isLoggedIn ? (
                <div className="mb-8 rounded-2xl border border-dashed border-border p-6 text-center bg-card/30">
                    <MessageSquareDashed className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                        <a href="/login" className="text-primary hover:underline font-medium">{t("comment_login_link")}</a>{" "}
                        {t("comment_login_prompt")}
                    </p>
                </div>
            ) : null}

            {/* Comment list */}
            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            ) : filteredComments.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                    <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">{searchQuery ? t("comment_no_results") : t("comment_empty")}</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredComments.map(comment => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            noteId={noteId}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onReplyAdded={handleReplyAdded}
                            canDeleteComment={canDeleteComment}
                            canEditComment={canEditComment}
                            canComment={canComment}
                            isLoggedIn={isLoggedIn}
                            t={t}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
