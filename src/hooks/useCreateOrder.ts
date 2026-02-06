import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CartItem } from "@/types/product";
import { Database } from "@/integrations/supabase/types";
import { Json } from "@/integrations/supabase/types";

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
      const sellerInfoMap = new Map<string, { seller_id: string; commission_rate: number }>();

      // Check stock for all items first
      for (const item of params.items) {
        if (item.variant?.id) {
          // Check variant stock
          const { data: variant, error: variantError } = await supabase
            .from("product_variants")
            .select(`
              stock, 
              name,
              product:products (
                seller_id,
                sellers (
                  commission_rate
                )
              )
            `)
            .eq("id", item.variant.id)
            .single();

          if (variantError) throw new Error(`Varyant bilgisi alınamadı: ${item.product.name}`);

          if (variant.stock < item.quantity) {
            throw new Error(`Yetersiz stok: "${item.product.name} - ${variant.name}" için sadece ${variant.stock} adet mevcut`);
          }

          // Store seller info if exists
          // @ts-ignore
          const productData = variant.product;
          if (productData?.seller_id) {
            // @ts-ignore
            const sellerData = Array.isArray(productData.sellers) ? productData.sellers[0] : productData.sellers;

            sellerInfoMap.set(item.product.id, {
              seller_id: productData.seller_id,
              commission_rate: sellerData?.commission_rate || 0
            });
          }
        } else {
          // Check product stock
          const { data: product, error: stockError } = await supabase
            .from("products")
            .select(`
              stock, 
              name, 
              seller_id,
              sellers (
                commission_rate
              )
            `)
            .eq("id", item.product.id)
            .single();

          if (stockError) throw new Error(`Ürün bilgisi alınamadı: ${item.product.name}`);

          if (product.stock < item.quantity) {
            throw new Error(`Yetersiz stok: "${product.name}" için sadece ${product.stock} adet mevcut`);
          }

          // Store seller info if exists
          if (product.seller_id) {
            // @ts-ignore
            const sellerData = Array.isArray(product.sellers) ? product.sellers[0] : product.sellers;

            sellerInfoMap.set(item.product.id, {
              seller_id: product.seller_id,
              commission_rate: sellerData?.commission_rate || 0
            });
          }
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
      const orderItems = params.items.map((item) => {
        const basePrice = item.product.salePrice || item.product.price;
        const priceAdjustment = item.priceAdjustment || 0;
        const unitPrice = basePrice + priceAdjustment;

        return {
          order_id: order.id,
          product_id: item.product.id,
          product_name: item.variant
            ? `${item.product.name} - ${item.variant.name}`
            : item.product.name,
          product_image: item.variant?.images?.[0] || item.product.images?.[0] || null,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: unitPrice * item.quantity,
          variant_id: item.variant?.id || null,
          variant_info: item.variant ? {
            id: item.variant.id,
            name: item.variant.name,
            variant_type: item.variant.variant_type,
            price_adjustment: item.priceAdjustment || 0,
          } as unknown as Json : null,
        };
      });

      const { data: createdItems, error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems)
        .select();

      if (itemsError) throw itemsError;

      // Create seller transactions
      const sellerTransactions = [];
      console.log("Debug - Seller Info Map size:", sellerInfoMap.size);
      sellerInfoMap.forEach((val, key) => console.log(`Debug - Map Item: ${key} -> Seller ${val.seller_id}`));

      if (createdItems && createdItems.length > 0) {
        for (const item of createdItems) {
          console.log(`Debug - Checking item: ${item.product_id}`);
          if (item.product_id && sellerInfoMap.has(item.product_id)) {
            const sellerInfo = sellerInfoMap.get(item.product_id)!;
            const saleAmount = item.total_price;
            const commissionAmount = (saleAmount * sellerInfo.commission_rate) / 100;
            const netAmount = saleAmount - commissionAmount;

            console.log(`Debug - Creating transaction for seller ${sellerInfo.seller_id}`);

            sellerTransactions.push({
              seller_id: sellerInfo.seller_id,
              order_id: order.id,
              order_item_id: item.id,
              product_id: item.product_id,
              sale_amount: saleAmount,
              commission_rate: sellerInfo.commission_rate,
              commission_amount: commissionAmount,
              net_amount: netAmount,
              status: "pending", // Default to pending until payment is confirmed or order delivered
            });
          } else {
            console.log("Debug - No seller info found for product", item.product_id);
          }
        }
      }

      console.log("Debug - Total transactions to insert:", sellerTransactions.length);

      if (sellerTransactions.length > 0) {
        const { error: transactionError } = await supabase
          .from("seller_transactions")
          .insert(sellerTransactions);

        if (transactionError) {
          console.error("Error creating seller transactions:", transactionError);
          // We don't throw here to avoid failing the whole order if tracking fails
          // But in a real app, this should be handled more robustly (e.g. queue)
        } else {
          console.log("Debug - Seller transactions inserted successfully");
        }
      }

      // Update stock for each product
      for (const item of params.items) {
        if (item.variant?.id) {
          // Update variant stock
          const { data: currentVariant } = await supabase
            .from("product_variants")
            .select("stock")
            .eq("id", item.variant.id)
            .single();

          if (currentVariant) {
            await supabase
              .from("product_variants")
              .update({ stock: Math.max(0, currentVariant.stock - item.quantity) })
              .eq("id", item.variant.id);
          }
        } else {
          // Update product stock
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
      }

      return { order, orderNumber };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-variants"] });
      queryClient.invalidateQueries({ queryKey: ["seller-transactions"] });
    },
  });
};
