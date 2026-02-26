import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
                .from("seller_escrow_balances" as any)
                .select("*")
                .eq("seller_id", seller.id)
                .single();

            if (error && error.code !== "PGRST116") throw error;

            if (!data) {
                // Initialize if doesn't exist
                const { data: newEscrow, error: initError } = await supabase
                    .from("seller_escrow_balances" as any)
                    .insert({
                        seller_id: seller.id,
                        pending_balance: 0,
                        available_balance: 0,
                        next_payout_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                    })
                    .select()
                    .single();

                if (initError) throw initError;
                return newEscrow as unknown as EscrowBalance;
            }

            return data as unknown as EscrowBalance;
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

export const usePayoutRequests = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["payout-requests", user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data: seller } = await supabase
                .from("sellers")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (!seller) return [];

            const { data, error } = await supabase
                .from("seller_payout_requests" as any)
                .select("*")
                .eq("seller_id", seller.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });
};

export const useCreatePayoutRequest = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ amount, bankInfo }: { amount: number, bankInfo: any }) => {
            if (!user) throw new Error("Giriş yapmanız gerekiyor");

            const { data: seller } = await supabase
                .from("sellers")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (!seller) throw new Error("Satıcı profili bulunamadı");

            // CRITICAL FIX: Check AND lock balance atomically using RPC
            const { data: lockResult, error: lockError } = await (supabase.rpc as any)('lock_seller_balance_for_payout', {
                p_seller_id: seller.id,
                p_amount: amount
            });

            if (lockError) {
                if (lockError.message.includes('Yetersiz')) {
                    throw new Error('Yetersiz kullanılabilir bakiye');
                }
                throw lockError;
            }

            // Now create the payout request with the locked balance
            const { data, error } = await supabase
                .from("seller_payout_requests" as any)
                .insert({
                    seller_id: seller.id,
                    amount,
                    bank_info: bankInfo,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) {
                // Rollback balance lock if insertion fails
                await (supabase.rpc as any)('unlock_seller_balance', {
                    p_seller_id: seller.id,
                    p_amount: amount
                });
                throw error;
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payout-requests"] });
            queryClient.invalidateQueries({ queryKey: ["escrow-balance"] });
            toast.success("Ödeme talebiniz başarıyla alındı. Bakiyeniz kilitlendi.");
        },
        onError: (error: Error) => {
            toast.error("Talep oluşturulamadı: " + error.message);
        }
    });
};
