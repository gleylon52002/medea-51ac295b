import { Flame, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockUrgencyBadgeProps {
  stock: number;
  className?: string;
  size?: "sm" | "md";
}

const StockUrgencyBadge = ({ stock, className, size = "md" }: StockUrgencyBadgeProps) => {
  if (stock === 0) {
    return (
      <div className={cn(
        "flex items-center gap-1.5 bg-destructive/90 text-destructive-foreground font-medium rounded px-2 py-1",
        size === "sm" ? "text-xs" : "text-sm",
        className
      )}>
        <Clock className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
        Stokta Yok
      </div>
    );
  }

  if (stock <= 3) {
    return (
      <div className={cn(
        "flex items-center gap-1.5 bg-error text-error-foreground font-medium rounded px-2 py-1 animate-pulse",
        size === "sm" ? "text-xs" : "text-sm",
        className
      )}>
        <Flame className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
        Son {stock} Ürün!
      </div>
    );
  }

  if (stock <= 10) {
    return (
      <div className={cn(
        "flex items-center gap-1.5 bg-warning text-warning-foreground font-medium rounded px-2 py-1",
        size === "sm" ? "text-xs" : "text-sm",
        className
      )}>
        <TrendingUp className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
        Tükenmek Üzere
      </div>
    );
  }

  return null;
};

export default StockUrgencyBadge;
