import { useState } from "react";
import { RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface SubscriptionButtonProps {
  productId: string;
  productName: string;
  variantId?: string;
}

const SubscriptionButton = ({ productId, productName, variantId }: SubscriptionButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [interval, setInterval] = useState("30");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);

  const { data: existingSub } = useQuery({
    queryKey: ["subscription", productId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("product_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const handleSubscribe = async () => {
    if (!user) {
      toast({ title: "Giriş yapmalısınız", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Get default address
      const { data: address } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .maybeSingle();

      const { error } = await supabase.from("product_subscriptions").insert({
        user_id: user.id,
        product_id: productId,
        variant_id: variantId || null,
        quantity: parseInt(quantity),
        interval_days: parseInt(interval),
        shipping_address: address || {},
        next_delivery_at: new Date(Date.now() + parseInt(interval) * 86400000).toISOString(),
      });

      if (error) throw error;

      toast({ title: "Abonelik oluşturuldu!", description: `${productName} her ${interval} günde bir gönderilecek.` });
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Hata", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (existingSub) {
    return (
      <div className="flex items-center gap-2 text-sm text-primary">
        <Check className="h-4 w-4" />
        <span>Abonelik aktif - Her {existingSub.interval_days} günde bir</span>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Düzenli Sipariş
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Düzenli Sipariş Oluştur</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            <strong>{productName}</strong> ürününü otomatik olarak düzenli aralıklarla sipariş edin.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">Teslimat Sıklığı</label>
            <Select value={interval} onValueChange={setInterval}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15">Her 15 günde bir</SelectItem>
                <SelectItem value="30">Her 30 günde bir</SelectItem>
                <SelectItem value="45">Her 45 günde bir</SelectItem>
                <SelectItem value="60">Her 60 günde bir</SelectItem>
                <SelectItem value="90">Her 90 günde bir</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Adet</label>
            <Select value={quantity} onValueChange={setQuantity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map(n => (
                  <SelectItem key={n} value={String(n)}>{n} adet</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSubscribe} disabled={loading} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            {loading ? "Oluşturuluyor..." : "Abonelik Başlat"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionButton;
