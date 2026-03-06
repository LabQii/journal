import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGallerySchema } from "@/lib/validations";
import { requireAuth } from "@/lib/authGuard";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user ? (session.user as any).id : null;

        const images = await prisma.gallery.findMany({
            include: {
                favoritedBy: userId ? { where: { userId } } : false,
            },
            orderBy: { createdAt: "desc" },
        });

        // Map the relation to a simple boolean isFavorite for the client
        // and sort favorited items to the top
        const mappedImages = images
            .map((img) => ({
                id: img.id,
                photoUrl: img.photoUrl,
                photoPublicId: img.photoPublicId,
                description: img.description,
                createdAt: img.createdAt,
                isFavorite: img.favoritedBy ? img.favoritedBy.length > 0 : false,
            }))
            .sort((a, b) => {
                if (a.isFavorite === b.isFavorite) {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }
                return a.isFavorite ? -1 : 1;
            });

        const res = NextResponse.json(mappedImages);
        // Cache per-user for 30s; stale content served for up to 5min while revalidating
        res.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=300");
        return res;
    } catch (error) {
        console.error("Failed to fetch gallery images:", error);
        return NextResponse.json({ error: "Failed to fetch gallery images" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAuth("any");
    if (auth instanceof NextResponse) return auth;

    try {
        const body = await req.json();
        const validatedData = createGallerySchema.parse(body);
        const image = await prisma.gallery.create({
            data: {
                photoUrl: validatedData.photoUrl,
                photoPublicId: validatedData.photoPublicId,
                description: validatedData.description ?? null
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
                        type: "gallery",
                        title: `Foto baru ditambahkan ke Gallery`,
                        subtitle: image.description || "Tanpa deskripsi",
                        href: `/gallery`
                    }))
                });
            }
        }

        return NextResponse.json(image, { status: 201 });
    } catch (error: any) {
        if (error.name === "ZodError") return NextResponse.json({ error: error.issues }, { status: 400 });
        console.error("Failed to create gallery image:", error);
        return NextResponse.json({ error: "Failed to create gallery image" }, { status: 500 });
    }
}
