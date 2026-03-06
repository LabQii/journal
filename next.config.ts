import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        // Skip Next.js server-side image proxy so the browser fetches
        // Supabase CDN images directly. This eliminates the 7s proxy timeouts
        // in development and serverless environments.
        // Supabase Storage already serves optimized WebP files via its own CDN.
        unoptimized: true,
        remotePatterns: [
            {
                protocol: "https",
                hostname: "*.supabase.co",
                pathname: "/storage/v1/**",
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com",
            },
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
            },
        ],
    },
};

export default nextConfig;
