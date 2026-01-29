import { useState, useEffect } from "react";
import { ShoppingBag, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StickyAddToCartProps {
  productName: string;
  price: number;
  salePrice?: number;
  stock: number;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onAddToCart: () => void;
  triggerRef: React.RefObject<HTMLElement>;
}

const StickyAddToCart = ({
  productName,
  price,
  salePrice,
  stock,
  quantity,
  onQuantityChange,
  onAddToCart,
  triggerRef,
}: StickyAddToCartProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when the original button is not visible
        setIsVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    const currentRef = triggerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [triggerRef]);

  if (!isVisible || stock === 0) return null;

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg",
      "transform transition-transform duration-300",
      "lg:hidden" // Only show on mobile
    )}>
      <div className="container-main py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{productName}</p>
            <p className="text-lg font-semibold text-primary">
              {formatPrice(salePrice || price)}
            </p>
          </div>
          
          <div className="flex items-center border border-border rounded-md">
            <button
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="p-2 hover:bg-muted transition-colors"
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <button
              onClick={() => onQuantityChange(Math.min(stock, quantity + 1))}
              className="p-2 hover:bg-muted transition-colors"
              disabled={quantity >= stock}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          
          <Button onClick={onAddToCart} size="default" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Ekle
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StickyAddToCart;
