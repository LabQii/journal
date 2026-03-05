"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export function AccessTracker() {
    const { data: session } = useSession();
    const isQueen = (session?.user as any)?.role === "queen";
    const loggedRef = useRef(false);

    useEffect(() => {
        if (!isQueen) return;

        const checkAndLogAccess = async () => {
            if (loggedRef.current) return;

            try {
                // Check if we already logged in the last 30 minutes
                const lastLogStr = localStorage.getItem("lastAccessLog");
                const now = Date.now();
                const THIRTY_MINUTES = 30 * 60 * 1000;

                if (lastLogStr) {
                    const lastLogTime = parseInt(lastLogStr, 10);
                    if (!isNaN(lastLogTime) && (now - lastLogTime < THIRTY_MINUTES)) {
                        // Avoid spamming
                        return;
                    }
                }

                const res = await fetch("/api/access", {
                    method: "POST",
                });

                if (res.ok) {
                    localStorage.setItem("lastAccessLog", now.toString());
                    loggedRef.current = true;
                }
            } catch (err) {
                console.error("Failed to log access", err);
            }
        };

        checkAndLogAccess();
    }, [isQueen]);

    return null; // This is a logic-only component
}
