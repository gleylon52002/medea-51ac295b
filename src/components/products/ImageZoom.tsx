import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
}

const ImageZoom = ({ src, alt, className }: ImageZoomProps) => {
  const [isZooming, setIsZooming] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPosition({ x, y });
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden cursor-zoom-in rounded-xl bg-secondary",
        className
      )}
      onMouseEnter={() => setIsZooming(true)}
      onMouseLeave={() => setIsZooming(false)}
      onMouseMove={handleMouseMove}
    >
      <img
        src={src}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-transform duration-200",
          isZooming && "scale-150"
        )}
        style={
          isZooming
            ? {
                transformOrigin: `${position.x}% ${position.y}%`,
              }
            : undefined
        }
      />
      {!isZooming && (
        <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded text-xs text-muted-foreground pointer-events-none">
          Yakınlaştırmak için fareyi üzerine getirin
        </div>
      )}
    </div>
  );
};

export default ImageZoom;
