"use client";

import { SessionProvider } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            {/* Ambient background blobs */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/25 via-background to-background" />
            <div className="fixed top-20 left-10 -z-10 w-72 h-72 bg-primary/35 rounded-full mix-blend-multiply filter blur-3xl opacity-35 animate-blob" />
            <div className="fixed top-40 right-10 -z-10 w-72 h-72 bg-secondary/35 rounded-full mix-blend-multiply filter blur-3xl opacity-35 animate-blob animation-delay-2000" />
            <div className="fixed -bottom-8 left-40 -z-10 w-72 h-72 bg-accent/35 rounded-full mix-blend-multiply filter blur-3xl opacity-35 animate-blob animation-delay-4000" />
            <Navbar />
            <main className="flex-1 w-full flex flex-col pt-6 pb-16 md:pb-24">
                {children}
            </main>
            <Footer />
        </SessionProvider>
    );
}
