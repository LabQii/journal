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
                // Check if we already logged in this session
                const hasLogged = sessionStorage.getItem("hasLoggedAccess");

                if (hasLogged) {
                    return;
                }

                const res = await fetch("/api/access", {
                    method: "POST",
                });

                if (res.ok) {
                    sessionStorage.setItem("hasLoggedAccess", "true");
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
