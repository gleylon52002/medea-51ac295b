import { Link } from "react-router-dom";
import { Scale, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useComparisonProducts,
  useRemoveFromComparison,
} from "@/hooks/useProductComparison";
import { cn } from "@/lib/utils";

const ComparisonFloat = () => {
  const { data: comparisons } = useComparisonProducts();
  const removeFromComparison = useRemoveFromComparison();

  if (!comparisons || comparisons.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card border rounded-lg shadow-lg p-4 max-w-md w-full mx-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <span className="font-medium">Karşılaştırma ({comparisons.length}/4)</span>
        </div>
        <Button asChild size="sm">
          <Link to="/karsilastir">Karşılaştır</Link>
        </Button>
      </div>
      <div className="flex gap-2">
        {comparisons.map((item) => (
          <div key={item.id} className="relative">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted">
              {item.product?.images?.[0] ? (
                <img
                  src={item.product.images[0]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
            <button
              onClick={() => removeFromComparison.mutate(item.id)}
              className="absolute -top-1 -right-1 p-0.5 bg-destructive text-destructive-foreground rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComparisonFloat;
