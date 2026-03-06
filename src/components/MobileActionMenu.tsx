"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function MobileActionMenu({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative flex items-center justify-end" ref={ref}>
            {/* Mobile Trigger */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(!open);
                }}
                className="p-2 sm:hidden text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors flex items-center justify-center"
                aria-label="Actions"
            >
                <MoreVertical className="h-5 w-5" />
            </button>

            {/* Desktop View (always visible >= sm) */}
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
                {children}
            </div>

            {/* Mobile Floating Dropdown (visible < sm when open) */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 bg-card/95 backdrop-blur-md border border-border/50 rounded-xl shadow-lg z-50 p-2 flex items-center gap-1.5 sm:hidden"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the bubble unless handled by child
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
