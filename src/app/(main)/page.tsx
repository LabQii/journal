import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HomeContent from "@/components/home/HomeContent";

// Always fetch fresh data on every request
export const dynamic = "force-dynamic";

export default async function Home() {
  // Read session server-side — guests get null
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;

  const userId = isLoggedIn ? (session.user as any).id : null;

  // Fetch books for everyone; notes only for logged-in users
  const [books, recentNotes] = await Promise.all([
    prisma.book.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { parts: true } },
        parts: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
        favoritedBy: userId ? { where: { userId } } : false,
      },
    }),
    // Skip DB query entirely for guests — saves a round-trip
    isLoggedIn
      ? prisma.note.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: { select: { username: true, role: true } },
          _count: { select: { comments: true } },
        },
      })
      : Promise.resolve([]),
  ]);

  const sortedBooks = books
    .map((b) => ({
      ...b,
      isFavorite: b.favoritedBy ? b.favoritedBy.length > 0 : false,
    }))
    .sort((a, b) => {
      if (a.isFavorite === b.isFavorite) {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      return a.isFavorite ? -1 : 1;
    })
    .slice(0, 4);

  const serializedBooks = sortedBooks.map((b) => ({
    id: b.id,
    title: b.title,
    description: b.description,
    author: b.author,
    cover: b.cover,
    status: b.status,
    isFavorite: b.isFavorite,
    createdAt: b.createdAt.toISOString(),
    _count: b._count,
    parts: b.parts.map((p) => ({ createdAt: p.createdAt.toISOString() })),
  }));

  const serializedNotes = recentNotes.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <HomeContent
      books={serializedBooks}
      recentNotes={serializedNotes}
      isLoggedIn={isLoggedIn}
    />
  );
}
