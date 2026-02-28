import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Server-side guard for /gallery.
 * This is the second protection layer after middleware.ts.
 * Even if middleware is bypassed somehow, no gallery data or UI is ever served to guests.
 */
export default async function GalleryLayout({ children }: { children: ReactNode }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect("/login?callbackUrl=/gallery");
    }
    return <>{children}</>;
}
