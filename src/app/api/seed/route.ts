import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

// One-time seed endpoint — DELETE after use or protect with env check
export async function GET() {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not available in production" }, { status: 403 });
    }

    try {
        const iqbalHash = await bcrypt.hash("iqbal123", 12);
        const nattaHash = await bcrypt.hash("natta123", 12);

        await prisma.user.upsert({
            where: { username: "iqbal" },
            update: { password: iqbalHash, role: Role.king },
            create: { username: "iqbal", password: iqbalHash, role: Role.king },
        });

        await prisma.user.upsert({
            where: { username: "natta" },
            update: { password: nattaHash, role: Role.queen },
            create: { username: "natta", password: nattaHash, role: Role.queen },
        });

        return NextResponse.json({
            success: true,
            message: "Users seeded: iqbal (king) and natta (queen)",
        });
    } catch (error: any) {
        console.error("Seed error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

