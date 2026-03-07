/**
 * compressImage
 *
 * Client-side image compression using the Canvas API.
 * Optimized for speed — single-pass, skips compression for small files.
 *
 * Pipeline:
 *   1. If file is already ≤ SKIP_KB, return as-is (fastest path)
 *   2. Decode with createImageBitmap
 *   3. Resize to ≤ MAX_WIDTH while preserving aspect ratio
 *   4. Single-pass export as WebP at fixed quality (no loop)
 *   5. If the result is somehow bigger than original, return original
 */

// Files smaller than this are uploaded directly without any compression
const SKIP_BYTES = 800 * 1024; // 800 KB

// Max dimension (width) — 1024px is plenty for book covers and gallery photos
const MAX_WIDTH = 1024;

// Fixed WebP quality — single pass, no loop (q=0.80 gives great quality at ~40% smaller size than JPEG)
const QUALITY = 0.80;

export async function compressImage(file: File): Promise<File> {
    // Fast path: file is already small enough — skip all canvas work
    if (file.size <= SKIP_BYTES) {
        console.info(`compressImage: skipped (${(file.size / 1024).toFixed(0)} KB < 800 KB limit)`);
        return file;
    }

    // 1. Decode image
    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch {
        console.warn("compressImage: createImageBitmap failed, using original file");
        return file;
    }

    // 2. Calculate target dimensions (downscale only, never upscale)
    const { width: origW, height: origH } = bitmap;
    let targetW = origW;
    let targetH = origH;
    if (origW > MAX_WIDTH) {
        targetW = MAX_WIDTH;
        targetH = Math.round((origH / origW) * MAX_WIDTH);
    }

    // 3. Draw onto canvas
    let canvas: HTMLCanvasElement | OffscreenCanvas;
    let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

    if (typeof OffscreenCanvas !== "undefined") {
        canvas = new OffscreenCanvas(targetW, targetH);
        ctx = canvas.getContext("2d");
    } else {
        canvas = document.createElement("canvas");
        (canvas as HTMLCanvasElement).width = targetW;
        (canvas as HTMLCanvasElement).height = targetH;
        ctx = (canvas as HTMLCanvasElement).getContext("2d");
    }

    if (!ctx) {
        console.warn("compressImage: could not get 2d context, using original file");
        bitmap.close();
        return file;
    }

    // "medium" is significantly faster than "high" with barely visible quality difference
    (ctx as CanvasRenderingContext2D).imageSmoothingEnabled = true;
    (ctx as CanvasRenderingContext2D).imageSmoothingQuality = "medium";
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close();

    // 4. Single-pass WebP export (no loop)
    let blob: Blob | null = null;
    if (canvas instanceof OffscreenCanvas) {
        blob = await canvas.convertToBlob({ type: "image/webp", quality: QUALITY });
    } else {
        blob = await new Promise<Blob | null>(resolve => {
            (canvas as HTMLCanvasElement).toBlob(resolve, "image/webp", QUALITY);
        });
    }

    if (!blob) {
        console.warn("compressImage: blob conversion failed, using original file");
        return file;
    }

    // 5. If compression somehow made it larger, just use the original
    if (blob.size >= file.size) {
        console.info(`compressImage: result not smaller, using original`);
        return file;
    }

    const stem = file.name.replace(/\.[^.]+$/, "");
    const compressed = new File([blob], `${stem}.webp`, {
        type: "image/webp",
        lastModified: Date.now(),
    });

    console.info(
        `compressImage: ${(file.size / 1024).toFixed(0)} KB → ` +
        `${(compressed.size / 1024).toFixed(0)} KB at q=${QUALITY}, ` +
        `${origW}×${origH} → ${targetW}×${targetH}`
    );

    return compressed;
}
