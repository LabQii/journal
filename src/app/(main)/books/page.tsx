import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BooksClient, { type Book } from "./BooksClient";

/**
 * Books page — Server Component.
 * Fetches all books + user favorites at render time on the server.
 * The browser receives a fully-populated HTML response with no
 * blank-screen loading phase (was previously causing 8s+ LCP).
 */
export default async function BooksPage() {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id ?? null;

    const rawBooks = await prisma.book.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: { select: { parts: true } },
            favoritedBy: userId ? { where: { userId } } : false,
        },
    });

    const books: Book[] = rawBooks
        .map((b) => ({
            id: b.id,
            title: b.title,
            description: b.description,
            author: b.author,
            cover: b.cover,
            status: b.status,
            isFavorite: b.favoritedBy ? b.favoritedBy.length > 0 : false,
            createdAt: b.createdAt.toISOString(),
            _count: b._count,
        }))
        .sort((a, b) => {
            if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
            return 0; // DB already ordered by createdAt desc
        });

    return <BooksClient initialBooks={books} />;
}
