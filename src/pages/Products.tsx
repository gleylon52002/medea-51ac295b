import { useState } from "react";
import { SlidersHorizontal, Grid3X3, LayoutList, Loader2, X, Filter } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Advanced filters
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  // Calculate max price from products
  const maxPrice = Math.max(...(products?.map(p => Number(p.price)) || [1000]), 1000);

  const filteredProducts = products?.filter((product) => {
    // Category filter
    if (selectedCategory !== "all" && product.categories?.slug !== selectedCategory) {
      return false;
    }
    
    // Price filter
    const productPrice = Number(product.sale_price || product.price);
    if (productPrice < priceRange[0] || productPrice > priceRange[1]) {
      return false;
    }
    
    // Stock filter
    if (inStockOnly && product.stock <= 0) {
      return false;
    }
    
    // Sale filter
    if (onSaleOnly && !product.sale_price) {
      return false;
    }
    
    // Featured filter
    if (featuredOnly && !product.is_featured) {
      return false;
    }
    
    return true;
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

  const activeFiltersCount = [
    selectedCategory !== "all",
    priceRange[0] > 0 || priceRange[1] < maxPrice,
    inStockOnly,
    onSaleOnly,
    featuredOnly,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedCategory("all");
    setPriceRange([0, maxPrice]);
    setInStockOnly(false);
    setOnSaleOnly(false);
    setFeaturedOnly(false);
  };

  if (productsLoading || categoriesLoading) {
    return (
      <Layout>
        <div className="container-main py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="font-medium mb-3">Kategoriler</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="cat-all"
              checked={selectedCategory === "all"}
              onCheckedChange={() => setSelectedCategory("all")}
            />
            <Label htmlFor="cat-all" className="cursor-pointer">Tümü</Label>
          </div>
          {categories?.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${category.id}`}
                checked={selectedCategory === category.slug}
                onCheckedChange={() => setSelectedCategory(category.slug)}
              />
              <Label htmlFor={`cat-${category.id}`} className="cursor-pointer">
                {category.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="font-medium mb-3">Fiyat Aralığı</h4>
        <Slider
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          max={Math.ceil(maxPrice / 100) * 100}
          step={10}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{priceRange[0]}₺</span>
          <span>{priceRange[1]}₺</span>
        </div>
      </div>

      {/* Other Filters */}
      <div>
        <h4 className="font-medium mb-3">Diğer Filtreler</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="in-stock"
              checked={inStockOnly}
              onCheckedChange={(checked) => setInStockOnly(checked === true)}
            />
            <Label htmlFor="in-stock" className="cursor-pointer">Sadece Stokta Olanlar</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="on-sale"
              checked={onSaleOnly}
              onCheckedChange={(checked) => setOnSaleOnly(checked === true)}
            />
            <Label htmlFor="on-sale" className="cursor-pointer">İndirimli Ürünler</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={featuredOnly}
              onCheckedChange={(checked) => setFeaturedOnly(checked === true)}
            />
            <Label htmlFor="featured" className="cursor-pointer">Öne Çıkan Ürünler</Label>
          </div>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <Button variant="outline" onClick={clearAllFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Filtreleri Temizle
        </Button>
      )}
    </div>
  );

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

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 pb-6 border-b border-border">
          <div className="flex gap-2 flex-1 flex-wrap items-center">
            {/* Mobile Filter Button */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrele
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filtreler</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Quick Category Filters */}
            <div className="hidden lg:flex gap-2 flex-wrap">
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

            {/* Active Filters Display */}
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="hidden lg:flex">
                {activeFiltersCount} filtre aktif
                <button onClick={clearAllFilters} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
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

        <div className="flex gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <h3 className="font-medium mb-4">Filtreler</h3>
              <FilterContent />
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
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
                <p className="text-lg text-muted-foreground mb-4">
                  Bu kriterlere uygun ürün bulunamadı.
                </p>
                <Button variant="outline" onClick={clearAllFilters}>
                  Filtreleri Temizle
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
