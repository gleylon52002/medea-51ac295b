import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useQuery } from "@tanstack/react-query";

/**
 * Syncs the local cart to user_carts table for admin/seller visibility.
 * Also fetches any personal discounts applied by admin/seller.
 */
export const useCartSync = () => {
  const { user } = useAuth();
  const { cart } = useCart();

  // Sync cart items to database
  useEffect(() => {
    if (!user) return;

    const syncCart = async () => {
      try {
        // Delete old cart items for this user
        await supabase.from("user_carts" as any).delete().eq("user_id", user.id);

        if (cart.items.length === 0) return;

        // Insert current cart items
        const rows = cart.items.map((item) => ({
          user_id: user.id,
          product_id: item.product.id,
          quantity: item.quantity,
          variant_id: item.variant?.id || null,
          variant_info: item.variant ? { name: item.variant.name } : null,
          price_adjustment: item.priceAdjustment || 0,
        }));

        await supabase.from("user_carts" as any).insert(rows as any);
      } catch (err) {
        // Silent fail - this is a background sync
        console.error("Cart sync error:", err);
      }
    };

    // Debounce sync
    const timeout = setTimeout(syncCart, 2000);
    return () => clearTimeout(timeout);
  }, [user, cart.items]);
};

/**
 * Fetches personal discounts applied to the user's cart items
 */
export const usePersonalDiscounts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["personal-discounts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_carts" as any)
        .select("product_id, variant_id, personal_discount, discount_note")
        .eq("user_id", user.id)
        .gt("personal_discount", 0);

      if (error) throw error;
      return data as unknown as Array<{
        product_id: string;
        variant_id: string | null;
        personal_discount: number;
        discount_note: string | null;
      }>;
    },
    enabled: !!user,
    refetchInterval: 30000, // Check every 30s for new discounts
  });
};
