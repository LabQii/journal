import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authGuard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    try {
        const comments = await prisma.comment.findMany({
            where: { noteId: params.id, parentId: null },
            orderBy: { createdAt: "asc" },
            include: {
                user: { select: { id: true, username: true, role: true } },
                replies: {
                    orderBy: { createdAt: "asc" },
                    include: {
                        user: { select: { id: true, username: true, role: true } },
                    },
                },
            },
        });
        return NextResponse.json(comments);
    } catch (error) {
        console.error("Failed to fetch comments:", error);
        return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const auth = await requireAuth("any");
    if (auth instanceof NextResponse) return auth;

    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id as string;

        const body = await req.json();
        const { content, parentId } = body;

        if (!content || !content.trim()) {
            return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
        }

        // Validate note exists
        const note = await prisma.note.findUnique({ where: { id: params.id } });
        if (!note) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        // Validate parent if replying
        if (parentId) {
            const parent = await prisma.comment.findUnique({ where: { id: parentId } });
            if (!parent || parent.noteId !== params.id) {
                return NextResponse.json({ error: "Invalid parent comment" }, { status: 400 });
            }
            // Only allow 1 level of nesting
            if (parent.parentId) {
                return NextResponse.json({ error: "Cannot nest replies deeper than 2 levels" }, { status: 400 });
            }
        }

        const comment = await prisma.comment.create({
            data: {
                noteId: params.id,
                userId,
                content: content.trim(),
                parentId: parentId ?? null,
            },
            include: {
                user: { select: { id: true, username: true, role: true } },
                replies: { include: { user: { select: { id: true, username: true, role: true } } } },
            },
        });

        // --- Notifications ---
        const notifyUserIds = new Set<string>();

        // 1. Notify note owner (if exists and not the commenter)
        if (note.userId && note.userId !== userId) {
            notifyUserIds.add(note.userId);
        }

        // 2. If this is a reply, notify the parent comment's author
        if (parentId) {
            const parent = await prisma.comment.findUnique({
                where: { id: parentId },
                select: { userId: true }
            });
            if (parent?.userId && parent.userId !== userId) {
                notifyUserIds.add(parent.userId);
            }
        }


        if (notifyUserIds.size > 0) {
            const commenterUsername = (session?.user as any)?.username ?? "Someone";
            await prisma.notification.createMany({
                data: Array.from(notifyUserIds).map(uid => ({
                    userId: uid,
                    type: "comment",
                    title: parentId
                        ? `${commenterUsername} replied to a comment`
                        : `${commenterUsername} commented on "${note.title}"`,
                    subtitle: content.trim().substring(0, 80),
                    href: `/notes/${params.id}`,
                })),
            });
        }

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error("Failed to create comment:", error);
        return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }
}
