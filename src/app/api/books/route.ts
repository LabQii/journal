import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBookSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/authGuard";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user ? (session.user as any).id : null;

        const books = await prisma.book.findMany({
            include: {
                _count: { select: { parts: true } },
                parts: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
                favoritedBy: userId ? { where: { userId } } : false,
            },
            orderBy: { createdAt: "desc" },
        });

        // Map relation to isFavorite and sort favorited to top
        const mappedBooks = books
            .map((b) => ({
                id: b.id,
                title: b.title,
                description: b.description,
                author: b.author,
                cover: b.cover,
                coverPublicId: b.coverPublicId,
                status: b.status,
                publishedDate: b.publishedDate,
                createdAt: b.createdAt,
                _count: b._count,
                parts: b.parts,
                isFavorite: b.favoritedBy ? b.favoritedBy.length > 0 : false,
            }))
            .sort((a, b) => {
                if (a.isFavorite === b.isFavorite) {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }
                return a.isFavorite ? -1 : 1;
            });

        const res = NextResponse.json(mappedBooks);
        res.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=300");
        return res;
    } catch (error) {
        console.error("Failed to fetch books:", error);
        return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAuth("any");
    if (auth instanceof NextResponse) return auth;

    try {
        const body = await req.json();
        const validatedData = createBookSchema.parse(body);

        const book = await prisma.book.create({
            data: {
                title: validatedData.title,
                description: validatedData.description,
                author: validatedData.author,
                cover: validatedData.cover,
                coverPublicId: validatedData.coverPublicId,
                status: validatedData.status || "ONGOING",
                publishedDate: validatedData.publishedDate ? new Date(validatedData.publishedDate) : null,
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
                        type: "book",
                        title: `Buku baru: "${book.title}"`,
                        subtitle: book.author,
                        href: `/books/${book.id}`
                    }))
                });
            }
        }

        return NextResponse.json(book, { status: 201 });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || "Failed to create book" }, { status: 500 });
    }
}
