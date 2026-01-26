import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Address = Database["public"]["Tables"]["addresses"]["Row"];
type AddressInsert = Database["public"]["Tables"]["addresses"]["Insert"];

export const useAddresses = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["addresses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Address[];
    },
    enabled: !!user,
  });
};

export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (address: Omit<AddressInsert, "user_id">) => {
      if (!user) throw new Error("Giriş yapmalısınız");

      const { error } = await supabase.from("addresses").insert({
        ...address,
        user_id: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Adres eklendi");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Adres eklenemedi");
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...address }: Partial<Address> & { id: string }) => {
      const { error } = await supabase
        .from("addresses")
        .update(address)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Adres güncellendi");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Adres güncellenemedi");
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Adres silindi");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Adres silinemedi");
    },
  });
};
