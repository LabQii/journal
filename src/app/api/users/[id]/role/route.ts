import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { changeUserRole, AppRole } from "@/lib/userService";

const VALID_ROLES: AppRole[] = ["king", "queen"];

/**
 * PATCH /api/users/[id]/role
 * King only: change a user's role
 * Body: { role: "king" | "queen" }
 *
 * Rules:
 * - Only king can promote/demote
 * - Cannot demote the last king
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await requireAuth("king");
    if (authResult instanceof NextResponse) return authResult;

    try {
        const body = await req.json();
        const { role } = body;

        if (!role || !VALID_ROLES.includes(role)) {
            return NextResponse.json(
                { error: `role must be one of: ${VALID_ROLES.join(", ")}.` },
                { status: 400 }
            );
        }

        const { id } = await params;
        const updated = await changeUserRole(id, role as AppRole);
        return NextResponse.json(updated);
    } catch (err: any) {
        if (err.message === "USER_NOT_FOUND") {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }
        if (err.message === "LAST_KING") {
            return NextResponse.json(
                { error: "Cannot demote the last king. Promote another user first." },
                { status: 403 }
            );
        }
        console.error(err);
        return NextResponse.json({ error: "Failed to change role." }, { status: 500 });
    }
}
