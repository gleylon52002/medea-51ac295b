import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export const useOrders = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as OrderWithItems[];
    },
    enabled: !!user,
  });
};

export const useOrderByNumber = (orderNumber: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["orders", orderNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("order_number", orderNumber)
        .maybeSingle();

      if (error) throw error;
      return data as OrderWithItems | null;
    },
    enabled: !!orderNumber,
  });
};
