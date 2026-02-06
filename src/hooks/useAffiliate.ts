import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Wallet {
    id: string;
    user_id: string;
    balance: number;
    currency: string;
    updated_at: string;
}

export interface WalletTransaction {
    id: string;
    wallet_id: string;
    amount: number;
    transaction_type: 'credit' | 'debit';
    description: string;
    created_at: string;
}

export interface AffiliateLink {
    id: string;
    user_id: string;
    code: string;
    clicks: number;
    created_at: string;
}

// Hook to fetch user's wallet
export const useWallet = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["wallet", user?.id],
        queryFn: async () => {
            if (!user) return null;

            const { data, error } = await supabase
                .from("wallets")
                .select("*")
                .eq("user_id", user.id)
                .single();

            if (error && error.code !== "PGRST116") throw error;

            if (!data) {
                // Initialize wallet if doesn't exist
                const { data: newWallet, error: initError } = await supabase
                    .from("wallets")
                    .insert({ user_id: user.id, balance: 0 })
                    .select()
                    .single();

                if (initError) throw initError;
                return newWallet as Wallet;
            }

            return data as Wallet;
        },
        enabled: !!user,
    });
};

// Hook to fetch wallet transactions
export const useWalletTransactions = () => {
    const { data: wallet } = useWallet();

    return useQuery({
        queryKey: ["wallet-transactions", wallet?.id],
        queryFn: async () => {
            if (!wallet) return [];

            const { data, error } = await supabase
                .from("wallet_transactions")
                .select("*")
                .eq("wallet_id", wallet.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as WalletTransaction[];
        },
        enabled: !!wallet,
    });
};

// Hook to manage affiliate links
export const useAffiliate = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const referralLink = useQuery({
        queryKey: ["affiliate-link", user?.id],
        queryFn: async () => {
            if (!user) return null;

            const { data, error } = await supabase
                .from("affiliate_links")
                .select("*")
                .eq("user_id", user.id)
                .single();

            if (error && error.code !== "PGRST116") throw error;
            return data as AffiliateLink;
        },
        enabled: !!user,
    });

    const generateLink = useMutation({
        mutationFn: async () => {
            if (!user) throw new Error("Giriş yapmanız gerekiyor");

            const code = `REF-${user.id.substring(0, 5)}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase();

            const { data, error } = await supabase
                .from("affiliate_links")
                .insert({ user_id: user.id, code })
                .select()
                .single();

            if (error) throw error;
            return data as AffiliateLink;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["affiliate-link"] });
            toast.success("Referans linkiniz oluşturuldu!");
        },
    });

    return { referralLink, generateLink };
};
