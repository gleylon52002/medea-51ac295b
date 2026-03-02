import { useEffect, useState } from "react";
import { ShoppingBag, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RecentPurchase {
  product_name: string;
  city: string;
  time_ago: string;
}

const RecentPurchaseToast = () => {
  const [purchase, setPurchase] = useState<RecentPurchase | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const fetchRecentPurchases = async () => {
      const { data } = await supabase
        .from("order_items")
        .select(`
          product_name,
          created_at,
          orders!inner (
            shipping_address
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        return data.map(item => {
          const address = item.orders?.shipping_address as { city?: string } | null;
          const createdAt = new Date(item.created_at);
          const now = new Date();
          const diffMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
          
          let timeAgo = "";
          if (diffMinutes < 60) {
            timeAgo = `${diffMinutes} dakika önce`;
          } else if (diffMinutes < 1440) {
            timeAgo = `${Math.floor(diffMinutes / 60)} saat önce`;
          } else {
            timeAgo = `${Math.floor(diffMinutes / 1440)} gün önce`;
          }

          return {
            product_name: item.product_name,
            city: address?.city || "İstanbul",
            time_ago: timeAgo,
          };
        });
      }
      return [];
    };

    // Show purchase notifications periodically
    const showNotification = async () => {
      const purchases = await fetchRecentPurchases();
      
      if (purchases.length > 0) {
        const randomPurchase = purchases[Math.floor(Math.random() * purchases.length)];
        setPurchase(randomPurchase);
        setIsVisible(true);

        // Hide after 5 seconds
        setTimeout(() => {
          setIsVisible(false);
        }, 5000);
      }
    };

    // Initial delay before first notification
    const initialTimer = setTimeout(showNotification, 8000);

    // Show periodically
    const interval = setInterval(showNotification, 45000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [dismissed]);

  if (!isVisible || !purchase || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-2 right-2 sm:left-4 sm:right-auto z-50 w-auto sm:max-w-sm animate-in slide-in-from-left-full duration-300">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-full">
          <ShoppingBag className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground line-clamp-1">
            {purchase.product_name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {purchase.city}'den birisi {purchase.time_ago} satın aldı
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default RecentPurchaseToast;
