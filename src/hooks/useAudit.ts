import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useAudit = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const logAction = useMutation({
        mutationFn: async ({
            action,
            table,
            targetId,
            changes = {}
        }: {
            action: string;
            table?: string;
            targetId?: string;
            changes?: any
        }) => {
            const { error } = await supabase
                .from("audit_logs")
                .insert({
                    user_id: user?.id,
                    action,
                    target_table: table,
                    target_id: targetId,
                    changes,
                });

            if (error) console.error("Audit logging error:", error);
        }
    });

    return { logAction };
};

// Fraud detection logic (simplified)
export const useFraudDetection = () => {
    const checkOrder = useMutation({
        mutationFn: async (orderId: string) => {
            // 1. Fetch order details
            const { data: order } = await supabase
                .from("orders")
                .select("*, order_items(*)")
                .eq("id", orderId)
                .single();

            if (!order) return;

            // 2. Check for suspicious patterns (e.g., high total or multiple orders from same IP/User)
            const { count: recentOrders } = await supabase
                .from("orders")
                .select("*", { count: 'exact', head: true })
                .eq("user_id", order.user_id)
                .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            if (recentOrders && recentOrders > 5) {
                await supabase.from("fraud_alerts" as any).insert({
                    user_id: order.user_id,
                    order_id: orderId,
                    alert_type: 'high_velocity',
                    severity: 'high',
                    details: { count: recentOrders }
                });
            }
        }
    });

    return { checkOrder };
};
