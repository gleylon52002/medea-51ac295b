import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Profile {
    id: string;
    user_id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    birthday: string | null;
    created_at: string;
    updated_at: string;
}

export const useProfile = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["profile", user?.id],
        queryFn: async () => {
            if (!user) return null;

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();

            if (error) throw error;
            return data as Profile | null;
        },
        enabled: !!user,
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (data: Partial<Omit<Profile, "id" | "user_id" | "email" | "created_at" | "updated_at">>) => {
            if (!user) throw new Error("Giriş yapmanız gerekiyor");

            const { error } = await supabase
                .from("profiles")
                .update({
                    ...data,
                    updated_at: new Date().toISOString(),
                })
                .eq("user_id", user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            toast.success("Profil bilgileriniz güncellendi");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Profil güncellenemedi");
        },
    });
};
