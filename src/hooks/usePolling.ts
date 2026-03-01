import { useEffect, useRef } from "react";

/**
 * Calls `fn` every `intervalMs` milliseconds, but ONLY when the browser tab
 * is visible. This keeps data fresh for all users without wasting requests
 * when the tab is in the background.
 *
 * @param fn       Async function to call on each tick (e.g. re-fetch data)
 * @param intervalMs  Milliseconds between ticks (default 30 000 = 30 s)
 * @param enabled  Set to false to pause polling (e.g. while a modal is open)
 */
export function usePolling(
    fn: () => void | Promise<void>,
    intervalMs = 30_000,
    enabled = true
) {
    const fnRef = useRef(fn);
    fnRef.current = fn; // always call the latest version

    useEffect(() => {
        if (!enabled) return;

        const tick = () => {
            if (document.visibilityState === "visible") {
                fnRef.current();
            }
        };

        const id = setInterval(tick, intervalMs);

        // Also re-fetch immediately when the user switches back to this tab
        const onVisible = () => {
            if (document.visibilityState === "visible") {
                fnRef.current();
            }
        };
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            clearInterval(id);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [intervalMs, enabled]);
}
