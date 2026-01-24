import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Minus, Plus, Star, Truck, Shield, Leaf, Heart } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/contexts/CartContext";
import { getProductBySlug, getProductsByCategory } from "@/data/products";
import { formatPrice } from "@/lib/utils";
import ProductCard from "@/components/products/ProductCard";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  
  const product = getProductBySlug(slug || "");

  if (!product) {
    return (
      <Layout>
        <div className="container-main py-16 text-center">
          <h1 className="font-serif text-2xl font-medium mb-4">Ürün Bulunamadı</h1>
          <Button asChild>
            <Link to="/urunler">Ürünlere Dön</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const relatedProducts = getProductsByCategory(product.categorySlug)
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.salePrice! / product.price) * 100)
    : 0;

  return (
    <Layout>
      <div className="container-main py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/urunler" className="hover:text-foreground transition-colors">Ürünler</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={`/kategori/${product.categorySlug}`} className="hover:text-foreground transition-colors">
            {product.category}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-xl overflow-hidden bg-secondary">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden bg-secondary border-2 border-transparent hover:border-primary transition-colors"
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Link
                to={`/kategori/${product.categorySlug}`}
                className="text-sm font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
              >
                {product.category}
              </Link>
              <h1 className="font-serif text-3xl lg:text-4xl font-medium text-foreground mt-2">
                {product.name}
              </h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? "fill-terracotta text-terracotta"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="font-medium">{product.rating}</span>
              <span className="text-muted-foreground">({product.reviewCount} değerlendirme)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-foreground">
                {formatPrice(product.salePrice || product.price)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(product.price)}
                  </span>
                  <span className="px-2 py-1 bg-terracotta text-white text-sm font-medium rounded">
                    %{discountPercent} İndirim
                  </span>
                </>
              )}
            </div>

            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.stock > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-sm text-muted-foreground">
                    Stokta ({product.stock} adet)
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span className="text-sm text-destructive">Stokta yok</span>
                </>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center border border-border rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-muted transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-3 hover:bg-muted transition-colors"
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button
                size="lg"
                className="flex-1"
                onClick={() => addToCart(product, quantity)}
                disabled={product.stock === 0}
              >
                Sepete Ekle
              </Button>
              <Button size="lg" variant="outline">
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            {/* Trust Features */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-primary" />
                <span className="text-sm">300₺ üzeri ücretsiz kargo</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm">Güvenli ödeme</span>
              </div>
              <div className="flex items-center gap-3">
                <Leaf className="h-5 w-5 text-primary" />
                <span className="text-sm">%100 doğal içerik</span>
              </div>
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-primary" />
                <span className="text-sm">Cruelty-free</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="description" className="mt-16">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
            <TabsTrigger
              value="description"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
            >
              Açıklama
            </TabsTrigger>
            <TabsTrigger
              value="ingredients"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
            >
              İçerikler
            </TabsTrigger>
            <TabsTrigger
              value="usage"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
            >
              Kullanım
            </TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="pt-6">
            <p className="text-muted-foreground leading-relaxed max-w-3xl">
              {product.description}
            </p>
          </TabsContent>
          <TabsContent value="ingredients" className="pt-6">
            <p className="text-muted-foreground leading-relaxed max-w-3xl">
              {product.ingredients || "İçerik bilgisi yakında eklenecek."}
            </p>
          </TabsContent>
          <TabsContent value="usage" className="pt-6">
            <p className="text-muted-foreground leading-relaxed max-w-3xl">
              {product.usage || "Kullanım talimatı yakında eklenecek."}
            </p>
          </TabsContent>
        </Tabs>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-16 border-t border-border">
            <h2 className="font-serif text-2xl lg:text-3xl font-medium text-foreground mb-8">
              Benzer Ürünler
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;
