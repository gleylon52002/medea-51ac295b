import { BadgeCheck, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface VerifiedSellerBadgeProps {
  sellerId: string | null | undefined;
  variant?: "compact" | "full";
}

const VerifiedSellerBadge = ({ sellerId, variant = "compact" }: VerifiedSellerBadgeProps) => {
  const { data: seller } = useQuery({
    queryKey: ["seller-badge", sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sellers")
        .select("company_name, slug, status, reputation_points, total_orders")
        .eq("id", sellerId!)
        .eq("status", "active")
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!sellerId,
    staleTime: 5 * 60 * 1000,
  });

  if (!seller) return null;

  const isVerified = seller.total_orders >= 5 || seller.reputation_points >= 100;

  if (variant === "compact") {
    return (
      <Link
        to={`/magaza/${seller.slug || sellerId}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
      >
        <Store className="h-3 w-3" />
        <span>{seller.company_name}</span>
        {isVerified && (
          <BadgeCheck className="h-3.5 w-3.5 text-blue-500 fill-blue-500/20" />
        )}
      </Link>
    );
  }

  return (
    <Link
      to={`/magaza/${seller.slug || sellerId}`}
      className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border hover:border-primary/30 transition-colors"
    >
      <div className="p-2 bg-primary/10 rounded-full">
        <Store className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground truncate">{seller.company_name}</span>
          {isVerified && (
            <BadgeCheck className="h-4 w-4 text-blue-500 fill-blue-500/20 flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {seller.total_orders} sipariş • {seller.reputation_points} puan
        </p>
      </div>
    </Link>
  );
};

export default VerifiedSellerBadge;
