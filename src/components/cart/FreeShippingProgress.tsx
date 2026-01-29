import { Truck, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface FreeShippingProgressProps {
  currentTotal: number;
  threshold?: number;
  className?: string;
}

const FreeShippingProgress = ({
  currentTotal,
  threshold = 300,
  className,
}: FreeShippingProgressProps) => {
  const progress = Math.min((currentTotal / threshold) * 100, 100);
  const remaining = threshold - currentTotal;
  const hasReachedThreshold = currentTotal >= threshold;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Truck className={cn(
            "h-4 w-4",
            hasReachedThreshold ? "text-green-600" : "text-muted-foreground"
          )} />
          {hasReachedThreshold ? (
            <span className="text-green-600 font-medium flex items-center gap-1">
              <Check className="h-4 w-4" />
              Ücretsiz kargo kazandınız!
            </span>
          ) : (
            <span className="text-muted-foreground">
              Ücretsiz kargo için{" "}
              <span className="font-semibold text-foreground">{formatPrice(remaining)}</span>
              {" "}daha ekleyin
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatPrice(currentTotal)} / {formatPrice(threshold)}
        </span>
      </div>
      <Progress
        value={progress}
        className={cn(
          "h-2",
          hasReachedThreshold ? "[&>div]:bg-green-600" : "[&>div]:bg-primary"
        )}
      />
    </div>
  );
};

export default FreeShippingProgress;
