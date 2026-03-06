import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authGuard";
import { supabase, extractStoragePath } from "@/lib/supabase";
import { deleteFromCloudinary } from "@/lib/cloudinaryServer";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth("king");
    if (auth instanceof NextResponse) return auth;

    try {
        const { id } = await params;

        // Fetch current photoUrl before update
        const existing = await prisma.gallery.findUnique({
            where: { id },
            select: { photoUrl: true, photoPublicId: true },
        });

        const body = await req.json();
        const image = await prisma.gallery.update({
            where: { id },
            data: {
                ...(body.photoUrl !== undefined && { photoUrl: body.photoUrl }),
                ...(body.photoPublicId !== undefined && { photoPublicId: body.photoPublicId }),
                ...(body.description !== undefined && { description: body.description || null }),
            },
        });

        // Delete old photo from Storage or Cloudinary if URL changed
        if (
            existing?.photoUrl &&
            body.photoUrl !== undefined &&
            body.photoUrl !== existing.photoUrl
        ) {
            if (existing.photoPublicId) {
                await deleteFromCloudinary(existing.photoPublicId);
            } else if (existing.photoUrl.includes("res.cloudinary.com")) {
                await deleteFromCloudinary(existing.photoUrl);
            } else {
                const oldPath = extractStoragePath(existing.photoUrl, "gallery");
                if (oldPath) {
                    const { error: deleteError } = await supabase.storage
                        .from("gallery")
                        .remove([oldPath]);
                    if (deleteError) {
                        console.warn("Failed to delete old gallery image from storage:", deleteError.message);
                    }
                }
            }
        }

        return NextResponse.json(image);
    } catch (error) {
        console.error("Failed to update gallery image:", error);
        return NextResponse.json({ error: "Failed to update gallery image" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth("king");
    if (auth instanceof NextResponse) return auth;

    try {
        const { id } = await params;

        // Fetch photoUrl before deleting
        const existing = await prisma.gallery.findUnique({
            where: { id },
            select: { photoUrl: true, photoPublicId: true },
        });

        await prisma.gallery.delete({ where: { id } });

        // Delete image from Storage or Cloudinary
        if (existing?.photoUrl) {
            if (existing.photoPublicId) {
                await deleteFromCloudinary(existing.photoPublicId);
            } else if (existing.photoUrl.includes("res.cloudinary.com")) {
                await deleteFromCloudinary(existing.photoUrl);
            } else {
                const imagePath = extractStoragePath(existing.photoUrl, "gallery");
                if (imagePath) {
                    const { error: deleteError } = await supabase.storage
                        .from("gallery")
                        .remove([imagePath]);
                    if (deleteError) {
                        console.warn("Failed to delete gallery image from storage:", deleteError.message);
                    }
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete gallery image:", error);
        return NextResponse.json({ error: "Failed to delete gallery image" }, { status: 500 });
    }
}
