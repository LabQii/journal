"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function AutoLogout() {
    const { status } = useSession();
    const router = useRouter();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastUpdateRef = useRef<number>(0);

    // 15 minutes in milliseconds
    const INACTIVITY_LIMIT = 15 * 60 * 1000;

    const resetTimer = () => {
        const now = Date.now();
        // Throttle to 1 second to avoid heavy CPU usage on mouse moves
        if (now - lastUpdateRef.current < 1000) return;
        lastUpdateRef.current = now;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (status === "authenticated") {
            timeoutRef.current = setTimeout(async () => {
                // Time's up! Sign the user out
                await signOut({ redirect: false });
                router.push("/login?expired=true");
            }, INACTIVITY_LIMIT);
        }
    };

    useEffect(() => {
        // Only track if user is logged in
        if (status !== "authenticated") return;

        // Events that represent user activity
        const events = [
            "mousedown",
            "mousemove",
            "keydown",
            "scroll",
            "touchstart",
            "click"
        ];

        // Reset timer on any of these events
        const handleActivity = () => resetTimer();

        // Initial setup
        resetTimer();

        // Add listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        // Cleanup
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
        // We INTENTIONALLY don't put resetTimer in the dependency array to avoid recreation thrashing,
        // but we DO depend on `status` to start tracking.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    return null; // This component doesn't render anything
}
