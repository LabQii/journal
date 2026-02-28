import { useState, useEffect } from "react";
import { User } from "./UserDashboard";
import { AppRole } from "@/lib/userService";
import { X, Loader2, ShieldAlert, Crown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface RoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: User | null;
}

export default function RoleModal({ isOpen, onClose, onSuccess, user }: RoleModalProps) {
    const { lang } = useLanguage();
    const [role, setRole] = useState<AppRole>("queen");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && user) {
            setRole(user.role);
            setError(null);
        }
    }, [isOpen, user]);

    if (!isOpen || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (role === user.role) {
            onClose(); // No change
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/users/${user.id}/role`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to change role");
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
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-blue-500" /> {lang === "id" ? "Ubah Peran" : lang === "jp" ? "ロールを変更" : "Change Role"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-foreground/80 mb-4">
                        {lang === "id" ? "Ubah tingkat akses untuk" : lang === "jp" ? "次のアクセスレベルを変更：" : "Change access level for"} <strong className="font-semibold">{user.username}</strong>.
                    </p>

                    {error && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold mb-3">
                            {lang === "id" ? "Pilih Peran Baru" : lang === "jp" ? "新しいロールを選択" : "Select New Role"}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className={`
                                flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all
                                ${role === "queen" ? "border-rose-400 bg-rose-50 dark:bg-rose-900/20" : "border-border/50 hover:bg-muted/50"}
                            `}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="queen"
                                    checked={role === "queen"}
                                    onChange={() => setRole("queen")}
                                    className="sr-only"
                                />
                                <div className={`mb-2 flex items-center justify-center h-10 w-10 rounded-full transition-all ${role === "queen" ? "bg-rose-100 dark:bg-rose-900/50 scale-110" : "bg-slate-100 dark:bg-slate-800 opacity-50 grayscale scale-90"}`}>
                                    <Crown className={`h-5 w-5 ${role === "queen" ? "text-rose-500" : "text-slate-400"}`} />
                                </div>
                                <span className={`font-bold ${role === "queen" ? "text-rose-700 dark:text-rose-400" : "text-muted-foreground"}`}>Queen</span>
                            </label>

                            <label className={`
                                flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all
                                ${role === "king" ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20" : "border-border/50 hover:bg-muted/50"}
                            `}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="king"
                                    checked={role === "king"}
                                    onChange={() => setRole("king")}
                                    className="sr-only"
                                />
                                <div className={`mb-2 flex items-center justify-center h-10 w-10 rounded-full transition-all ${role === "king" ? "bg-amber-100 dark:bg-amber-900/50 scale-110" : "bg-slate-100 dark:bg-slate-800 opacity-50 grayscale scale-90"}`}>
                                    <Crown className={`h-5 w-5 ${role === "king" ? "text-amber-500" : "text-slate-400"}`} />
                                </div>
                                <span className={`font-bold ${role === "king" ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"}`}>King</span>
                            </label>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground text-center">
                            {role === "queen"
                                ? (lang === "id" ? "Queen dapat membuat dan membaca konten website, tapi tidak dapat mengatur pengguna." : lang === "jp" ? "Queenはウェブサイトのコンテンツを作成および読み書きできますが、ユーザーを管理することはできません。" : "Queen can create and read website content, but cannot manage users.")
                                : (lang === "id" ? "King memiliki akses administratif penuh termasuk manajemen pengguna." : lang === "jp" ? "Kingはユーザー管理を含む完全な管理者アクセス権を持っています。" : "King has full administrative access including user management.")}
                        </p>
                    </div>

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
                            disabled={isLoading || role === user.role}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {lang === "id" ? "Perbarui Peran" : lang === "jp" ? "ロールを更新" : "Update Role"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
