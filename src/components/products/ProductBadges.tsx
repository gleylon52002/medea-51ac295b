import { Flame, Star, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductBadgesProps {
  isFeatured?: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  hasDiscount?: boolean;
  discountPercent?: number;
  className?: string;
}

const ProductBadges = ({
  isFeatured,
  isBestseller,
  isNew,
  hasDiscount,
  discountPercent,
  className,
}: ProductBadgesProps) => {
  const badges = [];

  if (hasDiscount && discountPercent) {
    badges.push({
      key: "discount",
      label: `%${discountPercent} İndirim`,
      icon: Flame,
      className: "bg-terracotta text-white",
    });
  }

  if (isBestseller) {
    badges.push({
      key: "bestseller",
      label: "Çok Satan",
      icon: TrendingUp,
      className: "bg-amber-500 text-white",
    });
  }

  if (isFeatured) {
    badges.push({
      key: "featured",
      label: "Öne Çıkan",
      icon: Star,
      className: "bg-primary text-primary-foreground",
    });
  }

  if (isNew) {
    badges.push({
      key: "new",
      label: "Yeni",
      icon: Sparkles,
      className: "bg-green-600 text-white",
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {badges.map((badge) => (
        <span
          key={badge.key}
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded",
            badge.className
          )}
        >
          <badge.icon className="h-3 w-3" />
          {badge.label}
        </span>
      ))}
    </div>
  );
};

export default ProductBadges;
