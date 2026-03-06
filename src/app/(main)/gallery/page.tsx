import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GalleryClient, { type GalleryImage } from "./GalleryClient";

/**
 * Gallery page — Server Component.
 * Data is fetched at render time on the server; the browser receives
 * a fully-populated HTML response with no blank-screen loading phase.
 * Auth guard is in gallery/layout.tsx (redirects guests before this runs).
 */
export default async function GalleryPage() {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id ?? null;

    const rawImages = await prisma.gallery.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            favoritedBy: userId ? { where: { userId } } : false,
        },
    });

    const images: GalleryImage[] = rawImages.map((img) => ({
        id: img.id,
        photoUrl: img.photoUrl,
        description: img.description,
        isFavorite: img.favoritedBy ? img.favoritedBy.length > 0 : false,
        createdAt: img.createdAt.toISOString(),
    }));

    // Sort: favorites first, then newest
    images.sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        return 0; // already ordered by createdAt desc from DB
    });

    return <GalleryClient initialImages={images} />;
}
