import { Link } from "react-router-dom";
import { ShoppingBag, Star } from "lucide-react";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.salePrice! / product.price) * 100)
    : 0;

  return (
    <div className="group relative bg-card rounded-lg overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300">
      {/* Image */}
      <Link to={`/urun/${product.slug}`} className="block relative aspect-square overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-terracotta text-white text-xs font-medium px-2 py-1 rounded">
            %{discountPercent} İndirim
          </span>
        )}
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute top-3 right-3 bg-foreground/80 text-background text-xs font-medium px-2 py-1 rounded">
            Son {product.stock} Ürün
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link to={`/kategori/${product.categorySlug}`}>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors">
            {product.category}
          </span>
        </Link>
        
        <Link to={`/urun/${product.slug}`}>
          <h3 className="mt-1 font-serif text-lg font-medium text-foreground line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {product.shortDescription}
        </p>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1">
          <Star className="h-4 w-4 fill-terracotta text-terracotta" />
          <span className="text-sm font-medium">{product.rating}</span>
          <span className="text-sm text-muted-foreground">({product.reviewCount})</span>
        </div>

        {/* Price & Add to Cart */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-foreground">
              {formatPrice(product.salePrice || product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => addToCart(product)}
            disabled={product.stock === 0}
            className="gap-1.5"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Ekle</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
