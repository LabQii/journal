"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus, Shield, ShieldCheck, Mail, LogIn, Crown, User as UserIcon, Settings, Key, MoreVertical, Trash2, Pencil, Calendar, EyeOff, Loader2, Send, CheckCircle2, AlertCircle, UserPlus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AppRole } from "@/lib/userService";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import UserModal from "./UserModal";
import RoleModal from "./RoleModal";
import DeleteModal from "./DeleteModal";

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

export type User = {
    id: string;
    username: string;
    role: AppRole;
};

export default function UserDashboard() {
    const { user: currentUser } = useAuth();
    const { lang } = useLanguage();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Royal Greeting state
    const [greeting, setGreeting] = useState("");
    const [isSendingGreeting, setIsSendingGreeting] = useState(false);
    const [greetingSuccess, setGreetingSuccess] = useState(false);

    // Modals state
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/users");
            if (!res.ok) throw new Error("Failed to fetch users");
            const data = await res.json();
            setUsers(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = () => {
        setSelectedUser(null);
        setIsUserModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setIsUserModalOpen(true);
    };

    const handleChangeRole = (user: User) => {
        setSelectedUser(user);
        setIsRoleModalOpen(true);
    };

    const handleDeleteUser = (user: User) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleSendGreeting = async () => {
        if (!greeting.trim()) return;
        setIsSendingGreeting(true);
        try {
            const res = await fetch("/api/royal-greeting", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: greeting.trim() })
            });

            if (res.ok) {
                setGreeting("");
                setGreetingSuccess(true);
                setTimeout(() => setGreetingSuccess(false), 3000);
            } else {
                const data = await res.json();
                setError(data.error || "Failed to send greeting");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setIsSendingGreeting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">{lang === "id" ? "Memuat pengguna..." : lang === "jp" ? "ユーザーを読み込み中..." : "Loading users..."}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center max-w-md mx-auto mt-12">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
                <h3 className="text-lg font-bold text-destructive mb-2">
                    {lang === "id" ? "Gagal Memuat Pengguna" : lang === "jp" ? "ユーザーの読み込みに失敗しました" : "Error Loading Users"}
                </h3>
                <p className="text-sm text-destructive/80 mb-4">{error}</p>
                <button onClick={fetchUsers} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors">
                    {lang === "id" ? "Coba Lagi" : lang === "jp" ? "再試行" : "Try Again"}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-card border border-border/50 rounded-2xl p-4 sm:p-6 shadow-sm">
                <div>
                    <h2 className="text-lg font-bold">{lang === "id" ? "Total Pengguna" : lang === "jp" ? "合計ユーザー数" : "Total Users"}: {users.length}</h2>
                    <p className="text-sm text-muted-foreground">{lang === "id" ? "Hanya King yang dapat melihat dan mengatur daftar ini." : lang === "jp" ? "Kingロールのみがこのリストを表示および管理できます。" : "Only King role can see and manage this list."}</p>
                </div>
                <button
                    onClick={handleAddUser}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm hover:shadow active:scale-95"
                >
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">
                        {lang === "id" ? "Tambah Pengguna" : lang === "jp" ? "ユーザーを追加" : "Add New User"}
                    </span>
                    <span className="sm:hidden">
                        {lang === "id" ? "Tambah" : lang === "jp" ? "追加" : "Add"}
                    </span>
                </button>
            </div>

            {/* Royal Greeting Section */}
            {(currentUser as any)?.role === "king" && (
                <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-5 sm:p-7 shadow-sm overflow-hidden relative">

                    {/* Subtle King Background Logo */}
                    <Crown className="absolute -right-6 -bottom-8 w-48 h-48 text-amber-500/5 dark:text-amber-500/10 rotate-12 pointer-events-none" />

                    <div className="relative z-10 w-full">
                        <div className="flex items-center gap-2.5 mb-2">
                            <Crown className="w-5 h-5 text-amber-500" />
                            <h3 className="text-xl font-extrabold text-foreground tracking-tight">Royal Greeting</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-5 max-w-xl leading-relaxed">
                            {lang === "id"
                                ? "Kirimkan pesan sapaan untuk Queen. Pesan ini akan muncul secara elegan saat ia membuka jurnal."
                                : lang === "jp"
                                    ? "Queenに挨拶のメッセージを送信します。このメッセージは、彼女がジャーナルを開いたときにエレガントに表示されます。"
                                    : "Send a personalized greeting to the Queen. It will appear elegantly when she opens the journal."}
                        </p>

                        <div className="bg-background border border-border/50 rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-amber-200 focus-within:border-amber-300 transition-all">
                            <textarea
                                value={greeting}
                                onChange={(e) => setGreeting(e.target.value.slice(0, 120))}
                                placeholder={lang === "id" ? "Tulis sapaan manismu di sini..." : lang === "jp" ? "ここにあなたの甘い挨拶を書いてください..." : "Write your sweet greeting here..."}
                                className="w-full bg-transparent resize-none p-4 pb-2 text-sm sm:text-base min-h-[90px] text-foreground focus:outline-none placeholder:text-muted-foreground/50"
                                rows={2}
                                maxLength={120}
                            />
                            <div className="bg-muted/20 border-t border-border/40 px-4 py-3 flex items-center justify-between">
                                <span className={`text-xs font-medium tracking-wide ${greeting.length > 100 ? "text-amber-500" : "text-muted-foreground"
                                    }`}>
                                    {greeting.length} / 120
                                </span>

                                <button
                                    onClick={handleSendGreeting}
                                    disabled={!greeting.trim() || isSendingGreeting || greetingSuccess}
                                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 font-semibold text-sm transition-colors disabled:bg-muted disabled:text-muted-foreground dark:disabled:bg-muted/50 disabled:cursor-not-allowed active:scale-[0.98]"
                                >
                                    {isSendingGreeting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : greetingSuccess ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    {greetingSuccess
                                        ? (lang === "id" ? "Terkirim!" : lang === "jp" ? "送信しました！" : "Sent!")
                                        : (lang === "id" ? "Kirim Pesan" : lang === "jp" ? "挨拶を送信" : "Send Greeting")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border/50">
                                <th className="px-6 py-4">{lang === "id" ? "Nama Pengguna" : lang === "jp" ? "ユーザー名" : "Username"}</th>
                                <th className="px-6 py-4">{lang === "id" ? "Peran" : lang === "jp" ? "ロール" : "Role"}</th>
                                <th className="px-6 py-4 text-right">{lang === "id" ? "Aksi" : lang === "jp" ? "アクション" : "Actions"}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {users.map((user) => {
                                const isSelf = (currentUser as any)?.id === user.id;
                                return (
                                    <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3.5">
                                                <div className={`relative h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-sm ring-2 ring-white ${user.role === "king"
                                                    ? "bg-gradient-to-br from-blue-400 to-blue-600 ring-offset-2 ring-offset-blue-50"
                                                    : "bg-gradient-to-br from-violet-400 to-violet-600 ring-offset-2 ring-offset-violet-50"
                                                    }`}>
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm flex items-center gap-2">
                                                        {user.username}
                                                        {isSelf && (
                                                            <span className="text-[9px] bg-muted/60 border border-border/50 px-1.5 py-0.5 rounded text-muted-foreground font-bold tracking-wider uppercase">
                                                                {lang === "id" ? "Kamu" : lang === "jp" ? "あなた" : "You"}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${user.role === "king"
                                                ? "bg-amber-50 text-amber-700 border-amber-200 shadow-sm shadow-amber-500/10 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/50"
                                                : "bg-rose-50 text-rose-700 border-rose-200 shadow-sm shadow-rose-500/10 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-700/50"
                                                }`}>
                                                <Crown className={`h-4 w-4 ${user.role === "king" ? "text-amber-500" : "text-rose-500"}`} />
                                                <span className="uppercase tracking-wider">{user.role === "king" ? "King" : "Queen"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                {/* Desktop Actions */}
                                                <div className="hidden md:flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEditUser(user)}
                                                        className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                                        title={lang === "id" ? "Edit kredensial" : lang === "jp" ? "認証情報を編集" : "Edit credentials"}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleChangeRole(user)}
                                                        className="p-1.5 sm:p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                                                        title={lang === "id" ? "Ubah peran" : lang === "jp" ? "ロールを変更" : "Change role"}
                                                    >
                                                        <Shield className="h-4 w-4" />
                                                    </button>
                                                    {!isSelf && (
                                                        <button
                                                            onClick={() => handleDeleteUser(user)}
                                                            className="p-1.5 sm:p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                                            title={lang === "id" ? "Hapus pengguna" : lang === "jp" ? "ユーザーを削除" : "Delete user"}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Mobile 3-dot Actions */}
                                                <MobileActionMenu>
                                                    <button
                                                        onClick={() => handleEditUser(user)}
                                                        className="flex items-center gap-2 px-3 py-2 w-full text-left rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                                                    >
                                                        <Pencil className="h-4 w-4" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleChangeRole(user)}
                                                        className="flex items-center gap-2 px-3 py-2 w-full text-left rounded-lg text-sm font-medium text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors"
                                                    >
                                                        <Shield className="h-4 w-4" /> Change Role
                                                    </button>
                                                    {!isSelf && (
                                                        <button
                                                            onClick={() => handleDeleteUser(user)}
                                                            className="flex items-center gap-2 px-3 py-2 w-full text-left rounded-lg text-sm font-medium text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" /> Delete
                                                        </button>
                                                    )}
                                                </MobileActionMenu>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <UserModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSuccess={fetchUsers}
                user={selectedUser}
            />

            <RoleModal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                onSuccess={fetchUsers}
                user={selectedUser}
            />

            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onSuccess={fetchUsers}
                user={selectedUser}
            />
        </div>
    );
}
