import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// In-memory throttle: track the last time we wrote lastActiveAt per user.
// Using a Map avoids an extra DB read on every poll (which was causing MaxClientsInSessionMode).
// Resets on server cold-start — worst case: one extra write per cold start (acceptable).
const lastActiveWriteCache = new Map<string, number>();
const ACTIVE_THROTTLE_MS = 2 * 60 * 1000;       // write at most once per 2 minutes
const ACCESSLOG_THROTTLE_MS = 30 * 60 * 1000;

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        // Guests do not have per-user notifications
        return NextResponse.json([]);
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // In-memory throttle: only hit the DB if we haven't written recently.
    // This avoids opening an extra DB connection on every 60-second poll.
    const now = Date.now();
    const lastWrite = lastActiveWriteCache.get(userId) ?? 0;
    if ((now - lastWrite) > ACTIVE_THROTTLE_MS) {
        // Mark in-memory immediately so concurrent requests don't also write
        lastActiveWriteCache.set(userId, now);

        // Fire-and-forget: update DB + accessLog
        (async () => {
            try {
                await prisma.user.update({
                    where: { id: userId },
                    // @ts-ignore
                    data: { lastActiveAt: new Date(now) }
                });

                // If user is Queen, ensure she has an access log entry within the last 30 minutes.
                if (userRole === "queen") {
                    const thirtyMinsAgo = new Date(now - ACCESSLOG_THROTTLE_MS);
                    const recentLog = await prisma.accessLog.findFirst({
                        where: { userId: userId, createdAt: { gte: thirtyMinsAgo } }
                    });
                    if (!recentLog) {
                        await prisma.accessLog.create({ data: { userId: userId } });
                    }
                }
            } catch (e) {
                // Reset cache on failure so next poll retries
                lastActiveWriteCache.delete(userId);
                console.error("Failed to sync active status in notifications:", e);
            }
        })();
    }

    try {
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        return NextResponse.json(notifications, {
            headers: {
                // Allow browser to reuse cached response for up to 30s; serve stale for 60s while revalidating
                "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
            },
        });
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    try {
        const body = await req.json();

        if (body.id) {
            // Mark specific notification as read
            await prisma.notification.updateMany({
                where: { id: body.id, userId },
                data: { isRead: true },
            });
        } else if (body.markAllRead) {
            // Mark all as read
            await prisma.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update notification:", error);
        return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
    }
}
