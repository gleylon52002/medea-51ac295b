import { useState, useEffect } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useProductReviews, useCreateReview } from "@/hooks/useReviews";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { user } = useAuth();
  const { data: reviews, isLoading } = useProductReviews(productId);
  const createReview = useCreateReview();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [hasPurchased, setHasPurchased] = useState<boolean | null>(null);

  // Check if user has purchased this product
  useEffect(() => {
    const checkPurchase = async () => {
      if (!user || !productId) {
        setHasPurchased(null);
        return;
      }

      const { data, error } = await supabase.rpc('has_purchased_product', {
        p_user_id: user.id,
        p_product_id: productId
      });

      if (!error) {
        setHasPurchased(data || false);
      }
    };

    checkPurchase();
  }, [user, productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate purchase before allowing review
    if (hasPurchased === false) {
      toast.error("Bu ürünü satın almadan değerlendirme yapamazsınız");
      return;
    }

    try {
      await createReview.mutateAsync({
        productId,
        rating,
        comment: comment.trim() || "",
      });
      setRating(5);
      setComment("");
      toast.success("Değerlendirmeniz gönderildi!");
    } catch (error) {
      console.error("Error creating review:", error);
      toast.error("Değerlendirme gönderilemedi");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Write Review Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-muted/30 rounded-xl">
          <h3 className="font-medium">Değerlendirme Yazın</h3>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Puanınız:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-1"
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${star <= (hoveredStar || rating)
                      ? "fill-terracotta text-terracotta"
                      : "fill-muted text-muted"
                      }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <Textarea
            placeholder="Yorumunuzu yazın (isteğe bağlı)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />

          <Button type="submit" disabled={createReview.isPending}>
            {createReview.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              "Değerlendirme Gönder"
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            * Değerlendirmeniz onaylandıktan sonra yayınlanacaktır.
          </p>
        </form>
      ) : (
        <div className="p-6 bg-muted/30 rounded-xl text-center">
          <p className="text-muted-foreground">
            Değerlendirme yapmak için{" "}
            <a href="/giris" className="text-primary hover:underline">
              giriş yapın
            </a>
          </p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        <h3 className="font-medium">
          Müşteri Değerlendirmeleri ({reviews?.length || 0})
        </h3>

        {reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating
                            ? "fill-terracotta text-terracotta"
                            : "fill-muted text-muted"
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">Müşteri</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(review.created_at), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-muted-foreground">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            Henüz değerlendirme yapılmamış. İlk değerlendiren siz olun!
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
