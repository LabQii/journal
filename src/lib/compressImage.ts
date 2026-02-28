/**
 * compressImage
 *
 * Client-side image compression using the Canvas API.
 * Zero external dependencies — runs entirely in the browser.
 *
 * What it does:
 *   1. Reads the file into a bitmap via createImageBitmap
 *   2. Draws onto a canvas scaled to ≤ MAX_WIDTH px (preserving aspect ratio)
 *   3. Exports as WebP with iterative quality reduction until < TARGET_SIZE_KB
 *   4. Returns a new File ready to upload
 */

const MAX_WIDTH = 1200;       // px — max width after resize
const TARGET_KB = 300;        // KB — soft target for file size
const INITIAL_Q = 0.85;       // WebP quality to start with
const MIN_Q = 0.55;       // Never go below this
const Q_STEP = 0.08;       // Quality decrement per iteration

export async function compressImage(file: File): Promise<File> {
    // 1. Decode the image into a bitmap (works with JPG, PNG, WebP, HEIC on Safari)
    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch {
        // createImageBitmap fails on some HEIC images — return original as fallback
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

    // 3. Draw onto an OffscreenCanvas (available in all modern browsers)
    //    Falls back to a regular canvas if OffscreenCanvas is unavailable.
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

    // Use a high-quality image smoothing algorithm
    (ctx as CanvasRenderingContext2D).imageSmoothingEnabled = true;
    (ctx as CanvasRenderingContext2D).imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close(); // free memory

    // 4. Iteratively compress — reduce quality until file is under TARGET_KB
    let quality = INITIAL_Q;
    let blob: Blob | null = null;

    while (quality >= MIN_Q) {
        if (canvas instanceof OffscreenCanvas) {
            blob = await canvas.convertToBlob({ type: "image/webp", quality });
        } else {
            blob = await new Promise<Blob | null>(resolve => {
                (canvas as HTMLCanvasElement).toBlob(resolve, "image/webp", quality);
            });
        }

        if (!blob) break;

        // If under target OR we've hit minimum quality, stop
        if (blob.size <= TARGET_KB * 1024 || quality <= MIN_Q) break;

        quality = Math.max(MIN_Q, +(quality - Q_STEP).toFixed(2));
    }

    if (!blob) {
        console.warn("compressImage: blob conversion failed, using original file");
        return file;
    }

    // 5. Build a new File with a .webp extension and the original name stem
    const stem = file.name.replace(/\.[^.]+$/, "");
    const compressed = new File([blob], `${stem}.webp`, {
        type: "image/webp",
        lastModified: Date.now(),
    });

    console.info(
        `compressImage: ${(file.size / 1024).toFixed(0)} KB → ` +
        `${(compressed.size / 1024).toFixed(0)} KB at q=${quality.toFixed(2)}, ` +
        `${origW}×${origH} → ${targetW}×${targetH}`
    );

    return compressed;
}
