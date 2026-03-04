import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "@/types/product";

interface BulkDiscountRule {
  id: string;
  name: string;
  rule_type: string;
  buy_quantity: number;
  pay_quantity: number | null;
  discount_percent: number | null;
  applies_to: string;
  product_ids: string[] | null;
  category_id: string | null;
  is_active: boolean;
}

export const useBulkDiscounts = () => {
  return useQuery({
    queryKey: ["bulk-discount-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bulk_discount_rules")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data as BulkDiscountRule[];
    },
  });
};

export const calculateBulkDiscount = (items: CartItem[], rules: BulkDiscountRule[]): { discount: number; appliedRule: string | null } => {
  let totalDiscount = 0;
  let appliedRule: string | null = null;

  for (const rule of rules) {
    for (const item of items) {
      const applies = rule.applies_to === "all" ||
        (rule.applies_to === "specific" && rule.product_ids?.includes(item.product.id));

      if (!applies) continue;

      if (rule.rule_type === "buy_x_pay_y" && rule.pay_quantity) {
        // e.g., buy 3 pay 2
        if (item.quantity >= rule.buy_quantity) {
          const freeItems = Math.floor(item.quantity / rule.buy_quantity) * (rule.buy_quantity - rule.pay_quantity);
          const itemPrice = item.product.salePrice || item.product.price;
          totalDiscount += freeItems * itemPrice;
          appliedRule = rule.name;
        }
      } else if (rule.rule_type === "quantity_discount" && rule.discount_percent) {
        // e.g., buy 5+ get 20% off
        if (item.quantity >= rule.buy_quantity) {
          const itemPrice = item.product.salePrice || item.product.price;
          totalDiscount += (itemPrice * item.quantity * rule.discount_percent) / 100;
          appliedRule = rule.name;
        }
      }
    }
  }

  return { discount: totalDiscount, appliedRule };
};
