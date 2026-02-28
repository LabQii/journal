"use client";

import { useState, useEffect } from "react";
import { UserPlus, Pencil, Shield, Trash2, Loader2, AlertCircle, Crown } from "lucide-react";
import { AppRole } from "@/lib/userService";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import UserModal from "./UserModal";
import RoleModal from "./RoleModal";
import DeleteModal from "./DeleteModal";

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
                                            <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                                    title={lang === "id" ? "Edit kredensial" : lang === "jp" ? "認証情報を編集" : "Edit credentials"}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleChangeRole(user)}
                                                    className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md transition-colors"
                                                    title={lang === "id" ? "Ubah peran" : lang === "jp" ? "ロールを変更" : "Change role"}
                                                >
                                                    <Shield className="h-4 w-4" />
                                                </button>
                                                {!isSelf && (
                                                    <button
                                                        onClick={() => handleDeleteUser(user)}
                                                        className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                                                        title={lang === "id" ? "Hapus pengguna" : lang === "jp" ? "ユーザーを削除" : "Delete user"}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
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
