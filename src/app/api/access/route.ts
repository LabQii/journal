import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== "king") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch logs
        const logs = await prisma.accessLog.findMany({
            include: {
                user: { select: { name: true, username: true, lastActiveAt: true, role: true } }
            },
            orderBy: { createdAt: "desc" },
            take: 5
        });

        const totalLogs = await prisma.accessLog.count();

        // Check if Queen is online (we can check the latest log's user if it's Queen, or just query Queen directly)
        const queen = await prisma.user.findFirst({
            where: { role: "queen" }
        });

        let isOnline = false;
        let lastActiveAt = null;

        if (queen && queen.lastActiveAt) {
            const lastActive = new Date(queen.lastActiveAt).getTime();
            const now = new Date().getTime();
            // Consider active if updated within the last 1 minute (60000 ms)
            if (now - lastActive < 60000) {
                isOnline = true;
            }
            lastActiveAt = queen.lastActiveAt;
        }

        return NextResponse.json({ logs, totalLogs, isOnline, lastActiveAt });
    } catch (error) {
        console.error("Failed to fetch access logs:", error);
        return NextResponse.json({ error: "Failed to fetch access logs" }, { status: 500 });
    }
}

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;

        if (!user || user.role !== "queen") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Record the visit
        await prisma.accessLog.create({
            data: {
                userId: user.id
            }
        });

        // Update active status at the same time
        await prisma.user.update({
            where: { id: user.id },
            data: { lastActiveAt: new Date() }
        });

        return NextResponse.json({ success: true, message: "Access logged successfully" });
    } catch (error) {
        console.error("Failed to log access:", error);
        return NextResponse.json({ error: "Failed to log access" }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== "king") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Delete all rows in AccessLog
        const result = await prisma.accessLog.deleteMany({});

        return NextResponse.json({ success: true, count: result.count, message: "All history deleted" });
    } catch (error) {
        console.error("Failed to delete access logs:", error);
        return NextResponse.json({ error: "Failed to delete access logs" }, { status: 500 });
    }
}
