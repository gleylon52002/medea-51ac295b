import { useState } from "react";
import { Eye, ShoppingBag, Star, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import { ProductWithCategory } from "@/hooks/useProducts";
import StockUrgencyBadge from "./StockUrgencyBadge";

interface QuickViewProps {
  product: ProductWithCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickView = ({ product, open, onOpenChange }: QuickViewProps) => {
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);

  const hasDiscount = product.sale_price && Number(product.sale_price) < Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(product.sale_price) / Number(product.price)) * 100)
    : 0;

  const handleAddToCart = () => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      shortDescription: product.short_description || "",
      price: Number(product.price),
      salePrice: product.sale_price ? Number(product.sale_price) : undefined,
      images: product.images || [],
      category: product.categories?.name || "",
      categorySlug: product.categories?.slug || "",
      stock: product.stock,
      featured: product.is_featured,
      rating: 0,
      reviewCount: 0,
      createdAt: product.created_at,
      sellerId: product.seller_id,
    };
    addToCart(cartProduct);
    onOpenChange(false);
  };

  const images = product.images || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="relative aspect-square bg-muted">
            <img
              src={images[selectedImage] || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {hasDiscount && (
              <span className="absolute top-3 left-3 px-2 py-1 bg-destructive text-destructive-foreground text-xs font-bold rounded">
                %{discountPercent}
              </span>
            )}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-3 right-3 flex gap-2 justify-center">
                {images.slice(0, 4).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-12 h-12 rounded border-2 overflow-hidden ${
                      selectedImage === i ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {product.categories?.name}
                </span>
                <h3 className="font-serif text-xl font-semibold text-foreground mt-1">
                  {product.name}
                </h3>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {formatPrice(Number(product.sale_price || product.price))}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(Number(product.price))}
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground line-clamp-3">
                {product.description || product.short_description}
              </p>

              <StockUrgencyBadge stock={product.stock} />
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <Button onClick={handleAddToCart} disabled={product.stock === 0} className="w-full gap-2">
                <ShoppingBag className="h-4 w-4" />
                Sepete Ekle
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to={`/urun/${product.slug}`} onClick={() => onOpenChange(false)}>
                  Ürün Detayına Git
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickView;
