import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as any;

        // Only track for role 'queen'
        if (user.role !== "queen") {
            return NextResponse.json({ message: "Not required" }, { status: 200 });
        }

        // We can optionally pass something from client, but mainly we just want to create a log
        await prisma.accessLog.create({
            data: {
                userId: user.id,
            }
        });

        return NextResponse.json({ message: "Logged" }, { status: 201 });
    } catch (error) {
        console.error("Error logging access:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as any;

        // Only king can view logs
        if (user.role !== "king") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const logs = await prisma.accessLog.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        username: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 50 // Limit to recent 50 logs for performance and minimal view
        });

        return NextResponse.json({ logs }, { status: 200 });
    } catch (error) {
        console.error("Error fetching access logs:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
