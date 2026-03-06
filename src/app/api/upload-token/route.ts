import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { v2 as cloudinary } from "cloudinary";

export const dynamic = "force-dynamic";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_FOLDERS = ["books", "gallery"] as const;
type AllowedFolder = typeof ALLOWED_FOLDERS[number];

/**
 * GET /api/upload-token?folder=<folder>
 *
 * Issues a Cloudinary signed upload token so the browser can upload
 * directly to Cloudinary WITHOUT proxying through the Next.js server.
 * Only ~200 bytes of JSON pass through the server.
 *
 * Flow:
 *   Browser → GET /api/upload-token  (server: ~10ms, no file data)
 *          ← { signature, timestamp, apiKey, cloudName, folder }
 *   Browser → POST https://api.cloudinary.com/v1_1/.../image/upload
 *             (direct to Cloudinary CDN — bypasses Next.js entirely)
 */
export async function GET(req: NextRequest) {
    const auth = await requireAuth("any");
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") as AllowedFolder | null;

    if (!folder || !ALLOWED_FOLDERS.includes(folder)) {
        return NextResponse.json(
            { error: "Invalid folder. Must be 'books' or 'gallery'." },
            { status: 400 }
        );
    }

    const cloudinaryFolder = `journal/${folder}`;
    const timestamp = Math.round(Date.now() / 1000);

    // Generate a signature for: folder + timestamp
    const signature = cloudinary.utils.api_sign_request(
        { folder: cloudinaryFolder, timestamp },
        process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
        signature,
        timestamp,
        apiKey: process.env.CLOUDINARY_API_KEY,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        folder: cloudinaryFolder,
    });
}
