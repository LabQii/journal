"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMusic } from "@/contexts/MusicContext";

interface Greeting {
    id: string;
    content: string;
    isSeen: boolean;
}

export function RoyalGreetingAlert() {
    const { data: session } = useSession();
    const role = (session?.user as any)?.role;
    const { lang } = useLanguage();
    const { isPlaying, volume, setVolume } = useMusic();

    const [greeting, setGreeting] = useState<Greeting | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Track original volume for restoring after notification sound
    const originalVolumeRef = useRef<number>(volume);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const checkGreeting = useCallback(async () => {
        if (role !== "queen") return;

        try {
            const res = await fetch("/api/royal-greeting");
            if (res.ok) {
                const data = await res.json();
                if (data && !data.isSeen) {
                    setGreeting(data);
                    setIsVisible(true);

                    // Trigger sound and ducking
                    if (isPlaying) {
                        originalVolumeRef.current = volume;
                        setVolume(Math.max(0.05, volume * 0.2)); // Duck volume to 20%
                    }

                    if (!audioRef.current) {
                        audioRef.current = new Audio("/sounds/notification.mp3");
                        audioRef.current.volume = 0.8;
                    }
                    audioRef.current.play().catch((err: unknown) => {
                        // Browser autoplay policy blocks audio without a prior user gesture — this is expected and harmless.
                        if (err instanceof DOMException && err.name === "NotAllowedError") return;
                        console.error("Failed to play notification sound:", err);
                    });
                }
            }
        } catch (error) {
            console.error("Failed to fetch royal greeting:", error);
        }
    }, [role]);

    // Initial check on load, and then interval polling
    useEffect(() => {
        if (role !== "queen") return;

        checkGreeting();

        // Poll every 60 seconds — the window focus handler gives near-instant feel when switching tabs
        const interval = setInterval(checkGreeting, 60000);

        // Also check immediately when the window regains focus (user switches back to the tab)
        const handleFocus = () => checkGreeting();
        window.addEventListener("focus", handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener("focus", handleFocus);
        };
    }, [role, checkGreeting]);

    // Mark as seen logic (fires when user dismisses or automatically after time)
    const handleDismiss = async () => {
        setIsVisible(false);

        // Restore volume if it was ducked
        if (isPlaying && originalVolumeRef.current !== undefined) {
            setVolume(originalVolumeRef.current);
        }

        if (greeting) {
            try {
                await fetch("/api/royal-greeting", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: greeting.id })
                });
            } catch (e) {
                console.error("Failed to dismiss greeting:", e);
            }
        }
    };

    // Auto-dismiss after 6 seconds
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                handleDismiss();
            }, 6000);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    if (role !== "queen") return null;

    return (
        <AnimatePresence>
            {isVisible && greeting && (
                <motion.div
                    initial={{ opacity: 0, y: -40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95, filter: "blur(4px)" }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm pointer-events-auto"
                >
                    <div className="relative overflow-hidden bg-[#fcfaf7]/95 dark:bg-[#1a1614]/95 backdrop-blur-xl border border-amber-200/50 dark:border-amber-900/40 shadow-lg shadow-amber-900/5 rounded-2xl p-4 sm:p-5">

                        {/* Decorative background */}
                        <div className="absolute -top-4 -right-4 text-amber-500/5 dark:text-amber-500/10 pointer-events-none">
                            <Crown className="w-24 h-24 rotate-12" />
                        </div>

                        <button
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 p-1.5 text-amber-900/40 hover:text-amber-900 dark:text-amber-100/40 dark:hover:text-amber-100 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 rounded-full transition-colors z-10"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-start gap-3 relative z-10">
                            <div className="flex-shrink-0 mt-0.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 border border-amber-300/30 dark:border-amber-700/30 flex items-center justify-center shadow-inner">
                                    <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>
                            <div className="flex-1 pr-6">
                                <h4 className="text-[11px] font-bold tracking-widest uppercase text-amber-800/60 dark:text-amber-400/60 mb-1">
                                    {lang === "id" ? "Pesan dari King" : lang === "jp" ? "Kingからのメッセージ" : "Message from the King"}
                                </h4>
                                <p className="text-[15px] font-medium text-amber-950 dark:text-amber-50 leading-relaxed">
                                    {greeting.content}
                                </p>
                            </div>
                        </div>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
