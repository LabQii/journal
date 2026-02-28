"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Lock, BookMarked, LogIn, ArrowLeft } from "lucide-react";

function AuthRequiredContent() {
    const params = useSearchParams();
    const from = params.get("from") ?? "/";

    const isNotes = from.startsWith("/notes");
    const isGallery = from.startsWith("/gallery");

    const featureName = isNotes ? "Notes" : isGallery ? "Gallery" : "this page";
    const featureDesc = isNotes
        ? "halaman Notes berisi jurnal & catatan pribadi yang bersifat privat."
        : isGallery
            ? "halaman Gallery berisi koleksi foto pribadi yang bersifat privat."
            : "halaman ini hanya bisa diakses oleh pengguna yang login.";

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            {/* Background blobs */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
            <div className="fixed top-20 left-10 -z-10 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
            <div className="fixed bottom-0 right-10 -z-10 w-72 h-72 bg-secondary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />

            <div className="w-full max-w-md">
                <div className="bg-card/80 backdrop-blur-md border border-border rounded-3xl shadow-xl p-8 text-center space-y-6">
                    {/* Icon */}
                    <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <Lock className="h-9 w-9 text-primary" />
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight">
                            {featureName} — Akses Terbatas
                        </h1>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Maaf, {featureDesc}
                        </p>
                        <p className="text-muted-foreground text-sm">
                            Silakan <strong>login</strong> untuk mengakses halaman ini.
                        </p>
                    </div>

                    {/* What guests can access */}
                    <div className="bg-muted/40 border border-border/60 rounded-2xl p-4 text-left space-y-2.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Akses tamu (tanpa login)
                        </p>
                        <div className="flex items-center gap-2.5 text-sm">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
                                <span className="text-emerald-500 text-xs font-bold">✓</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <BookMarked className="h-3.5 w-3.5 text-secondary" />
                                <span>Melihat daftar <strong>Books</strong> (read-only)</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm">
                            <div className="w-5 h-5 rounded-full bg-rose-500/15 flex items-center justify-center">
                                <span className="text-rose-500 text-xs font-bold">✗</span>
                            </div>
                            <span className="text-muted-foreground">Notes, Gallery, CRUD — butuh login</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <Link
                            href={`/login?callbackUrl=${encodeURIComponent(from)}`}
                            className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-2xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
                        >
                            <LogIn className="h-4 w-4" />
                            Login Sekarang
                        </Link>
                        <Link
                            href="/"
                            className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-medium transition-colors text-sm"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kembali ke Beranda
                        </Link>
                    </div>
                </div>

                {/* Footer note */}
                <p className="text-center text-xs text-muted-foreground mt-4">
                    C&amp;C Journal — private digital journal
                </p>
            </div>
        </div>
    );
}

export default function AuthRequiredPage() {
    return (
        <Suspense>
            <AuthRequiredContent />
        </Suspense>
    );
}
