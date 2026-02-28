import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
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

    console.log("✅ Users seeded: iqbal (king) and natta (prince)");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
