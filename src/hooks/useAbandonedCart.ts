import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

export const useAbandonedCartTracker = () => {
  const { user } = useAuth();
  const { cart } = useCart();

  useEffect(() => {
    if (!user || cart.items.length === 0) return;

    const timer = setTimeout(async () => {
      try {
        const cartSnapshot = cart.items.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: item.product.salePrice || item.product.price,
          image: item.product.images?.[0],
        }));

        await supabase.from("abandoned_cart_reminders").upsert(
          {
            user_id: user.id,
            cart_snapshot: cartSnapshot,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      } catch (e) {
        // Silent fail
      }
    }, 30 * 60 * 1000);

    return () => clearTimeout(timer);
  }, [user, cart.items]);
};
