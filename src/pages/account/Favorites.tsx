import { Heart, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/products/ProductCard";
import { useFavorites } from "@/hooks/useFavorites";
import { ProductWithCategory } from "@/hooks/useProducts";

const Favorites = () => {
  const { data: favorites, isLoading } = useFavorites();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const favoriteProducts = favorites
    ?.map(f => f.products as unknown as ProductWithCategory)
    .filter(Boolean) || [];

  return (
    <div>
      <h2 className="font-serif text-xl font-medium mb-6">Favorilerim</h2>

      {favoriteProducts.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Henüz favori ürününüz bulunmuyor.</p>
          <Button asChild>
            <Link to="/urunler">Ürünleri Keşfet</Link>
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
