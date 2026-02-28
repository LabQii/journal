import { useState, useEffect } from "react";
import { User } from "./UserDashboard";
import { AppRole } from "@/lib/userService";
import { X, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: User | null; // if null -> Create mode; if object -> Edit mode
}

export default function UserModal({ isOpen, onClose, onSuccess, user }: UserModalProps) {
    const isEdit = !!user;
    const { lang } = useLanguage();

    // Form state
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<AppRole>("queen");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (isEdit && user) {
                setUsername(user.username);
                setPassword(""); // Intentionally empty initially
                setRole(user.role);
            } else {
                setUsername("");
                setPassword("");
                setRole("queen");
            }
            setError(null);
        }
    }, [isOpen, isEdit, user]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (isEdit) {
                // Edit
                const payload: any = {};
                if (username !== user?.username) payload.username = username;
                if (password) payload.password = password; // Only send if user typed something

                if (Object.keys(payload).length === 0) {
                    onClose();
                    return; // No changes
                }

                const res = await fetch(`/api/users/${user?.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to update user");
                }
            } else {
                // Create
                const res = await fetch("/api/users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password, role }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to create user");
                }
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm sm:items-center">
            <div
                className="w-full max-w-md bg-card border border-border/50 shadow-2xl rounded-2xl overflow-hidden"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                    <h3 className="text-lg font-bold">
                        {isEdit ? (lang === "id" ? "Edit Pengguna" : lang === "jp" ? "ユーザーを編集" : "Edit User") : (lang === "id" ? "Tambah Pengguna Baru" : lang === "jp" ? "新しいユーザーを追加" : "Add New User")}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold mb-1.5" htmlFor="username">
                            {lang === "id" ? "Nama Pengguna" : lang === "jp" ? "ユーザー名" : "Username"} <span className="text-destructive">*</span>
                        </label>
                        <input
                            id="username"
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder={lang === "id" ? "Masukkan username" : lang === "jp" ? "ユーザー名を入力" : "Enter username"}
                            className="w-full px-3 py-2 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1.5" htmlFor="password">
                            Password {isEdit ? <span className="text-xs text-muted-foreground font-normal ml-1">({lang === "id" ? "Biarkan kosong untuk mempertahankan saat ini" : lang === "jp" ? "現在のままにする場合は空白にしてください" : "Leave empty to keep current"})</span> : <span className="text-destructive">*</span>}
                        </label>
                        <input
                            id="password"
                            type="password"
                            required={!isEdit}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={isEdit ? (lang === "id" ? "Masukkan password baru" : lang === "jp" ? "新しいパスワードを入力" : "Enter new password") : (lang === "id" ? "Masukkan password" : lang === "jp" ? "パスワードを入力" : "Enter password")}
                            className="w-full px-3 py-2 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                        />
                    </div>

                    {!isEdit && (
                        <div>
                            <label className="block text-sm font-semibold mb-1.5" htmlFor="role">
                                {lang === "id" ? "Peran (Role)" : lang === "jp" ? "ロール" : "Role"} <span className="text-destructive">*</span>
                            </label>
                            <select
                                id="role"
                                required
                                value={role}
                                onChange={(e) => setRole(e.target.value as AppRole)}
                                className="w-full px-3 py-2.5 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background form-select"
                            >
                                <option value="queen">Queen</option>
                                <option value="king">King</option>
                            </select>
                            <p className="mt-1.5 text-xs text-muted-foreground">
                                {lang === "id" ? "Queen hanya dapat membuat/membaca konten. King memiliki akses admin penuh." : lang === "jp" ? "Queenはコンテンツの作成/読み取りのみ可能です。Kingは完全な管理者アクセス権を持っています。" : "Queen can only create/read content. King has full admin access."}
                            </p>
                        </div>
                    )}

                    <div className="pt-4 mt-2 flex justify-end gap-3 border-t border-border/50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-xl transition-colors"
                        >
                            {lang === "id" ? "Batal" : lang === "jp" ? "キャンセル" : "Cancel"}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isEdit ? (lang === "id" ? "Simpan Perubahan" : lang === "jp" ? "変更を保存" : "Save Changes") : (lang === "id" ? "Buat Pengguna" : lang === "jp" ? "ユーザーを作成" : "Create User")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
