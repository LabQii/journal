import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        // Guests do not have per-user notifications
        return NextResponse.json([]);
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // Update active status and sync access logs (fire and forget)
    (async () => {
        try {
            await prisma.user.update({
                where: { id: userId },
                // @ts-ignore
                data: { lastActiveAt: new Date() }
            });

            // If user is Queen, ensure she has an access log entry created within the last 30 minutes.
            // If the King deleted the table while she was online, she won't have one, so we recreate it.
            if (userRole === "queen") {
                const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
                const recentLog = await prisma.accessLog.findFirst({
                    where: {
                        userId: userId,
                        createdAt: { gte: thirtyMinsAgo }
                    }
                });

                if (!recentLog) {
                    await prisma.accessLog.create({
                        data: { userId: userId }
                    });
                }
            }
        } catch (e) {
            console.error("Failed to sync active status in notifications:", e);
        }
    })();

    try {
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        return NextResponse.json(notifications);
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
