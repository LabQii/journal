import { createClient } from "@supabase/supabase-js";

/**
 * Browser-safe Supabase client — uses only NEXT_PUBLIC_ env vars.
 * Safe to import in client components ("use client").
 *
 * Do NOT import supabase-admin or supabase.ts in client components —
 * those files reference SUPABASE_SERVICE_ROLE_KEY which is server-only.
 */
export const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
