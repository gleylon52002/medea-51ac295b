import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/products/ProductCard";
import { getFeaturedProducts } from "@/data/products";

const Favorites = () => {
  // Mock favorites - in real app, this would come from user data
  const favorites = getFeaturedProducts().slice(0, 2);

  return (
    <div>
      <h2 className="font-serif text-xl font-medium mb-6">Favorilerim</h2>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Henüz favori ürününüz bulunmuyor.</p>
          <Button asChild>
            <Link to="/urunler">Ürünleri Keşfet</Link>
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
