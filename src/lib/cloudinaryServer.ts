import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Deletes an image from Cloudinary given its public_id or secure URL.
 * If a full URL is provided, it extracts the public_id from it.
 */
export async function deleteFromCloudinary(publicIdOrUrl: string | null): Promise<boolean> {
    if (!publicIdOrUrl) return false;

    try {
        let publicId = publicIdOrUrl;

        // If it's a URL, extract the public_id
        if (publicIdOrUrl.startsWith("http")) {
            if (!publicIdOrUrl.includes("res.cloudinary.com")) return false;

            const uploadIndex = publicIdOrUrl.indexOf("/upload/");
            if (uploadIndex === -1) return false;

            const pathAfterUpload = publicIdOrUrl.substring(uploadIndex + 8);
            const parts = pathAfterUpload.split("/");

            // Remove the version string (e.g. v1700000000) if present
            if (parts[0].match(/^v\d+$/)) {
                parts.shift();
            }

            const pathWithExt = parts.join("/");
            // Remove the file extension to get the clean public_id
            publicId = pathWithExt.replace(/\.[^/.]+$/, "");
        }

        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === "ok" || result.result === "not found";
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        return false;
    }
}
