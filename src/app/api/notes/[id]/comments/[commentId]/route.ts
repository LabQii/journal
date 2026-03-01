import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authGuard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
    _req: NextRequest,
    context: { params: Promise<{ id: string; commentId: string }> }
) {
    const params = await context.params;
    const auth = await requireAuth("any");
    if (auth instanceof NextResponse) return auth;

    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id as string;
        const role = (session?.user as any)?.role as string;

        const comment = await prisma.comment.findUnique({
            where: { id: params.commentId },
        });

        if (!comment) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        // RBAC: King can delete any; others only their own
        if (role !== "king" && comment.userId !== userId) {
            return NextResponse.json({ error: "Forbidden: you cannot delete this comment" }, { status: 403 });
        }

        // Delete replies first (cascade should handle it, explicit for safety)
        await prisma.comment.deleteMany({ where: { parentId: params.commentId } });
        await prisma.comment.delete({ where: { id: params.commentId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete comment:", error);
        return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string; commentId: string }> }
) {
    const params = await context.params;
    const auth = await requireAuth("any");
    if (auth instanceof NextResponse) return auth;

    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id as string;
        const role = (session?.user as any)?.role as string;

        const comment = await prisma.comment.findUnique({
            where: { id: params.commentId },
        });

        if (!comment) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        // RBAC: King can edit any; others only their own
        if (role !== "king" && comment.userId !== userId) {
            return NextResponse.json({ error: "Forbidden: you cannot edit this comment" }, { status: 403 });
        }

        const body = await req.json();
        const { content } = body;

        if (!content || !content.trim()) {
            return NextResponse.json({ error: "Content cannot be empty" }, { status: 400 });
        }

        const updated = await prisma.comment.update({
            where: { id: params.commentId },
            data: { content: content.trim() },
            include: {
                user: { select: { id: true, username: true, role: true } },
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Failed to update comment:", error);
        return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
    }
}
