import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CartItem } from "@/types/product";
import { Database } from "@/integrations/supabase/types";

interface ShippingAddress {
  full_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  postal_code: string;
}

interface CreateOrderParams {
  items: CartItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: Database["public"]["Enums"]["payment_method"];
  subtotal: number;
  shippingCost: number;
  total: number;
  notes?: string;
  couponCode?: string;
  discountAmount?: number;
  referralCode?: string | null;
  walletAmount?: number;
}

export const useCreateOrder = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateOrderParams) => {
      // PHASE 4: Use secure RPC for all operations
      // @ts-ignore - RPC types might not be updated yet
      const { data, error: rpcError } = await (supabase.rpc as any)("create_order_secure", {
        p_items: params.items as any,
        p_shipping_address: params.shippingAddress as any,
        p_payment_method: params.paymentMethod,
        p_shipping_cost: params.shippingCost,
        p_notes: params.notes || null,
        p_coupon_code: params.couponCode || null,
        p_referral_code: params.referralCode || null,
        p_wallet_amount: params.walletAmount || 0
      });

      if (rpcError) throw rpcError;

      const result = data as any as { id: string; order_number: string; total: number };

      return {
        order: { id: result.id },
        orderNumber: result.order_number
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-variants"] });
      queryClient.invalidateQueries({ queryKey: ["seller-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["seller-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] }); // FIX: Refresh wallet after use
    },
  });
};
