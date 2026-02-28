import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const notes = await prisma.note.findMany({
            orderBy: { createdAt: "desc" },
            take: 5,
        });
        return NextResponse.json(notes);
    } catch (error) {
        console.error("Failed to fetch recent notes:", error);
        return NextResponse.json({ error: "Failed to fetch recent notes" }, { status: 500 });
    }
}
