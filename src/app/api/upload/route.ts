import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_BUCKETS = ["books", "gallery"];

export async function POST(req: NextRequest) {
    // Only authenticated users can upload
    const auth = await requireAuth("any");
    if (auth instanceof NextResponse) return auth;

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const bucket = formData.get("bucket") as string | null;

        // Validate bucket
        if (!bucket || !ALLOWED_BUCKETS.includes(bucket)) {
            return NextResponse.json(
                { error: "Invalid bucket. Must be 'books' or 'gallery'." },
                { status: 400 }
            );
        }

        // Validate file presence
        if (!file || typeof file === "string") {
            return NextResponse.json({ error: "No file provided." }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Only JPG, PNG, and WebP images are allowed." },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json(
                { error: "File size must be under 2MB." },
                { status: 400 }
            );
        }

        // Generate unique filename: timestamp-random.ext
        const ext = file.type.split("/")[1].replace("jpeg", "jpg");
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        // Convert File to ArrayBuffer → Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage
        const { error: uploadError } = await supabaseAdmin.storage
            .from(bucket)
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            return NextResponse.json(
                { error: `Upload failed: ${uploadError.message}` },
                { status: 500 }
            );
        }

        // Build public URL
        const { data: publicUrlData } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(filename);

        return NextResponse.json({ url: publicUrlData.publicUrl }, { status: 201 });
    } catch (error: any) {
        console.error("Upload route error:", error);
        return NextResponse.json(
            { error: error.message || "Upload failed." },
            { status: 500 }
        );
    }
}
