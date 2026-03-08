import { useState } from "react";
import { Heart, Loader2, Share2, Copy, Check, Link2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ProductCard from "@/components/products/ProductCard";
import { useFavorites } from "@/hooks/useFavorites";
import { ProductWithCategory } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Favorites = () => {
  const { data: favorites, isLoading } = useFavorites();
  const { user } = useAuth();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const favoriteProducts = favorites
    ?.map(f => f.products as unknown as ProductWithCategory)
    .filter(Boolean) || [];

  const handleShare = async () => {
    if (!user || favoriteProducts.length === 0) return;
    setSharing(true);
    try {
      const productIds = favoriteProducts.map(p => p.id);
      
      // Check if user already has a shared wishlist
      const { data: existing } = await supabase
        .from("shared_wishlists")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      let token: string;
      if (existing) {
        // Update existing
        await supabase
          .from("shared_wishlists")
          .update({ product_ids: productIds, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        token = existing.share_token;
      } else {
        // Create new
        const { data: newWishlist, error } = await supabase
          .from("shared_wishlists")
          .insert({ user_id: user.id, product_ids: productIds })
          .select("share_token")
          .single();
        if (error) throw error;
        token = newWishlist.share_token;
      }

      const link = `${window.location.origin}/favoriler/${token}`;
      setShareLink(link);
      setShareDialogOpen(true);
    } catch (err: any) {
      toast.error("Paylaşım linki oluşturulamadı");
      console.error(err);
    } finally {
      setSharing(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Link kopyalandı!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl font-medium">Favorilerim</h2>
        {favoriteProducts.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleShare} disabled={sharing}>
            {sharing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Share2 className="h-4 w-4 mr-2" />}
            Listeyi Paylaş
          </Button>
        )}
      </div>

      {favoriteProducts.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Henüz favori ürününüz bulunmuyor.</p>
          <Button asChild>
            <Link to="/urunler">Ürünleri Keşfet</Link>
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Favori Listeni Paylaş
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bu linki arkadaşlarınızla paylaşarak favori ürünlerinizi gösterebilirsiniz.
          </p>
          <div className="flex items-center gap-2">
            <Input value={shareLink} readOnly className="text-sm" />
            <Button size="icon" variant="outline" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <DialogFooter className="gap-2">
            {typeof navigator.share !== "undefined" && (
              <Button
                variant="outline"
                onClick={() => {
                  navigator.share({ title: "Favori Listem", text: "Favori ürünlerime göz at!", url: shareLink });
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Paylaş
              </Button>
            )}
            <Button onClick={() => setShareDialogOpen(false)}>Tamam</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Favorites;
