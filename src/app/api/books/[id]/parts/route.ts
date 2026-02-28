import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPartSchema } from "@/lib/validations";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const parts = await prisma.part.findMany({
            where: { bookId: resolvedParams.id },
            orderBy: { partNumber: "asc" },
        });

        return NextResponse.json(parts);
    } catch (error) {
        console.error("Failed to fetch parts:", error);
        return NextResponse.json({ error: "Failed to fetch parts" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const body = await req.json();

        // Validate request body
        const validatedData = createPartSchema.parse(body);

        // Verify book exists
        const bookExists = await prisma.book.findUnique({
            where: { id: resolvedParams.id }
        });

        if (!bookExists) {
            return NextResponse.json({ error: "Book not found" }, { status: 404 });
        }

        const part = await prisma.part.create({
            data: {
                ...validatedData,
                bookId: resolvedParams.id,
            },
        });

        // The Prisma schema for Book does not have an updatedAt field.
        // If you need to update it, you'd have to add it to the schema first.
        // We'll skip it for now to avoid the TypeScript error.

        return NextResponse.json(part, { status: 201 });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Failed to create part:", error);
        return NextResponse.json({ error: "Failed to create part" }, { status: 500 });
    }
}
