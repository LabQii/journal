"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Trash2, CornerDownRight, Search, X, Crown, Loader2, MessageSquareDashed, Pencil, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePolling } from "@/hooks/usePolling";

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
        <div className={`${level > 0 ? "ml-6 md:ml-10 border-l-2 border-border/50 pl-4" : ""}`}>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative"
            >
                <div className="flex items-start gap-3 py-3">
                    {/* Avatar */}
                    <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs uppercase
                        ${comment.user.role === "king"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
                        }`}>
                        {comment.user.username.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-sm font-semibold">{comment.user.username}</span>
                            <RoleBadge role={comment.user.role} />
                            <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt, t)}</span>
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
                            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">{comment.content}</p>
                        )}

                        {/* Actions */}
                        {!isEditing && (
                            <div className="flex items-center gap-3 mt-2">
                                {level === 0 && canComment && (
                                    <button
                                        onClick={() => { setShowReplyForm(v => !v); setTimeout(() => textareaRef.current?.focus(), 100); }}
                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                                    >
                                        <CornerDownRight className="h-3 w-3" />
                                        {t("comment_reply")}
                                    </button>
                                )}
                                {canEditComment(comment.userId) && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <Pencil className="h-3 w-3" />
                                        {t("comment_edit")}
                                    </button>
                                )}
                                {canDeleteComment(comment.userId) && (
                                    <button
                                        onClick={() => onDelete(comment.id, comment.parentId ?? undefined)}
                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 className="h-3 w-3" />
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
        fetchComments().finally(() => setIsLoading(false));
    }, [fetchComments]);

    // Background polling every 20s — paused while user is typing a reply
    usePolling(fetchComments, 20_000, !newComment.trim());

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
        <div className="mt-12 border-t border-border/50 pt-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-bold">
                        {t("comment_title")}
                        {totalCount > 0 && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">({totalCount})</span>
                        )}
                    </h3>
                </div>

                {totalCount > 2 && (
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={t("comment_search")}
                            className="pl-8 pr-8 py-2 text-sm rounded-full border border-border bg-card/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all w-48"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Composer */}
            {canComment ? (
                <div className="mb-8">
                    <div className={`border rounded-2xl p-4 bg-card/60 backdrop-blur-sm transition-colors ${touched && !newComment.trim() ? "border-rose-400" : "border-border focus-within:border-primary/60"}`}>
                        <label className="text-sm font-medium mb-2 block">
                            {t("comment_write")} <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            value={newComment}
                            onChange={e => { setNewComment(e.target.value); if (touched) setTouched(false); }}
                            onBlur={() => setTouched(true)}
                            placeholder={t("comment_write_placeholder")}
                            rows={3}
                            className="w-full bg-transparent resize-none text-sm placeholder:text-muted-foreground/50 focus:outline-none"
                        />
                        {touched && !newComment.trim() && (
                            <p className="text-xs text-rose-500 mt-1">⚠ {t("comment_required")}</p>
                        )}
                        {error && <p className="text-xs text-rose-500 mt-1">⚠ {error}</p>}
                    </div>
                    <div className="flex justify-end mt-4">
                        <button
                            onClick={handlePost}
                            disabled={isSending}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                        >
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
                <div className="divide-y divide-border/50">
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
