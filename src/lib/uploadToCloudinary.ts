/**
 * Client-side Cloudinary DIRECT upload utility
 *
 * Pipeline (fast — file never touches the Next.js server):
 *   1. compressImage()       — resize ≤1200px, convert to WebP, target <300KB
 *   2. GET /api/upload-token — server returns a Cloudinary signature (~10ms, no file data)
 *   3. POST cloudinary.com   — file goes DIRECTLY from browser to Cloudinary CDN
 *   4. return secure_url     — stored in DB
 *
 * Folder structure in Cloudinary:
 *   journal/gallery  ← Gallery photos
 *   journal/books    ← Book covers
 */

import { compressImage } from "./compressImage";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB (pre-compression limit)
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

/**
 * Upload a file directly from the browser to Cloudinary.
 * The heavy file transfer NEVER passes through the Next.js server.
 *
 * @param file   - The image file to upload
 * @param folder - "gallery" or "books" (determines Cloudinary subfolder)
 * @returns      - Secure Cloudinary URL of the uploaded image
 */
export async function uploadToCloudinary(
    file: File,
    folder: "gallery" | "books"
): Promise<{ secureUrl: string; publicId: string }> {
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

    // 3. Get Cloudinary signature from lightweight server endpoint (~10ms, no file data)
    const tokenRes = await fetch(`/api/upload-token?folder=${folder}`);
    if (!tokenRes.ok) {
        let message = "Failed to get upload token.";
        try {
            const body = await tokenRes.json();
            if (body?.error) message = body.error;
        } catch { /* ignore */ }
        throw new Error(message);
    }

    const { signature, timestamp, apiKey, cloudName, folder: cloudFolder } =
        await tokenRes.json() as {
            signature: string;
            timestamp: number;
            apiKey: string;
            cloudName: string;
            folder: string;
        };

    // 4. Upload DIRECTLY from browser to Cloudinary (bypasses Next.js server entirely)
    const formData = new FormData();
    formData.append("file", processedFile);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
    formData.append("folder", cloudFolder);

    const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
    );

    if (!uploadRes.ok) {
        let message = `Upload failed (HTTP ${uploadRes.status}).`;
        try {
            const body = await uploadRes.json();
            if (body?.error?.message) message = body.error.message;
        } catch { /* ignore */ }
        throw new Error(message);
    }

    const result = await uploadRes.json() as { secure_url: string; public_id: string };
    return {
        secureUrl: result.secure_url,
        publicId: result.public_id
    };
}
