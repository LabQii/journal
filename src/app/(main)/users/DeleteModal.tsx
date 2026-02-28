import { useState } from "react";
import { User } from "./UserDashboard";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: User | null;
}

export default function DeleteModal({ isOpen, onClose, onSuccess, user }: DeleteModalProps) {
    const { lang } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !user) return null;

    const handleDelete = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete user");
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
                className="w-full max-w-sm bg-card border border-border/50 shadow-2xl rounded-2xl overflow-hidden"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-red-600 dark:text-red-500">
                        <AlertTriangle className="h-5 w-5" /> {lang === "id" ? "Hapus Pengguna" : lang === "jp" ? "ユーザーを削除" : "Delete User"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="text-sm">
                        <p className="mb-2">
                            {lang === "id" ? "Apakah Anda yakin ingin menghapus" : lang === "jp" ? "次のユーザーを削除してもよろしいですか：" : "Are you sure you want to delete"} <strong className="font-semibold">{user.username}</strong>?
                        </p>
                        <p className="text-muted-foreground">
                            {lang === "id" ? "Tindakan ini tidak dapat dibatalkan. Pengguna akan dihapus secara permanen dari sistem. Konten yang dibuat oleh pengguna ini akan tetap ada." : lang === "jp" ? "この操作は元に戻せません。ユーザーはシステムから完全に削除されます。このユーザーが作成したコンテンツは残ります。" : "This action cannot be undone. The user will be permanently removed from the system. Content created by this user will remain."}
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
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {lang === "id" ? "Hapus Pengguna" : lang === "jp" ? "ユーザーを削除" : "Delete User"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
