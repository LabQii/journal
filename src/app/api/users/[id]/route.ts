import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { getUserById, updateUser, deleteUser } from "@/lib/userService";

/**
 * GET /api/users/[id]
 * King only: get single user
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await requireAuth("king");
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const user = await getUserById(id);
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    return NextResponse.json(user);
}

/**
 * PATCH /api/users/[id]
 * King only: update username / password of a user
 * Body: { username?, password? }
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await requireAuth("king");
    if (authResult instanceof NextResponse) return authResult;

    try {
        const body = await req.json();
        const { username, password } = body;

        if (!username && !password) {
            return NextResponse.json(
                { error: "Provide at least username or password to update." },
                { status: 400 }
            );
        }

        const { id } = await params;
        const updated = await updateUser(id, { username, password });
        return NextResponse.json(updated);
    } catch (err: any) {
        if (err.message === "USER_NOT_FOUND") {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }
        if (err.message === "USERNAME_TAKEN") {
            return NextResponse.json({ error: "Username already taken." }, { status: 409 });
        }
        console.error(err);
        return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
    }
}

/**
 * DELETE /api/users/[id]
 * King only: delete a user
 * Rules: cannot delete self; cannot delete last king
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await requireAuth("king");
    if (authResult instanceof NextResponse) return authResult;

    const currentUserId = (authResult.user as any)?.id as string;

    try {
        const { id } = await params;
        await deleteUser(id, currentUserId);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        if (err.message === "USER_NOT_FOUND") {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }
        if (err.message === "CANNOT_DELETE_SELF") {
            return NextResponse.json({ error: "You cannot delete your own account." }, { status: 403 });
        }
        if (err.message === "LAST_KING") {
            return NextResponse.json(
                { error: "Cannot delete the last king. There must be at least one king." },
                { status: 403 }
            );
        }
        console.error(err);
        return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
    }
}
