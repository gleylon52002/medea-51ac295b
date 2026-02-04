import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useComparisonProducts,
  useAddToComparison,
  useRemoveFromComparison,
} from "@/hooks/useProductComparison";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CompareButtonProps {
  productId: string;
  variant?: "default" | "icon";
  className?: string;
}

const CompareButton = ({ productId, variant = "default", className }: CompareButtonProps) => {
  const { data: comparisons } = useComparisonProducts();
  const addToComparison = useAddToComparison();
  const removeFromComparison = useRemoveFromComparison();

  const existingComparison = comparisons?.find((c) => c.product_id === productId);
  const isInComparison = !!existingComparison;
  const comparisonCount = comparisons?.length || 0;

  const handleClick = () => {
    if (isInComparison && existingComparison) {
      removeFromComparison.mutate(existingComparison.id);
    } else {
      if (comparisonCount >= 4) {
        toast.error("En fazla 4 ürün karşılaştırabilirsiniz");
        return;
      }
      addToComparison.mutate(productId);
    }
  };

  if (variant === "icon") {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={handleClick}
        className={cn(
          isInComparison && "bg-primary text-primary-foreground hover:bg-primary/90",
          className
        )}
        title={isInComparison ? "Karşılaştırmadan çıkar" : "Karşılaştırmaya ekle"}
      >
        <Scale className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant={isInComparison ? "default" : "outline"}
      size="sm"
      onClick={handleClick}
      className={className}
    >
      <Scale className="h-4 w-4 mr-2" />
      {isInComparison ? "Karşılaştırmada" : "Karşılaştır"}
    </Button>
  );
};

export default CompareButton;
