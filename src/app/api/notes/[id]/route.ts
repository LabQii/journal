import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authGuard";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth("king");
    if (auth instanceof NextResponse) return auth;

    try {
        const { id } = await params;
        const body = await req.json();
        const note = await prisma.note.update({
            where: { id },
            data: {
                ...(body.title !== undefined && { title: body.title }),
                ...(body.content !== undefined && { content: body.content }),
                ...(body.url !== undefined && { url: body.url || null }),
                ...(body.category !== undefined && { category: body.category }),
                ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
            },
        });
        return NextResponse.json(note);
    } catch (error) {
        console.error("Failed to update note:", error);
        return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth("king");
    if (auth instanceof NextResponse) return auth;

    try {
        const { id } = await params;
        await prisma.note.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete note:", error);
        return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
    }
}
