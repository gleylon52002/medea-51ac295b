import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Minus, Plus, Star, Heart, Loader2, Play, ExternalLink } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useProductBySlug, useProductsByCategory, ProductWithCategory } from "@/hooks/useProducts";
import { useProductRating } from "@/hooks/useReviews";
import { useToggleFavorite, useIsFavorite } from "@/hooks/useFavorites";
import { addToRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { formatPrice } from "@/lib/utils";
import { trackViewItem } from "@/lib/analytics";
import ProductCard from "@/components/products/ProductCard";
import ProductReviews from "@/components/products/ProductReviews";
import StockUrgencyBadge from "@/components/products/StockUrgencyBadge";
import ViewerCount from "@/components/products/ViewerCount";
import ImageZoom from "@/components/products/ImageZoom";
import RecentlyViewed from "@/components/products/RecentlyViewed";
import TrustBadges from "@/components/products/TrustBadges";
import StickyAddToCart from "@/components/cart/StickyAddToCart";
import VariantSelector from "@/components/products/VariantSelector";
import CompareButton from "@/components/products/CompareButton";
import ProductQuestions from "@/components/products/ProductQuestions";
import InstallmentCalculator from "@/components/products/InstallmentCalculator";
import PurchaseCounter from "@/components/products/PurchaseCounter";
import ProductSchema from "@/components/products/ProductSchema";
import ProductAlerts from "@/components/products/ProductAlerts";
import EstimatedDelivery from "@/components/products/EstimatedDelivery";
import VerifiedSellerBadge from "@/components/products/VerifiedSellerBadge";
import PriceHistory from "@/components/products/PriceHistory";
import BundleOffers from "@/components/products/BundleOffers";
import AIRecommendations from "@/components/products/AIRecommendations";
import SubscriptionButton from "@/components/products/SubscriptionButton";
import SEOHead from "@/components/SEOHead";
import { trackInteraction } from "@/hooks/useInteraction";
import { ProductVariant } from "@/hooks/useProductVariants";
import { useRelatedProducts } from "@/hooks/useRelatedProducts";
import BarcodeScanner from "@/components/products/BarcodeScanner";
import { useProductTranslation } from "@/hooks/useProductTranslation";
import { Loader2 as TranslateLoader } from "lucide-react";
import VideoPlayer, { isVideoUrl } from "@/components/products/VideoPlayer";
import { toast } from "sonner";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [priceAdjustment, setPriceAdjustment] = useState(0);
  const [variantImages, setVariantImages] = useState<string[]>([]);
  const addToCartRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const { data: product, isLoading } = useProductBySlug(slug || "");
  const { data: rating } = useProductRating(product?.id || "");
  const { data: isFavorite } = useIsFavorite(product?.id || "");
  const toggleFavorite = useToggleFavorite();
  const { data: categoryProducts } = useProductsByCategory(product?.categories?.slug || "");
  const { data: relatedProductsData } = useRelatedProducts(product?.id || "");
  const pt = useProductTranslation({ product });

  // Get related products - first from explicit relations, then from category
  const relatedProducts = relatedProductsData && relatedProductsData.length > 0
    ? relatedProductsData.map(r => r.related_product).filter(Boolean)
    : categoryProducts?.filter(p => p.id !== product?.id).slice(0, 4) || [];

  // Track recently viewed
  useEffect(() => {
    if (product?.id) {
      addToRecentlyViewed(product.id);
      trackInteraction(product.id, "view");
      trackViewItem({ id: product.id, name: product.name, price: product.sale_price || product.price, category: product.categories?.name });
    }
  }, [product?.id]);

  const handleVariantChange = useCallback((variant: ProductVariant | null, adjustment: number) => {
    setSelectedVariant(variant);
    setPriceAdjustment(adjustment);
  }, []);

  const handleVariantImagesChange = useCallback((images: string[]) => {
    setVariantImages(images);
    if (images.length > 0) {
      setSelectedImage(0);
    }
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <div className="container-main py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

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

  // Display images/videos - variant images take priority if selected
  const displayImages = variantImages.length > 0 ? variantImages : (product.images || []);
  // Add video_url to display list if present
  const displayMedia: string[] = [...displayImages];
  if ((product as any).video_url) displayMedia.push((product as any).video_url);

  const basePrice = Number(product.sale_price || product.price);
  const finalPrice = basePrice + priceAdjustment;

  const hasDiscount = product.sale_price && Number(product.sale_price) < Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(product.sale_price) / Number(product.price)) * 100)
    : 0;

  const shopierLink = (product as any).shopier_link;

  const handleBuyClick = () => {
    if (shopierLink) {
      window.open(shopierLink, "_blank", "noopener,noreferrer");
    } else {
      toast.error("Bu ürün için satın alma linki henüz eklenmemiş");
    }
  };

  return (
    <Layout>
      <SEOHead
        title={`${product.meta_title || product.name} – El Yapımı Doğal Katı Sabun | MEDEA Kozmetik`}
        description={product.meta_description || `${product.name} – MEDEA doğal, el yapımı, kimyasal katkısız katı sabun. Cilde nazik formül. Hemen satın al – medea.tr`}
        canonical={`https://medea.tr/urun/${product.slug}`}
        ogImage={product.images?.[0]}
        ogType="product"
        keywords={(product as any).keywords || []}
      />
      <ProductSchema product={product} rating={rating} />
      <div className="container-main py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/urunler" className="hover:text-foreground transition-colors">Ürünler</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={`/kategori/${product.categories?.slug}`} className="hover:text-foreground transition-colors">
            {product.categories?.name}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image & Video Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden">
              {isVideoUrl(displayMedia[selectedImage] || "") ? (
                <VideoPlayer url={displayMedia[selectedImage]} className="w-full h-full" />
              ) : (
                <ImageZoom
                  src={displayMedia[selectedImage] || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full"
                />
              )}
            </div>
            {displayMedia.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {displayMedia.map((media, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden bg-secondary border-2 transition-colors ${selectedImage === index ? "border-primary" : "border-transparent hover:border-primary/50"}`}
                  >
                    {isVideoUrl(media) ? (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Play className="h-6 w-6 text-muted-foreground" />
                      </div>
                    ) : (
                      <img src={media} alt="" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Link
                to={`/kategori/${product.categories?.slug}`}
                className="text-sm font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
              >
                {product.categories?.name}
              </Link>
              <h1 className="font-serif text-3xl lg:text-4xl font-medium text-foreground mt-2">
                {pt.name}
                {pt.isTranslating && <TranslateLoader className="inline-block ml-2 h-4 w-4 animate-spin text-muted-foreground" />}
              </h1>
            </div>

            {/* Rating & Viewer Count */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < Math.floor(rating?.average || 0)
                    ? "fill-primary text-primary"
                        : "fill-muted text-muted"
                        }`}
                    />
                  ))}
                </div>
                <span className="font-medium">{rating?.average || 0}</span>
                <span className="text-muted-foreground">({rating?.count || 0} değerlendirme)</span>
              </div>
              <ViewerCount productId={product.id} />
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-foreground">
                {formatPrice(finalPrice)}
              </span>
              {hasDiscount && priceAdjustment === 0 && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(Number(product.price))}
                  </span>
                  <span className="px-2 py-1 bg-destructive text-destructive-foreground text-sm font-medium rounded">
                    %{discountPercent} İndirim
                  </span>
                </>
              )}
              {priceAdjustment !== 0 && (
                <span className="text-sm text-muted-foreground">
                  (Varyant: {priceAdjustment > 0 ? "+" : ""}{priceAdjustment}₺)
                </span>
              )}
            </div>

            {/* Installment Calculator */}
            <InstallmentCalculator price={finalPrice} />

            {/* Purchase Counter */}
            <PurchaseCounter productId={product.id} />

            <p className="text-muted-foreground leading-relaxed">
              {pt.description}
            </p>

            {/* Variant Selector */}
            <VariantSelector
              productId={product.id}
              basePrice={basePrice}
              onVariantChange={handleVariantChange}
              onImagesChange={handleVariantImagesChange}
            />

            {/* Stock Status with Urgency */}
            <div className="space-y-2">
              <StockUrgencyBadge stock={selectedVariant?.stock ?? product.stock} />
              {(selectedVariant?.stock ?? product.stock) > 10 && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success"></span>
                  <span className="text-sm text-muted-foreground">
                    Stokta ({selectedVariant?.stock ?? product.stock} adet)
                  </span>
                </div>
              )}
            </div>

            {/* Buy Button */}
            <div ref={addToCartRef} className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="flex-1 gap-2"
                onClick={handleBuyClick}
                disabled={!shopierLink}
              >
                <ExternalLink className="h-5 w-5" />
                Satın Al
              </Button>
              {user && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => toggleFavorite.mutate(product.id)}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? "fill-primary text-primary" : ""}`} />
                </Button>
              )}
              <CompareButton productId={product.id} variant="icon" />
              <BarcodeScanner />
            </div>

            {/* Subscription Button */}
            <SubscriptionButton
              productId={product.id}
              productName={product.name}
              variantId={selectedVariant?.id}
            />

            {/* Price & Stock Alerts */}
            <ProductAlerts
              productId={product.id}
              currentPrice={finalPrice}
              stock={selectedVariant?.stock ?? product.stock}
              variantId={selectedVariant?.id}
            />

            {/* Estimated Delivery */}
            <EstimatedDelivery stock={selectedVariant?.stock ?? product.stock} />

            {/* Verified Seller Badge */}
            {product.seller_id && (
              <VerifiedSellerBadge sellerId={product.seller_id} variant="full" />
            )}

            {/* Price History */}
            <PriceHistory
              currentPrice={finalPrice}
              originalPrice={hasDiscount ? Number(product.price) : undefined}
              productId={product.id}
            />

            {/* Bundle Offers */}
            <BundleOffers
              productId={product.id}
              currentProductName={product.name}
              currentPrice={finalPrice}
            />

            {/* Trust Features */}
            <TrustBadges variant="grid" className="pt-6 border-t border-border" />
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
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
            >
              Değerlendirmeler ({rating?.count || 0})
            </TabsTrigger>
            <TabsTrigger
              value="questions"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
            >
              Sorular
            </TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="pt-6">
            <p className="text-muted-foreground leading-relaxed max-w-3xl">
              {pt.description}
            </p>
          </TabsContent>
          <TabsContent value="ingredients" className="pt-6">
            <p className="text-muted-foreground leading-relaxed max-w-3xl">
              {pt.ingredients || "İçerik bilgisi yakında eklenecek."}
            </p>
          </TabsContent>
          <TabsContent value="usage" className="pt-6">
            <p className="text-muted-foreground leading-relaxed max-w-3xl">
              {pt.usage || "Kullanım talimatı yakında eklenecek."}
            </p>
          </TabsContent>
          <TabsContent value="reviews" className="pt-6">
            <ProductReviews productId={product.id} />
          </TabsContent>
          <TabsContent value="questions" className="pt-6">
            <ProductQuestions productId={product.id} />
          </TabsContent>
        </Tabs>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-16 border-t border-border">
            <h2 className="font-serif text-2xl lg:text-3xl font-medium text-foreground mb-8">
              Benzer Ürünler
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((relatedProduct: any) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}

        {/* AI Recommendations */}
        <AIRecommendations currentProductId={product.id} />

        {/* Recently Viewed */}
        <RecentlyViewed currentProductId={product.id} />
      </div>

      {/* Sticky Add to Cart for Mobile */}
    </Layout>
  );
};

export default ProductDetail;
