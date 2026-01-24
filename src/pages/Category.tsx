import { useParams, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { getCategoryBySlug, getProductsByCategory } from "@/data/products";

const Category = () => {
  const { slug } = useParams<{ slug: string }>();
  const category = getCategoryBySlug(slug || "");
  const products = getProductsByCategory(slug || "");

  if (!category) {
    return (
      <Layout>
        <div className="container-main py-16 text-center">
          <h1 className="font-serif text-2xl font-medium mb-4">Kategori Bulunamadı</h1>
          <Button asChild>
            <Link to="/urunler">Ürünlere Dön</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/urunler" className="hover:text-foreground transition-colors">Ürünler</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{category.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-foreground">
            {category.name}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {category.description}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length} ürün bulundu
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {products.length === 0 && (
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

export default Category;
