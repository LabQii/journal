import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (!q || q.length < 2) return NextResponse.json({ notes: [], books: [], gallery: [] });

    // Guests can only search Books; authenticated users can search everything
    const session = await getServerSession(authOptions);
    const isLoggedIn = !!session?.user;

    const [notes, books, gallery] = await Promise.all([
        // Only query notes for logged-in users
        isLoggedIn
            ? prisma.note.findMany({
                where: {
                    OR: [
                        { title: { contains: q, mode: "insensitive" } },
                        { content: { contains: q, mode: "insensitive" } },
                    ],
                },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: { id: true, title: true, category: true, createdAt: true },
            })
            : Promise.resolve([]),
        prisma.book.findMany({
            where: {
                OR: [
                    { title: { contains: q, mode: "insensitive" } },
                    { author: { contains: q, mode: "insensitive" } },
                    { description: { contains: q, mode: "insensitive" } },
                ],
            },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, title: true, author: true, cover: true },
        }),
        isLoggedIn
            ? prisma.gallery.findMany({
                where: {
                    description: { contains: q, mode: "insensitive" }
                },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: { id: true, description: true, photoUrl: true, createdAt: true },
            })
            : Promise.resolve([]),
    ]);

    return NextResponse.json({ notes, books, gallery });
}
