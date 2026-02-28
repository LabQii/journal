"use client";

import { useSession } from "next-auth/react";

export function useAuth() {
    const { data: session, status } = useSession();
    const isLoggedIn = status === "authenticated" && !!session?.user;
    const role = (session?.user as any)?.role as string | undefined;
    const username = (session?.user as any)?.username as string | undefined;

    const isKing = isLoggedIn && role === "king";
    const isQueen = isLoggedIn && role === "queen";

    return {
        user: session?.user ?? null,
        username: username ?? null,
        role: role ?? null,
        isLoggedIn,
        isKing,
        isQueen,
        isLoading: status === "loading",
        /** Queen and King can create content (notes, books, gallery) */
        canCreate: isLoggedIn,
        /** Only King can update content */
        canUpdate: isKing,
        /** Only King can delete content */
        canDelete: isKing,
        /** Only King can manage users (CRUD) */
        canManageUsers: isKing,
        /** Only King can change user roles */
        canChangeRole: isKing,
    };
}
