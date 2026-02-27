import { useState, useEffect, useRef } from "react";
import RatingDistribution from "./RatingDistribution";
import { Star, Loader2, ImagePlus, X } from "lucide-react";
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
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkPurchase = async () => {
      if (!user || !productId) { setHasPurchased(null); return; }
      const { data, error } = await supabase.rpc('has_purchased_product', {
        p_user_id: user.id, p_product_id: productId
      });
      if (!error) setHasPurchased(data || false);
    };
    checkPurchase();
  }, [user, productId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (reviewImages.length + files.length > 3) {
      toast.error("En fazla 3 fotoğraf ekleyebilirsiniz");
      return;
    }

    setUploadingImage(true);
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `reviews/${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file);
      if (error) { toast.error("Fotoğraf yüklenemedi"); continue; }
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      setReviewImages(prev => [...prev, urlData.publicUrl]);
    }
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (hasPurchased === false) {
      toast.error("Bu ürünü satın almadan değerlendirme yapamazsınız");
      return;
    }
    try {
      await createReview.mutateAsync({
        productId, rating, comment: comment.trim() || "", images: reviewImages,
      });
      setRating(5);
      setComment("");
      setReviewImages([]);
      toast.success("Değerlendirmeniz gönderildi!");
    } catch (error) {
      toast.error("Değerlendirme gönderilemedi");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
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
                <button key={star} type="button" onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)} onMouseLeave={() => setHoveredStar(0)} className="p-1">
                  <Star className={`h-6 w-6 transition-colors ${star <= (hoveredStar || rating) ? "fill-primary text-primary" : "fill-muted text-muted"}`} />
                </button>
              ))}
            </div>
          </div>
          <Textarea placeholder="Yorumunuzu yazın (isteğe bağlı)" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />

          {/* Photo Upload */}
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            <div className="flex items-center gap-3 flex-wrap">
              {reviewImages.map((img, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {reviewImages.length < 3 && (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
                  {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">En fazla 3 fotoğraf ekleyebilirsiniz</p>
          </div>

          <Button type="submit" disabled={createReview.isPending}>
            {createReview.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gönderiliyor...</> : "Değerlendirme Gönder"}
          </Button>
          <p className="text-xs text-muted-foreground">* Değerlendirmeniz onaylandıktan sonra yayınlanacaktır.</p>
        </form>
      ) : (
        <div className="p-6 bg-muted/30 rounded-xl text-center">
          <p className="text-muted-foreground">
            Değerlendirme yapmak için <a href="/giris" className="text-primary hover:underline">giriş yapın</a>
          </p>
        </div>
      )}

      {reviews && reviews.length > 0 && <RatingDistribution reviews={reviews} />}

      {/* Reviews List */}
      <div className="space-y-6">
        <h3 className="font-medium">Müşteri Değerlendirmeleri ({reviews?.length || 0})</h3>
        {reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-primary text-primary" : "fill-muted text-muted"}`} />
                      ))}
                    </div>
                    <span className="text-sm font-medium">Müşteri</span>
                    {review.order_id && (
                      <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">✓ Doğrulanmış Alıcı</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: tr })}
                  </span>
                </div>
                {review.comment && <p className="text-muted-foreground">{review.comment}</p>}
                {/* Review Photos */}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {review.images.map((img, i) => (
                      <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden border hover:opacity-80 transition-opacity">
                        <img src={img} alt="Yorum fotoğrafı" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Henüz değerlendirme yapılmamış. İlk değerlendiren siz olun!</p>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
