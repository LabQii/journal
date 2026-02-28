/**
 * SmartImage
 *
 * Uses next/image for Supabase URLs (where we control the domain + have
 * optimized WebP files after compression). Falls back to a plain <img>
 * for any legacy external URL already stored in the database (Google, iStock,
 * etc.) — avoids the "hostname not configured" runtime error without
 * having to enumerate every possible external domain.
 */

import Image from "next/image";

const SUPABASE_HOST = "supabase.co";

function isSupabaseUrl(src: string): boolean {
    try {
        return new URL(src).hostname.endsWith(SUPABASE_HOST);
    } catch {
        return false;
    }
}

interface SmartImageProps {
    src: string;
    alt: string;
    fill?: boolean;
    sizes?: string;
    className?: string;
    priority?: boolean;
    style?: React.CSSProperties;
    onClick?: React.MouseEventHandler<HTMLImageElement>;
}

export function SmartImage({
    src,
    alt,
    fill,
    sizes,
    className,
    priority,
    style,
    onClick,
}: SmartImageProps) {
    if (isSupabaseUrl(src)) {
        return (
            <Image
                src={src}
                alt={alt}
                fill={fill}
                sizes={sizes}
                className={className}
                priority={priority}
                style={style}
                onClick={onClick}
            />
        );
    }

    // Legacy external URL — render a plain <img> with lazy loading
    // (no domain config needed, no next/image optimization overhead)
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className={className}
            style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", ...style } : style}
            onClick={onClick}
        />
    );
}
