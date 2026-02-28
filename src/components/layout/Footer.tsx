"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function Footer() {
    const { t, lang } = useLanguage();
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus("loading");
        try {
            const res = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setStatus("success");
                setEmail("");
            } else {
                setStatus("error");
            }
        } catch {
            setStatus("error");
        }
    };
    return (
        <footer className="w-full border-t border-primary/20 bg-background/50">
            <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-10 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center space-x-2 mb-4">
                            <span className="font-bold text-lg tracking-tight">{t("brand")}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {t("footer_desc")}
                        </p>
                    </div>
                    <div>
                        <h3 className="font-medium mb-4">{t("footer_journal")}</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><a href="/notes" className="hover:text-accent transition-colors">{t("footer_latest")}</a></li>
                            <li><a href="/notes" className="hover:text-accent transition-colors">{t("footer_stories")}</a></li>
                            <li><a href="/gallery" className="hover:text-accent transition-colors">{t("footer_memories")}</a></li>
                            <li><a href="/books" className="hover:text-accent transition-colors">{t("footer_books")}</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-medium mb-4">{t("footer_moments")}</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><a href="/gallery" className="hover:text-accent transition-colors">{t("footer_moments")}</a></li>
                            <li><a href="/books" className="hover:text-accent transition-colors">{t("footer_moments2")}</a></li>
                            <li><a href="/notes" className="hover:text-accent transition-colors">{t("footer_moments3")}</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-medium mb-4">{t("footer_newsletter")}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{t("footer_newsletter_desc")}</p>
                        <form onSubmit={handleSubscribe} className="flex relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={status === "loading" || status === "success"}
                                required
                                placeholder={status === "success" ? (lang === "id" ? "Berlangganan sukses!" : lang === "jp" ? "登録が完了しました！" : "Subscribed successfully!") : t("footer_newsletter_placeholder")}
                                className="flex h-9 w-full rounded-l-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={status === "loading" || status === "success"}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-r-md px-3 text-sm font-medium transition-colors disabled:opacity-50 flex items-center"
                            >
                                {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("footer_newsletter_btn")}
                            </button>
                        </form>
                        {status === "error" && (
                            <p className="text-rose-500 text-xs mt-2">{lang === "id" ? "Gagal berlangganan. Silakan coba lagi." : lang === "jp" ? "登録に失敗しました。もう一度お試しください。" : "Failed to subscribe. Please try again."}</p>
                        )}
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <p>{t("footer_copyright")}</p>
                    <div className="flex space-x-4">
                        <a href="#" className="hover:text-accent transition-colors">{t("footer_terms")}</a>
                        <a href="#" className="hover:text-accent transition-colors">{t("footer_privacy")}</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
