import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppRole = "king" | "queen";

export interface CreateUserInput {
    username: string;
    password: string;
    role?: AppRole;
}

export interface UpdateUserInput {
    username?: string;
    password?: string;
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function getAllUsers() {
    return prisma.user.findMany({
        select: { id: true, username: true, role: true },
        orderBy: { username: "asc" },
    });
}

export async function getUserById(id: string) {
    return prisma.user.findUnique({
        where: { id },
        select: { id: true, username: true, role: true },
    });
}

export async function createUser(data: CreateUserInput) {
    const normalizedUsername = data.username.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
        where: { username: normalizedUsername },
    });
    if (existing) throw new Error("USERNAME_TAKEN");

    const hashed = await bcrypt.hash(data.password, 12);

    return prisma.user.create({
        data: {
            username: normalizedUsername,
            password: hashed,
            role: data.role ?? "queen",
        },
        select: { id: true, username: true, role: true },
    });
}

export async function updateUser(id: string, data: UpdateUserInput) {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new Error("USER_NOT_FOUND");

    const updateData: Record<string, unknown> = {};

    if (data.username) {
        const normalizedUsername = data.username.toLowerCase().trim();
        const taken = await prisma.user.findUnique({ where: { username: normalizedUsername } });
        if (taken && taken.id !== id) throw new Error("USERNAME_TAKEN");
        updateData.username = normalizedUsername;
    }

    if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 12);
    }

    return prisma.user.update({
        where: { id },
        data: updateData,
        select: { id: true, username: true, role: true },
    });
}

export async function deleteUser(id: string, currentUserId: string) {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new Error("USER_NOT_FOUND");

    // King cannot delete themselves
    if (id === currentUserId) throw new Error("CANNOT_DELETE_SELF");

    // Must keep at least 1 King in the system
    if (target.role === "king") {
        const kingCount = await prisma.user.count({ where: { role: "king" } });
        if (kingCount <= 1) throw new Error("LAST_KING");
    }

    await prisma.user.delete({ where: { id } });
    return { success: true };
}

export async function changeUserRole(targetId: string, newRole: AppRole) {
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new Error("USER_NOT_FOUND");

    // Cannot demote the last king
    if (target.role === "king" && newRole !== "king") {
        const kingCount = await prisma.user.count({ where: { role: "king" } });
        if (kingCount <= 1) throw new Error("LAST_KING");
    }

    return prisma.user.update({
        where: { id: targetId },
        data: { role: newRole },
        select: { id: true, username: true, role: true },
    });
}
