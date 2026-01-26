import { Link } from "react-router-dom";
import { ShoppingBag, Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToggleFavorite, useIsFavorite } from "@/hooks/useFavorites";
import { formatPrice } from "@/lib/utils";
import { ProductWithCategory } from "@/hooks/useProducts";

interface ProductCardProps {
  product: ProductWithCategory;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { data: isFavorite } = useIsFavorite(product.id);
  const toggleFavorite = useToggleFavorite();
  
  const hasDiscount = product.sale_price && Number(product.sale_price) < Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(product.sale_price) / Number(product.price)) * 100)
    : 0;

  const handleAddToCart = () => {
    // Convert to the format expected by cart
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
      ingredients: product.ingredients || undefined,
      usage: product.usage_instructions || undefined,
      rating: 0,
      reviewCount: 0,
      createdAt: product.created_at,
    };
    addToCart(cartProduct);
  };

  return (
    <div className="group relative bg-card rounded-lg overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300">
      {/* Favorite Button */}
      {user && (
        <button
          onClick={() => toggleFavorite.mutate(product.id)}
          className="absolute top-3 right-3 z-10 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
        >
          <Heart 
            className={`h-4 w-4 ${isFavorite ? "fill-terracotta text-terracotta" : "text-muted-foreground"}`} 
          />
        </button>
      )}

      {/* Image */}
      <Link to={`/urun/${product.slug}`} className="block relative aspect-square overflow-hidden">
        <img
          src={product.images?.[0] || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-terracotta text-white text-xs font-medium px-2 py-1 rounded">
            %{discountPercent} İndirim
          </span>
        )}
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute bottom-3 left-3 bg-foreground/80 text-background text-xs font-medium px-2 py-1 rounded">
            Son {product.stock} Ürün
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link to={`/kategori/${product.categories?.slug}`}>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors">
            {product.categories?.name}
          </span>
        </Link>
        
        <Link to={`/urun/${product.slug}`}>
          <h3 className="mt-1 font-serif text-lg font-medium text-foreground line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {product.short_description}
        </p>

        {/* Price & Add to Cart */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-foreground">
              {formatPrice(Number(product.sale_price || product.price))}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(Number(product.price))}
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddToCart}
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
