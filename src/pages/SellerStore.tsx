import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, ShoppingBag, Loader2, Award } from "lucide-react";
import { ProductWithCategory } from "@/hooks/useProducts";

const SellerStore = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: seller, isLoading: sellerLoading } = useQuery({
    queryKey: ["seller-store", slug],
    queryFn: async () => {
      // Try slug first, then id
      let query = supabase
        .from("sellers")
        .select("*")
        .eq("status", "active");

      if (slug?.match(/^[0-9a-f-]{36}$/)) {
        query = query.eq("id", slug);
      } else {
        query = query.eq("slug", slug);
      }

      const { data, error } = await query.single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["seller-store-products", seller?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(*)")
        .eq("seller_id", seller!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProductWithCategory[];
    },
    enabled: !!seller?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ["seller-store-stats", seller?.id],
    queryFn: async () => {
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating, product_id!inner(seller_id)")
        .eq("is_approved", true);

      // Filter reviews for this seller's products
      const sellerReviews = reviews?.filter((r: any) => r.product_id?.seller_id === seller!.id) || [];
      const avgRating = sellerReviews.length > 0
        ? sellerReviews.reduce((s: number, r: any) => s + r.rating, 0) / sellerReviews.length
        : 0;

      return {
        avgRating,
        reviewCount: sellerReviews.length,
        productCount: products?.length || 0,
      };
    },
    enabled: !!seller?.id && !!products,
  });

  if (sellerLoading) {
    return (
      <Layout>
        <div className="container-main py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!seller) {
    return (
      <Layout>
        <div className="container-main py-16 text-center">
          <h1 className="font-serif text-2xl font-medium mb-4">Mağaza Bulunamadı</h1>
          <Link to="/urunler" className="text-primary hover:underline">Ürünlere Dön</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Banner */}
      <div className="relative bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        {seller.banner_url && (
          <img src={seller.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        )}
        <div className="container-main py-12 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center overflow-hidden flex-shrink-0">
              {seller.logo_url ? (
                <img src={seller.logo_url} alt={seller.company_name} className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag className="h-8 w-8 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-serif text-2xl lg:text-3xl font-bold text-foreground">
                  {seller.company_name}
                </h1>
                {seller.is_featured && (
                  <Badge className="bg-primary text-primary-foreground">
                    <Award className="h-3 w-3 mr-1" />
                    Öne Çıkan
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {seller.city}, {seller.district}
                </span>
                {stats && stats.reviewCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-terracotta text-terracotta" />
                    {stats.avgRating.toFixed(1)} ({stats.reviewCount} değerlendirme)
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <ShoppingBag className="h-4 w-4" />
                  {seller.total_orders} sipariş tamamlandı
                </span>
              </div>
              {seller.description && (
                <p className="mt-3 text-sm text-muted-foreground max-w-2xl">{seller.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="container-main py-8">
        <h2 className="font-serif text-xl font-semibold mb-6">
          Ürünler ({products?.length || 0})
        </h2>

        {productsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Bu mağazada henüz ürün bulunmuyor.</p>
        )}
      </div>
    </Layout>
  );
};

export default SellerStore;
