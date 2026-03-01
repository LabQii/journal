"use client";

import { useMusic } from "@/contexts/MusicContext";
import { Play, Pause, Music2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export function MusicPlayerButton() {
    const { isPlaying, toggle, isReady } = useMusic();
    const [showLabel, setShowLabel] = useState(false);

    return (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex flex-col items-end gap-2">
            {/* Tooltip label */}
            <AnimatePresence>
                {showLabel && (
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="bg-card border border-border text-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap backdrop-blur-sm"
                    >
                        {isPlaying ? "Pause music" : "Play music"}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Player button */}
            <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={toggle}
                onMouseEnter={() => setShowLabel(true)}
                onMouseLeave={() => setShowLabel(false)}
                title={isPlaying ? "Pause music" : "Play background music"}
                disabled={!isReady}
                className={`relative h-11 w-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border
          ${isPlaying
                        ? "bg-primary text-primary-foreground border-primary/50 shadow-primary/25"
                        : "bg-card/90 text-foreground border-border/60 hover:bg-muted"
                    } backdrop-blur-sm disabled:opacity-40`}
            >
                {/* Pulse rings when playing */}
                {isPlaying && (
                    <>
                        <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                        <span className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
                    </>
                )}
                <motion.span
                    key={isPlaying ? "pause" : "play"}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 30 }}
                    className="relative z-10"
                >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Music2 className="h-4 w-4" />}
                </motion.span>
            </motion.button>
        </div>
    );
}
