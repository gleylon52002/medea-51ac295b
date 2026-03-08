import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Syncs the local cart to user_carts table for admin/seller visibility.
 * Also fetches any personal discounts applied by admin/seller.
 */
export const useCartSync = () => {
  const { user } = useAuth();
  const { cart } = useCart();

  // Sync cart items to database (preserves admin-applied personal discounts)
  useEffect(() => {
    if (!user) return;

    const syncCart = async () => {
      try {
        // First, fetch existing rows to preserve personal_discount and discount_note
        const { data: existingRows } = await supabase
          .from("user_carts" as any)
          .select("product_id, variant_id, personal_discount, discount_note")
          .eq("user_id", user.id);

        const discountMap = new Map<string, { personal_discount: number; discount_note: string | null }>();
        if (existingRows) {
          for (const row of existingRows as any[]) {
            const key = `${row.product_id}_${row.variant_id || ""}`;
            if (row.personal_discount > 0) {
              discountMap.set(key, {
                personal_discount: row.personal_discount,
                discount_note: row.discount_note,
              });
            }
          }
        }

        // Delete old cart items for this user
        await supabase.from("user_carts" as any).delete().eq("user_id", user.id);

        if (cart.items.length === 0) return;

        // Insert current cart items, restoring any existing discounts
        const rows = cart.items.map((item) => {
          const key = `${item.product.id}_${item.variant?.id || ""}`;
          const existing = discountMap.get(key);
          return {
            user_id: user.id,
            product_id: item.product.id,
            quantity: item.quantity,
            variant_id: item.variant?.id || null,
            variant_info: item.variant ? { name: item.variant.name } : null,
            price_adjustment: item.priceAdjustment || 0,
            personal_discount: existing?.personal_discount || 0,
            discount_note: existing?.discount_note || null,
          };
        });

        await supabase.from("user_carts" as any).insert(rows as any);
      } catch (err) {
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
  const queryClient = useQueryClient();

  // Listen for realtime changes to user_carts
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('personal-discounts')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_carts', filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["personal-discounts", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

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
    refetchInterval: 10000,
  });
};
