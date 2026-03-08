import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, ShoppingBag } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const SharedWishlist = () => {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["shared-wishlist", token],
    queryFn: async () => {
      const { data: wishlist, error } = await supabase
        .from("shared_wishlists")
        .select("*")
        .eq("share_token", token!)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!wishlist) return null;

      await supabase
        .from("shared_wishlists")
        .update({ view_count: (wishlist.view_count || 0) + 1 })
        .eq("id", wishlist.id);

      const productIds = wishlist.product_ids || [];
      if (productIds.length === 0) return { title: wishlist.title, view_count: wishlist.view_count, owner_name: "Bir kullanıcı", products: [] as any[] };

      const { data: products, error: prodError } = await supabase
        .from("products")
        .select("*, categories(*)")
        .in("id", productIds)
        .eq("is_active", true);

      if (prodError) throw prodError;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", wishlist.user_id)
        .maybeSingle();

      return { title: wishlist.title, view_count: wishlist.view_count || 0, owner_name: profile?.full_name || "Bir kullanıcı", products: products || [] };
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container-main py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="container-main py-16 text-center">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-medium mb-4">Liste Bulunamadı</h1>
          <p className="text-muted-foreground mb-6">Bu favori listesi artık mevcut değil veya paylaşımdan kaldırılmış.</p>
          <Button asChild>
            <Link to="/urunler">Ürünleri Keşfet</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title={`${data.title} - ${data.owner_name}'in Favori Listesi`}
        description={`${data.owner_name} favori ürünlerini sizinle paylaştı. ${data.products.length} ürün içeriyor.`}
      />
      <div className="container-main py-8 lg:py-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="text-sm text-muted-foreground">{data.owner_name}'in paylaştığı liste</span>
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-foreground">
            {data.title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {data.products.length} ürün · {data.view_count} kez görüntülendi
          </p>
        </div>

        {data.products.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Bu listede henüz ürün bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SharedWishlist;
