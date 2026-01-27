import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CartItem } from "@/types/product";
import { Database } from "@/integrations/supabase/types";

type PaymentMethod = Database["public"]["Enums"]["payment_method"];

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
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingCost: number;
  total: number;
  notes?: string;
}

const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MDA-${timestamp}-${random}`;
};

export const useCreateOrder = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateOrderParams) => {
      const orderNumber = generateOrderNumber();

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          user_id: user?.id || null,
          payment_method: params.paymentMethod,
          shipping_address: params.shippingAddress as unknown as Database["public"]["Tables"]["orders"]["Insert"]["shipping_address"],
          subtotal: params.subtotal,
          shipping_cost: params.shippingCost,
          total: params.total,
          notes: params.notes || null,
          status: "pending",
          payment_status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = params.items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.images?.[0] || null,
        quantity: item.quantity,
        unit_price: item.product.salePrice || item.product.price,
        total_price: (item.product.salePrice || item.product.price) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return { order, orderNumber };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};
