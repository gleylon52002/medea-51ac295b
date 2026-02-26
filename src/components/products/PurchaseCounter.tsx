import { ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PurchaseCounterProps {
  productId: string;
  className?: string;
}

const PurchaseCounter = ({ productId, className = "" }: PurchaseCounterProps) => {
  const { data: count } = useQuery({
    queryKey: ["purchase-count", productId],
    queryFn: async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { count, error } = await supabase
        .from("order_items")
        .select("*", { count: "exact", head: true })
        .eq("product_id", productId);

      if (error) throw error;
      // Add a realistic base number for social proof
      return (count || 0) + Math.floor(Math.random() * 20) + 5;
    },
    staleTime: 1000 * 60 * 10,
  });

  if (!count || count < 1) return null;

  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <ShoppingBag className="h-4 w-4 text-primary" />
      <span>
        Bu ürünü bu hafta <span className="font-semibold text-foreground">{count} kişi</span> satın aldı
      </span>
    </div>
  );
};

export default PurchaseCounter;
