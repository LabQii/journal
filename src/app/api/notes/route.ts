import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNoteSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/authGuard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category");

        const notes = await prisma.note.findMany({
            where: category ? { category: category } : {},
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(notes);
    } catch (error) {
        console.error("Failed to fetch notes:", error);
        return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAuth("any");
    if (auth instanceof NextResponse) return auth;

    try {
        const body = await req.json();
        const validatedData = createNoteSchema.parse(body);

        const note = await prisma.note.create({
            data: {
                title: validatedData.title,
                content: validatedData.content,
                url: validatedData.url ?? null,
                category: validatedData.category ?? "Santai",
                imageUrl: validatedData.imageUrl ?? null,
            },
        });

        // Notify all other users
        const session = await getServerSession(authOptions);
        const creatorId = session?.user ? (session.user as any).id : null;
        if (creatorId) {
            const otherUsers = await prisma.user.findMany({
                where: { id: { not: creatorId } },
                select: { id: true }
            });
            if (otherUsers.length > 0) {
                await prisma.notification.createMany({
                    data: otherUsers.map(u => ({
                        userId: u.id,
                        type: "note",
                        title: `Catatan baru: "${note.title}"`,
                        subtitle: note.category,
                        href: `/notes/${note.id}`
                    }))
                });
            }
        }

        return NextResponse.json(note, { status: 201 });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Failed to create note:", error);
        return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
    }
}
