import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EscrowBalance {
    seller_id: string;
    pending_balance: number;
    available_balance: number;
    payout_frequency: 'weekly' | 'monthly';
    next_payout_date: string;
}

export const useEscrow = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["escrow-balance", user?.id],
        queryFn: async () => {
            if (!user) return null;

            // First get seller_id
            const { data: seller } = await supabase
                .from("sellers")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (!seller) return null;

            const { data, error } = await supabase
                .from("seller_escrow_balances")
                .select("*")
                .eq("seller_id", seller.id)
                .single();

            if (error && error.code !== "PGRST116") throw error;

            if (!data) {
                // Initialize if doesn't exist
                const { data: newEscrow, error: initError } = await supabase
                    .from("seller_escrow_balances")
                    .insert({
                        seller_id: seller.id,
                        pending_balance: 0,
                        available_balance: 0,
                        next_payout_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                    })
                    .select()
                    .single();

                if (initError) throw initError;
                return newEscrow as EscrowBalance;
            }

            return data as EscrowBalance;
        },
        enabled: !!user,
    });
};

export const useEscrowTransactions = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["escrow-transactions", user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data: seller } = await supabase
                .from("sellers")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (!seller) return [];

            const { data, error } = await supabase
                .from("seller_transactions")
                .select("*")
                .eq("seller_id", seller.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });
};
