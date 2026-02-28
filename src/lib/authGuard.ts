import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export type AppRole = "king" | "queen";
export type MinRole = "any" | "queen" | "king";

/**
 * Validates session and role. Returns session on success, NextResponse on failure.
 * - "any"   → any authenticated user
 * - "queen" → queen or king
 * - "king"  → only king
 */
export async function requireAuth(minRole: MinRole = "any") {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json(
            { error: "Unauthorized. Please log in." },
            { status: 401 }
        );
    }

    const role = (session.user as any).role as AppRole;

    if (minRole === "king" && role !== "king") {
        return NextResponse.json(
            { error: "Forbidden. Only king can perform this action." },
            { status: 403 }
        );
    }

    if (minRole === "queen" && role !== "queen" && role !== "king") {
        return NextResponse.json(
            { error: "Forbidden. Insufficient role." },
            { status: 403 }
        );
    }

    return session;
}
