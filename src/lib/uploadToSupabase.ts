/**
 * Client-side Supabase Storage upload utility
 *
 * Pipeline:
 *   1. compressImage()        — resize ≤1200px, convert to WebP, target <300KB
 *   2. GET /api/upload-token  — Railway issues a signed URL (no file data)
 *   3. PUT signedUrl          — file goes directly from browser to Supabase
 *   4. return publicUrl       — stored in DB
 */

import { compressImage } from "./compressImage";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// ─── Validation ────────────────────────────────────────────────────
const MAX_SIZE_BYTES = 2 * 1024 * 1024;   // 2 MB (pre-compression limit)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export function validateUploadFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
        return "Only JPG, PNG, WebP or GIF images are allowed.";
    }
    if (file.size > MAX_SIZE_BYTES) {
        return "File size must be under 2 MB.";
    }
    return null;
}

// ─── Supabase Image Transform URL ─────────────────────────────────
/**
 * Since the Supabase project is on the free plan, `/render/image` returns 403.
 * We simply return the raw URL. Because we compress the image client-side to
 * <300KB WebP before upload, the raw URL is already highly optimized.
 * Next.js <Image> will further handle caching and responsivity.
 */
export function getSupabaseImageUrl(
    rawUrl: string,
    width?: number,
    quality?: number
): string {
    return rawUrl;
}

// ─── Upload ────────────────────────────────────────────────────────
/**
 * Upload a file directly from the browser to Supabase Storage.
 *
 * - Compresses (resize + WebP) first, client-side
 * - Gets a signed URL from /api/upload-token (lightweight, no file data)
 * - PUTs file directly to Supabase (bypasses Railway)
 *
 * @returns permanent public URL of the uploaded file
 */
export async function uploadToSupabase(
    file: File,
    bucket: "books" | "gallery"
): Promise<string> {
    // 1. Validate original file
    const validationError = validateUploadFile(file);
    if (validationError) throw new Error(validationError);

    // 2. Compress client-side: resize ≤1200px → WebP → target <300KB
    let processedFile: File;
    try {
        processedFile = await compressImage(file);
    } catch (err) {
        console.warn("Compression failed, uploading original:", err);
        processedFile = file;
    }

    // 3. Get a one-time signed upload URL from our lightweight API route
    const ext = "webp"; // always webp after compression
    const tokenRes = await fetch(`/api/upload-token?bucket=${bucket}&ext=${ext}`);
    if (!tokenRes.ok) {
        let message = "Failed to get upload token.";
        try {
            const body = await tokenRes.json();
            if (body?.error) message = body.error;
        } catch { /* ignore */ }
        throw new Error(message);
    }

    const { signedUrl, publicUrl } = await tokenRes.json() as {
        signedUrl: string;
        publicUrl: string;
        path: string;
        token: string;
    };

    // 4. Upload DIRECTLY from browser to Supabase (bypasses Railway entirely)
    const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: {
            "Content-Type": "image/webp",
            "x-upsert": "false",
        },
        body: processedFile,
    });

    if (!uploadRes.ok) {
        let message = `Upload failed (HTTP ${uploadRes.status}).`;
        try {
            const body = await uploadRes.json();
            if (body?.message) message = body.message;
        } catch { /* ignore */ }
        throw new Error(message);
    }

    // 5. Return permanent public URL (the raw object URL — transform is applied at render)
    return publicUrl;
}
