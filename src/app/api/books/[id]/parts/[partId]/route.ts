import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updatePartSchema } from "@/lib/validations";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; partId: string }> }
) {
    try {
        const resolvedParams = await params;
        const part = await prisma.part.findUnique({
            where: { id: resolvedParams.partId, bookId: resolvedParams.id },
        });

        if (!part) {
            return NextResponse.json({ error: "Part not found" }, { status: 404 });
        }

        return NextResponse.json(part);
    } catch (error) {
        console.error("Failed to fetch part:", error);
        return NextResponse.json({ error: "Failed to fetch part" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; partId: string }> }
) {
    try {
        const resolvedParams = await params;
        const body = await req.json();

        // Validate request body
        const validatedData = updatePartSchema.parse(body);

        const part = await prisma.part.update({
            where: { id: resolvedParams.partId, bookId: resolvedParams.id },
            data: validatedData,
        });

        // Optionally update book's updatedAt here as well

        return NextResponse.json(part);
    } catch (error: any) {
        if (error.code === "P2025") {
            return NextResponse.json({ error: "Part not found" }, { status: 404 });
        }
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Failed to update part:", error);
        return NextResponse.json({ error: "Failed to update part" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; partId: string }> }
) {
    try {
        const resolvedParams = await params;
        await prisma.part.delete({
            where: { id: resolvedParams.partId, bookId: resolvedParams.id },
        });

        return NextResponse.json({ message: "Part deleted successfully" });
    } catch (error: any) {
        if (error.code === "P2025") {
            return NextResponse.json({ error: "Part not found" }, { status: 404 });
        }
        console.error("Failed to delete part:", error);
        return NextResponse.json({ error: "Failed to delete part" }, { status: 500 });
    }
}
