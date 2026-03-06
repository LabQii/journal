import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NotesClient, { type Note } from "./NotesClient";

/**
 * Notes page — Server Component.
 * Auth guard lives in notes/layout.tsx (redirects unauthenticated users).
 * Data is fetched at render time so the browser receives a complete HTML
 * response — no blank-screen waiting for a client-side useEffect fetch.
 */
export default async function NotesPage() {
    const rawNotes = await prisma.note.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            user: { select: { username: true, role: true } },
            _count: { select: { comments: true } },
        },
    });

    const notes: Note[] = rawNotes.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        url: n.url,
        category: n.category,
        imageUrl: n.imageUrl,
        createdAt: n.createdAt.toISOString(),
        user: n.user ? { username: n.user.username, role: n.user.role } : null,
        _count: n._count,
    }));

    return <NotesClient initialNotes={notes} />;
}
