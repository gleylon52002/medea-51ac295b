import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/products/ProductCard";
import { useFeaturedProducts } from "@/hooks/useProducts";
import TranslatedText from "@/components/TranslatedText";

const FeaturedProducts = () => {
  const { data: featuredProducts, isLoading } = useFeaturedProducts();

  if (isLoading) {
    return (
      <section className="py-16 lg:py-24 bg-background">
        <div className="container-main flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (!featuredProducts || featuredProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container-main">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="font-serif text-3xl lg:text-4xl font-medium text-foreground">
              <TranslatedText textKey="featured.title" originalText="Öne Çıkan Ürünler" />
            </h2>
            <p className="mt-2 text-muted-foreground">
              <TranslatedText textKey="featured.subtitle" originalText="En çok tercih edilen doğal bakım ürünlerimiz" />
            </p>
          </div>
          <Button variant="ghost" className="gap-2 self-start sm:self-auto" asChild>
            <Link to="/urunler">
              <TranslatedText textKey="featured.view_all" originalText="Tümünü Gör" />
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.slice(0, 4).map((product, index) => (
            <div
              key={product.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
