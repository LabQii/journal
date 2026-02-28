import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Protected routes — guests are redirected to /login with callbackUrl.
 * Books (/books) stays public for everyone.
 */
const PROTECTED_PREFIXES = ["/notes", "/gallery"];

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Only protect the routes we care about
    const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
    if (!isProtected) return NextResponse.next();

    // getToken reads the NextAuth JWT cookie directly — works on Edge + Node runtimes
    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
        // Preserve the intended destination so after login they land on the right page
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    /*
     * Match /notes and /gallery (and all sub-paths) only.
     * Exclude _next, api, static assets so they are never intercepted.
     */
    matcher: ["/notes/:path*", "/gallery/:path*"],
};
