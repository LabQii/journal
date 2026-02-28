import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateBookSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/authGuard";
import { supabase, extractStoragePath } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);
        const userId = session?.user ? (session.user as any).id : null;

        const book = await prisma.book.findUnique({
            where: { id: resolvedParams.id },
            include: {
                parts: { orderBy: { partNumber: "asc" } },
                favoritedBy: userId ? { where: { userId } } : false
            },
        });
        if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

        const mappedBook = {
            ...book,
            isFavorite: book.favoritedBy ? book.favoritedBy.length > 0 : false
        };

        return NextResponse.json(mappedBook);
    } catch (error) {
        console.error("Failed to fetch book:", error);
        return NextResponse.json({ error: "Failed to fetch book" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth("king");
    if (auth instanceof NextResponse) return auth;

    try {
        const resolvedParams = await params;

        // Fetch current book to get old cover URL (if any)
        const existing = await prisma.book.findUnique({
            where: { id: resolvedParams.id },
            select: { cover: true },
        });

        const body = await req.json();
        const validatedData = updateBookSchema.parse(body);

        const data: any = { ...validatedData };
        if (validatedData.publishedDate) data.publishedDate = new Date(validatedData.publishedDate);

        const book = await prisma.book.update({ where: { id: resolvedParams.id }, data });

        // Delete old cover from Supabase Storage if it changed and was a storage URL
        if (
            existing?.cover &&
            validatedData.cover !== undefined &&
            validatedData.cover !== existing.cover
        ) {
            const oldPath = extractStoragePath(existing.cover, "books");
            if (oldPath) {
                const { error: deleteError } = await supabase.storage
                    .from("books")
                    .remove([oldPath]);
                if (deleteError) {
                    console.warn("Failed to delete old cover from storage:", deleteError.message);
                }
            }
        }

        return NextResponse.json(book);
    } catch (error: any) {
        if (error.code === "P2025") return NextResponse.json({ error: "Book not found" }, { status: 404 });
        if (error.name === "ZodError") return NextResponse.json({ error: error.issues }, { status: 400 });
        console.error("Failed to update book:", error);
        return NextResponse.json({ error: "Failed to update book" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth("king");
    if (auth instanceof NextResponse) return auth;

    try {
        const resolvedParams = await params;

        // Fetch cover URL before deleting
        const existing = await prisma.book.findUnique({
            where: { id: resolvedParams.id },
            select: { cover: true },
        });

        await prisma.$transaction([
            prisma.part.deleteMany({ where: { bookId: resolvedParams.id } }),
            prisma.book.delete({ where: { id: resolvedParams.id } }),
        ]);

        // Delete cover from Supabase Storage after DB delete
        if (existing?.cover) {
            const coverPath = extractStoragePath(existing.cover, "books");
            if (coverPath) {
                const { error: deleteError } = await supabase.storage
                    .from("books")
                    .remove([coverPath]);
                if (deleteError) {
                    console.warn("Failed to delete cover from storage:", deleteError.message);
                }
            }
        }

        return NextResponse.json({ message: "Book deleted successfully" });
    } catch (error: any) {
        if (error.code === "P2025") return NextResponse.json({ error: "Book not found" }, { status: 404 });
        console.error("Failed to delete book:", error);
        return NextResponse.json({ error: "Failed to delete book" }, { status: 500 });
    }
}
