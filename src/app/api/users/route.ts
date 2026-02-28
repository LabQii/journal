import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { getAllUsers, createUser } from "@/lib/userService";
import { Role } from "@prisma/client";

/**
 * GET /api/users
 * King only: list all users
 */
export async function GET() {
    const authResult = await requireAuth("king");
    if (authResult instanceof NextResponse) return authResult;

    try {
        const users = await getAllUsers();
        return NextResponse.json(users);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to fetch users." }, { status: 500 });
    }
}

/**
 * POST /api/users
 * King only: create a new user
 * Body: { username, password, name?, role? }
 * Default role = queen
 */
export async function POST(req: NextRequest) {
    const authResult = await requireAuth("king");
    if (authResult instanceof NextResponse) return authResult;

    try {
        const body = await req.json();
        const { username, password, name, role } = body;

        if (!username || !password) {
            return NextResponse.json(
                { error: "username and password are required." },
                { status: 400 }
            );
        }

        // Validate role if provided
        const parsedRole: Role | undefined =
            role === "king" ? Role.king
                : role === "queen" ? Role.queen
                    : role === undefined ? undefined
                        : undefined;

        if (role && parsedRole === undefined) {
            return NextResponse.json(
                { error: "Invalid role. Must be 'king' or 'queen'." },
                { status: 400 }
            );
        }

        const user = await createUser({ username, password, role: parsedRole });
        return NextResponse.json(user, { status: 201 });
    } catch (err: any) {
        if (err.message === "USERNAME_TAKEN") {
            return NextResponse.json({ error: "Username already taken." }, { status: 409 });
        }
        console.error(err);
        return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
    }
}
