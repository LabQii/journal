import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { v2 as cloudinary } from "cloudinary";

export const dynamic = "force-dynamic";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB (Cloudinary handles further optimization)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_FOLDERS = ["gallery", "books"] as const;

type AllowedFolder = typeof ALLOWED_FOLDERS[number];

export async function POST(req: NextRequest) {
    // Only authenticated users can upload
    const auth = await requireAuth("any");
    if (auth instanceof NextResponse) return auth;

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const folder = formData.get("folder") as AllowedFolder | null;

        // Validate folder
        if (!folder || !ALLOWED_FOLDERS.includes(folder)) {
            return NextResponse.json(
                { error: "Invalid folder. Must be 'books' or 'gallery'." },
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
                { error: "Only JPG, PNG, WebP, and GIF images are allowed." },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json(
                { error: "File size must be under 10MB." },
                { status: 400 }
            );
        }

        // Convert File to Buffer for Cloudinary upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Cloudinary inside folder: journal/gallery or journal/books
        const cloudinaryFolder = `journal/${folder}`;

        const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: cloudinaryFolder,
                    resource_type: "image",
                    // Auto-optimize quality and format
                    quality: "auto",
                    fetch_format: "auto",
                },
                (error, result) => {
                    if (error || !result) {
                        reject(error || new Error("Cloudinary upload failed"));
                    } else {
                        resolve(result as { secure_url: string });
                    }
                }
            ).end(buffer);
        });

        return NextResponse.json({ url: result.secure_url }, { status: 201 });

    } catch (error: any) {
        console.error("Upload route error:", error);
        return NextResponse.json(
            { error: error.message || "Upload failed." },
            { status: 500 }
        );
    }
}
