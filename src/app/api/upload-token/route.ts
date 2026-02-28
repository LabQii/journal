import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const ALLOWED_BUCKETS = ["books", "gallery"] as const;
const ALLOWED_EXTS = ["jpg", "jpeg", "png", "webp"] as const;
type AllowedBucket = typeof ALLOWED_BUCKETS[number];
type AllowedExt = typeof ALLOWED_EXTS[number];

/**
 * GET /api/upload-token?bucket=<bucket>&ext=<ext>
 *
 * Issues a one-time Supabase Signed Upload URL so the browser can upload
 * a file directly to Supabase Storage without proxying through Railway.
 * The file NEVER touches the Railway/Next.js server — only this tiny
 * JSON response (~150 bytes) does.
 *
 * Flow:
 *   Browser → GET /api/upload-token  (Railway: ~5ms, no file data)
 *          ← { signedUrl, token, path, publicUrl }
 *   Browser → PUT signedUrl           (direct to Supabase, file bypasses Railway)
 */
export async function GET(req: NextRequest) {
    // Require authentication
    const auth = await requireAuth("any");
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const bucket = searchParams.get("bucket") as AllowedBucket | null;
    const ext = (searchParams.get("ext") ?? "jpg").toLowerCase() as AllowedExt;

    // Validate bucket
    if (!bucket || !ALLOWED_BUCKETS.includes(bucket)) {
        return NextResponse.json(
            { error: "Invalid bucket. Must be 'books' or 'gallery'." },
            { status: 400 }
        );
    }

    // Validate extension
    const safeExt = ALLOWED_EXTS.includes(ext as AllowedExt) ? ext : "jpg";

    // Generate a unique path: <timestamp>-<random>.ext
    const timestamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 10);
    const path = `${timestamp}-${rand}.${safeExt}`;

    // Create a signed upload URL (expires in 60 seconds — plenty for a browser PUT)
    const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUploadUrl(path);

    if (error || !data) {
        console.error("Failed to create signed upload URL:", error);
        return NextResponse.json(
            { error: "Failed to generate upload URL." },
            { status: 500 }
        );
    }

    // Build the public URL the app will store in the database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;

    return NextResponse.json({
        signedUrl: data.signedUrl,
        token: data.token,
        path,
        publicUrl,
    });
}
