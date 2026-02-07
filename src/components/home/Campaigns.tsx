import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Clock, Tag, TrendingUp } from "lucide-react";

const Campaigns = () => {
    const { data: campaigns, isLoading } = useQuery({
        queryKey: ["active-campaigns"],
        queryFn: async () => {
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from("campaigns")
                .select("*")
                .eq("is_active", true)
                .lte("starts_at", now)
                .or(`ends_at.is.null,ends_at.gte.${now}`)
                .order("created_at", { ascending: false })
                .limit(3);

            if (error) throw error;
            return data;
        },
    });

    if (isLoading || !campaigns || campaigns.length === 0) {
        return null; // Don't show anything if no active campaigns
    }

    return (
        <section className="container-main py-8">
            <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-serif font-bold">Aktif Kampanyalar</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {campaigns.map((campaign) => {
                    const discount = campaign.discount_value;
                    const isPercentage = campaign.discount_type === 'percentage';

                    return (
                        <Link key={campaign.id} to="/products">
                            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge variant="secondary" className="bg-primary text-primary-foreground">
                                            <Tag className="h-3 w-3 mr-1" />
                                            {isPercentage ? `%${discount} İndirim` : `${discount}₺ İndirim`}
                                        </Badge>
                                        {campaign.ends_at && (
                                            <Badge variant="outline" className="text-xs">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {new Date(campaign.ends_at).toLocaleDateString('tr-TR')}
                                            </Badge>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                                        {campaign.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {campaign.description}
                                    </p>
                                    {campaign.min_purchase_amount && (
                                        <p className="text-xs text-muted-foreground mt-3">
                                            Min. {campaign.min_purchase_amount}₺ alışveriş
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
};

export default Campaigns;
