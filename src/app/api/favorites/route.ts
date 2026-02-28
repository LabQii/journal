import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;

    try {
        const { type, itemId, isFavorite } = await req.json();

        if (type !== "book" && type !== "gallery") {
            return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        }

        if (isFavorite) {
            // Add favorite
            if (type === "book") {
                await prisma.bookFavorite.upsert({
                    where: { userId_bookId: { userId, bookId: itemId } },
                    create: { userId, bookId: itemId },
                    update: {}, // Do nothing if it already exists
                });
            } else {
                await prisma.galleryFavorite.upsert({
                    where: { userId_galleryId: { userId, galleryId: itemId } },
                    create: { userId, galleryId: itemId },
                    update: {},
                });
            }
        } else {
            // Remove favorite
            if (type === "book") {
                await prisma.bookFavorite.deleteMany({
                    where: { userId, bookId: itemId },
                });
            } else {
                await prisma.galleryFavorite.deleteMany({
                    where: { userId, galleryId: itemId },
                });
            }
        }

        return NextResponse.json({ success: true, isFavorite });
    } catch (error) {
        console.error("Favorite toggle error:", error);
        return NextResponse.json({ error: "Failed to toggle favorite" }, { status: 500 });
    }
}
