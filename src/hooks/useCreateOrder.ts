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
  couponCode?: string;
  discountAmount?: number;
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

      // Check stock for all items first
      for (const item of params.items) {
        const { data: product, error: stockError } = await supabase
          .from("products")
          .select("stock, name")
          .eq("id", item.product.id)
          .single();

        if (stockError) throw new Error(`Ürün bilgisi alınamadı: ${item.product.name}`);
        
        if (product.stock < item.quantity) {
          throw new Error(`Yetersiz stok: "${product.name}" için sadece ${product.stock} adet mevcut`);
        }
      }

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
          coupon_code: params.couponCode || null,
          discount_amount: params.discountAmount || 0,
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

      // Update stock for each product
      for (const item of params.items) {
        const { data: currentProduct } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.product.id)
          .single();

        if (currentProduct) {
          await supabase
            .from("products")
            .update({ stock: Math.max(0, currentProduct.stock - item.quantity) })
            .eq("id", item.product.id);
        }
      }

      return { order, orderNumber };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
