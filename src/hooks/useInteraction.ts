import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ProductQuestion {
    id: string;
    product_id: string;
    user_id: string;
    question: string;
    answer?: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

// Hook to fetch product questions
export const useProductQuestions = (productId?: string) => {
    return useQuery({
        queryKey: ["product-questions", productId],
        queryFn: async () => {
            if (!productId) return [];

            const { data, error } = await supabase
                .from("product_questions" as any)
                .select("*")
                .eq("product_id", productId)
                .eq("is_public", true)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as ProductQuestion[];
        },
        enabled: !!productId,
    });
};

// Hook to ask a question
export const useAskQuestion = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, question }: { productId: string; question: string }) => {
            if (!user) throw new Error("Giriş yapmanız gerekiyor");

            const { data, error } = await supabase
                .from("product_questions" as any)
                .insert({
                    product_id: productId,
                    user_id: user.id,
                    question,
                    is_public: true
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["product-questions", variables.productId] });
            toast.success("Sorunuz gönderildi! Satıcı yanıtladığında görünür olacaktır.");
        }
    });
};

// Hook for seller to answer questions
export const useSellerQuestions = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const fetchQuestions = useQuery({
        queryKey: ["seller-questions", user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data: seller } = await supabase
                .from("sellers")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (!seller) return [];

            const { data, error } = await supabase
                .from("product_questions" as any)
                .select(`
          *,
          products:products(name, slug)
        `)
                .eq("products.seller_id", seller.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });

    const answerQuestion = useMutation({
        mutationFn: async ({ questionId, answer }: { questionId: string; answer: string }) => {
            const { error } = await supabase
                .from("product_questions" as any)
                .update({ answer, updated_at: new Date().toISOString() })
                .eq("id", questionId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["seller-questions"] });
            toast.success("Cevap kaydedildi.");
        }
    });

    return { questions: fetchQuestions, answerQuestion };
};
