import { useState, useEffect } from "react";
import { useProductVariants, ProductVariant, VariantType, getVariantTypeLabel } from "@/hooks/useProductVariants";
import { cn } from "@/lib/utils";

interface VariantSelectorProps {
  productId: string;
  basePrice: number;
  onVariantChange: (variant: ProductVariant | null, priceAdjustment: number) => void;
  onImagesChange?: (images: string[]) => void;
}

const VariantSelector = ({
  productId,
  basePrice,
  onVariantChange,
  onImagesChange,
}: VariantSelectorProps) => {
  const { data: variants, isLoading } = useProductVariants(productId);
  const [selectedVariants, setSelectedVariants] = useState<Record<VariantType, ProductVariant | null>>({
    color: null,
    weight: null,
    scent: null,
  });

  // Group variants by type
  const groupedVariants = variants?.reduce((acc, variant) => {
    if (!acc[variant.variant_type]) {
      acc[variant.variant_type] = [];
    }
    acc[variant.variant_type].push(variant);
    return acc;
  }, {} as Record<VariantType, ProductVariant[]>);

  // Calculate total price adjustment
  useEffect(() => {
    const totalAdjustment = Object.values(selectedVariants).reduce((sum, variant) => {
      return sum + (variant?.price_adjustment || 0);
    }, 0);

    // Get all selected variant images
    const selectedImages: string[] = [];
    Object.values(selectedVariants).forEach((variant) => {
      if (variant?.images && variant.images.length > 0) {
        selectedImages.push(...variant.images);
      }
    });

    // Find the primary selected variant (first one with a selection)
    const primaryVariant = Object.values(selectedVariants).find((v) => v !== null);

    onVariantChange(primaryVariant || null, totalAdjustment);

    if (selectedImages.length > 0 && onImagesChange) {
      onImagesChange(selectedImages);
    }
  }, [selectedVariants, onVariantChange, onImagesChange]);

  const handleSelectVariant = (type: VariantType, variant: ProductVariant) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [type]: prev[type]?.id === variant.id ? null : variant,
    }));
  };

  if (isLoading || !variants || variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {(["color", "weight", "scent"] as VariantType[]).map((type) => {
        const typeVariants = groupedVariants?.[type];
        if (!typeVariants || typeVariants.length === 0) return null;

        return (
          <div key={type}>
            <h4 className="text-sm font-medium mb-2">
              {getVariantTypeLabel(type)}
              {selectedVariants[type] && (
                <span className="text-muted-foreground font-normal ml-2">
                  : {selectedVariants[type]?.name}
                </span>
              )}
            </h4>
            <div className="flex flex-wrap gap-2">
              {typeVariants.map((variant) => {
                const isSelected = selectedVariants[type]?.id === variant.id;
                const isOutOfStock = variant.stock === 0;

                if (type === "color") {
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => !isOutOfStock && handleSelectVariant(type, variant)}
                      disabled={isOutOfStock}
                      title={`${variant.name}${isOutOfStock ? " (Stokta yok)" : ""}`}
                      className={cn(
                        "w-10 h-10 rounded-full border-2 transition-all relative",
                        isSelected
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-border hover:border-primary/50",
                        isOutOfStock && "opacity-50 cursor-not-allowed"
                      )}
                      style={{ backgroundColor: variant.color_code || "#ccc" }}
                    >
                      {isOutOfStock && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-full h-0.5 bg-destructive rotate-45 absolute" />
                        </span>
                      )}
                    </button>
                  );
                }

                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => !isOutOfStock && handleSelectVariant(type, variant)}
                    disabled={isOutOfStock}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-sm transition-all",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50",
                      isOutOfStock && "opacity-50 cursor-not-allowed line-through"
                    )}
                  >
                    {variant.name}
                    {variant.price_adjustment !== 0 && (
                      <span className="ml-1 text-xs opacity-75">
                        ({variant.price_adjustment > 0 ? "+" : ""}
                        {variant.price_adjustment}₺)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VariantSelector;
