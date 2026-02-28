import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Public client — uses anon key, respects RLS */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Admin client — uses service_role key, bypasses RLS.
 * Use ONLY on server-side API routes (never expose to the browser).
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Extract the storage file path from a Supabase public URL.
 * e.g. "https://<project>.supabase.co/storage/v1/object/public/books/1234-abc.jpg"
 *      → "1234-abc.jpg"
 * Returns null if the URL is not a Supabase storage URL for the given bucket.
 */
export function extractStoragePath(url: string, bucket: string): string | null {
    try {
        const marker = `/storage/v1/object/public/${bucket}/`;
        const idx = url.indexOf(marker);
        if (idx === -1) return null;
        return decodeURIComponent(url.slice(idx + marker.length));
    } catch {
        return null;
    }
}
