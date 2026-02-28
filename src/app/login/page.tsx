"use client";

import { User, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const translations = {
    id: {
        heading: "Selamat Datang",
        email_placeholder: "Username",
        password_placeholder: "Kata Sandi",
        signin: "Masuk",
        error_invalid: "Kredensial tidak valid.",
        error_generic: "Terjadi kesalahan.",
        signing_in: "Memproses...",
    },
    en: {
        heading: "Welcome",
        email_placeholder: "Username",
        password_placeholder: "Password",
        signin: "Sign In",
        error_invalid: "Invalid credentials.",
        error_generic: "An error occurred.",
        signing_in: "Signing in...",
    },
    jp: {
        heading: "ようこそ",
        email_placeholder: "ユーザー名",
        password_placeholder: "パスワード",
        signin: "サインイン",
        error_invalid: "無効な資格情報です。",
        error_generic: "エラーが発生しました。",
        signing_in: "サインイン中...",
    },
};

export default function LoginPage() {
    const { lang, setLang } = useLanguage();
    const tx = translations[lang];
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                username: username.trim(),
                password,
                redirect: false,
            });

            if (result?.error) {
                setError(tx.error_invalid);
            } else if (result?.ok) {
                router.push("/");
                router.refresh();
            }
        } catch {
            setError(tx.error_generic);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background overflow-hidden selection:bg-primary/20">
            {/* Back Home Button */}
            <Link
                href="/"
                className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all z-20 group"
            >
                <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-0.5 transition-transform" />
                <span>Home</span>
            </Link>

            {/* Minimalist Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-70 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 w-full max-w-[320px] px-4"
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">
                        {tx.heading}
                    </h1>
                    <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-muted-foreground/60">
                        C&amp;C Journal
                    </p>
                </div>

                {/* Form */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-3">
                        {/* Username Field */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <User className="h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={tx.email_placeholder}
                                required
                                className="w-full h-12 pl-10 pr-4 bg-muted/30 border border-border/50 rounded-2xl text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:bg-background focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all font-medium"
                            />
                        </div>

                        {/* Password Field */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={tx.password_placeholder}
                                required
                                className="w-full h-12 pl-10 pr-11 bg-muted/30 border border-border/50 rounded-2xl text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:bg-background focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all font-medium"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground/40 hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="overflow-hidden"
                        >
                            <div className="flex items-center justify-center gap-1.5 text-[13px] text-rose-500 bg-rose-500/10 rounded-xl px-3 py-2.5">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        </motion.div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-2xl bg-foreground text-background font-medium tracking-wide text-sm hover:opacity-90 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center shadow-lg shadow-black/5 dark:shadow-none"
                        >
                            {loading ? tx.signing_in : tx.signin}
                        </button>
                    </div>
                </form>

                {/* Footer (Lang Toggle) */}
                <div className="mt-10 flex justify-center">
                    <button
                        onClick={() => setLang(lang === "en" ? "id" : lang === "id" ? "jp" : "en")}
                        className="text-[10px] font-bold tracking-widest text-muted-foreground/40 hover:text-muted-foreground transition-colors uppercase px-3 py-1.5 rounded-full hover:bg-muted/50"
                    >
                        {lang === "en" ? "ID" : lang === "id" ? "JP" : "EN"}
                    </button>
                </div>

            </motion.div>
        </div>
    );
}
