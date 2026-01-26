import { useState } from "react";
import { SlidersHorizontal, Grid3X3, LayoutList, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const filteredProducts = products?.filter((product) => {
    if (selectedCategory === "all") return true;
    return product.categories?.slug === selectedCategory;
  }) || [];

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return Number(a.sale_price || a.price) - Number(b.sale_price || b.price);
      case "price-desc":
        return Number(b.sale_price || b.price) - Number(a.sale_price || a.price);
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return b.is_featured ? 1 : -1;
    }
  });

  if (productsLoading || categoriesLoading) {
    return (
      <Layout>
        <div className="container-main py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-foreground">
            Tüm Ürünler
          </h1>
          <p className="mt-2 text-muted-foreground">
            {sortedProducts.length} ürün bulundu
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 pb-6 border-b border-border">
          <div className="flex gap-2 flex-1 flex-wrap">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              Tümü
            </Button>
            {categories?.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.slug)}
              >
                {category.name}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 items-center">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sırala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Öne Çıkanlar</SelectItem>
                <SelectItem value="newest">En Yeniler</SelectItem>
                <SelectItem value="price-asc">Fiyat: Düşükten Yükseğe</SelectItem>
                <SelectItem value="price-desc">Fiyat: Yüksekten Düşüğe</SelectItem>
              </SelectContent>
            </Select>

            <div className="hidden sm:flex border border-border rounded-md">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode("list")}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }
        >
          {sortedProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {sortedProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">
              Bu kategoride henüz ürün bulunmuyor.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Products;
