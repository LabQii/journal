import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authGuard";

// In-memory throttle — avoids an extra DB read on every poll (prevents MaxClientsInSessionMode)
const lastActiveWriteCache = new Map<string, number>();
const ACTIVE_THROTTLE_MS = 2 * 60 * 1000; // write at most once per 2 minutes

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const role = (session?.user as any)?.role;

        if (role !== "queen") {
            return NextResponse.json(null);
        }

        const userId = (session?.user as any)?.id;
        if (userId) {
            const now = Date.now();
            const lastWrite = lastActiveWriteCache.get(userId) ?? 0;
            if ((now - lastWrite) > ACTIVE_THROTTLE_MS) {
                lastActiveWriteCache.set(userId, now);
                prisma.user.update({
                    where: { id: userId },
                    data: { lastActiveAt: new Date(now) }
                }).catch((e) => {
                    lastActiveWriteCache.delete(userId); // retry next poll on failure
                    console.error("Failed to update lastActiveAt:", e);
                });
            }
        }

        // Fetch the newest unseen greeting
        const greeting = await prisma.royalGreeting.findFirst({
            where: { isSeen: false },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(greeting || null, {
            headers: {
                // Allow browser to reuse cached response for up to 30s; serve stale for 60s while revalidating
                "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
            },
        });
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
        if (error.code === "P2025") return NextResponse.json
            ({ error: "Greeting not found" }, { status: 404 });
        console.error("Failed to update royal greeting:", error);
        return NextResponse.json({ error: "Failed to update greeting" }, { status: 500 });
    }
}
