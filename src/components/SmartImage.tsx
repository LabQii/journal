/**
 * SmartImage — renders a plain <img> for direct browser fetching.
 * We use next/image with `unoptimized: true` in next.config.ts so
 * Supabase Storage serves WebP files via its own CDN without a proxy.
 *
 * Key attributes emitted:
 * - loading="eager" + fetchpriority="high" for above-fold images (priority prop)
 * - loading="lazy" + fetchpriority="auto" for below-fold images
 * - decoding="async" always — avoids blocking the main thread on decode
 */

interface SmartImageProps {
    src: string;
    alt: string;
    fill?: boolean;
    sizes?: string;
    className?: string;
    /** Set true for the first visible images on the page to boost LCP */
    priority?: boolean;
    style?: React.CSSProperties;
    width?: number;
    height?: number;
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
    width,
    height,
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
            // fetchpriority is a valid HTML attribute; React 19 passes it through correctly
            // eslint-disable-next-line react/no-unknown-property
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            width={width}
            height={height}
            className={className}
            style={{ ...fillStyle, ...style }}
            onClick={onClick}
        />
    );
}
