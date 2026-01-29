import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import ProductCard from "./ProductCard";
import { Clock } from "lucide-react";

interface RecentlyViewedProps {
  currentProductId?: string;
}

const RecentlyViewed = ({ currentProductId }: RecentlyViewedProps) => {
  const { products, isLoading } = useRecentlyViewed();

  // Filter out current product if on product detail page
  const filteredProducts = currentProductId
    ? products.filter((p) => p.id !== currentProductId)
    : products;

  if (isLoading || filteredProducts.length === 0) return null;

  return (
    <section className="py-12 border-t border-border">
      <div className="flex items-center gap-2 mb-8">
        <Clock className="h-5 w-5 text-primary" />
        <h2 className="font-serif text-2xl lg:text-3xl font-medium text-foreground">
          Son Görüntülediğiniz Ürünler
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;
