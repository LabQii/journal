import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authGuard";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const role = (session?.user as any)?.role;

        // If not a queen, don't throw an error, just return null so it doesn't pollute the logs
        if (role !== "queen") {
            return NextResponse.json(null);
        }

        // Update Queen's active status (fire and forget)
        const userId = (session?.user as any)?.id;
        if (userId) {
            prisma.user.update({
                where: { id: userId },
                // @ts-ignore - Prisma types might not yet be fully reloaded by VSCode
                data: { lastActiveAt: new Date() }
            }).catch(e => console.error("Failed to update lastActiveAt:", e));
        }

        // Fetch the newest unseen greeting
        const greeting = await prisma.royalGreeting.findFirst({
            where: { isSeen: false },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(greeting || null);
    } catch (error) {
        console.error("Failed to fetch royal greeting:", error);
        return NextResponse.json({ error: "Failed to fetch greeting" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAuth("king");
    if (auth instanceof NextResponse) return auth;

    try {
        const { content } = await req.json();

        if (!content || typeof content !== "string" || content.trim().length === 0) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        // Option 1: Mark all previous active greetings as seen
        await prisma.royalGreeting.updateMany({
            where: { isSeen: false },
            data: { isSeen: true }
        });

        // Create the new greeting
        const newGreeting = await prisma.royalGreeting.create({
            data: { content: content.trim() }
        });

        return NextResponse.json(newGreeting, { status: 201 });
    } catch (error) {
        console.error("Failed to post royal greeting:", error);
        return NextResponse.json({ error: "Failed to create greeting" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const auth = await requireAuth("queen");
    if (auth instanceof NextResponse) return auth;

    try {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: "Greeting ID is required" }, { status: 400 });

        const updated = await prisma.royalGreeting.update({
            where: { id },
            data: { isSeen: true }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        if (error.code === "P2025") return NextResponse.json({ error: "Greeting not found" }, { status: 404 });
        console.error("Failed to update royal greeting:", error);
        return NextResponse.json({ error: "Failed to update greeting" }, { status: 500 });
    }
}
