/**
 * SmartImage — always renders a plain <img> for direct browser fetching.
 * We previously used next/image for Supabase URLs, but the server-side proxy
 * caused 7s timeouts in dev/serverless. Supabase Storage already serves
 * WebP files with CDN caching, so next/image optimization adds no benefit.
 */

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
    sizes: _sizes,
    className,
    priority,
    style,
    onClick,
}: SmartImageProps) {
    const fillStyle: React.CSSProperties = fill
        ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }
        : {};

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className={className}
            style={{ ...fillStyle, ...style }}
            onClick={onClick}
        />
    );
}
