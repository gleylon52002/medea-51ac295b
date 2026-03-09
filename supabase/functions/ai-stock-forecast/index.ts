import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StockForecastRequest {
  productId?: string;
  sellerId?: string;
  daysAhead?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload: StockForecastRequest = await req.json();
    const { productId, sellerId, daysAhead = 30 } = payload;

    // Get products to analyze
    let productQuery = supabase.from("products").select("id, name, stock, price, sale_price, seller_id, created_at").eq("is_active", true);
    
    if (productId) {
      productQuery = productQuery.eq("id", productId);
    }
    if (sellerId) {
      productQuery = productQuery.eq("seller_id", sellerId);
    }

    const { data: products } = await productQuery.limit(100);

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No products found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get sales history (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id, quantity, created_at, order:orders!inner(status, created_at)")
      .in("product_id", products.map((p) => p.id))
      .gte("created_at", ninetyDaysAgo.toISOString());

    // Calculate forecasts
    const forecasts = products.map((product) => {
      const productSales = orderItems?.filter(
        (oi) =>
          oi.product_id === product.id &&
          ["confirmed", "preparing", "shipped", "delivered"].includes((oi.order as any)?.status)
      ) || [];

      const totalSold = productSales.reduce((sum, oi) => sum + oi.quantity, 0);
      const productAge = Math.max(1, Math.floor((Date.now() - new Date(product.created_at).getTime()) / (1000 * 60 * 60 * 24)));
      const effectiveDays = Math.min(productAge, 90);
      const dailySalesRate = totalSold / effectiveDays;

      // Calculate trend (compare last 30 days vs previous 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const recentSales = productSales.filter((oi) => new Date(oi.created_at) >= thirtyDaysAgo).reduce((s, oi) => s + oi.quantity, 0);
      const previousSales = productSales.filter((oi) => new Date(oi.created_at) >= sixtyDaysAgo && new Date(oi.created_at) < thirtyDaysAgo).reduce((s, oi) => s + oi.quantity, 0);

      const trend = previousSales > 0 ? ((recentSales - previousSales) / previousSales) * 100 : 0;

      // Adjust rate based on trend
      const adjustedRate = dailySalesRate * (1 + trend / 200);
      const forecastedSales = Math.round(adjustedRate * daysAhead);
      const daysUntilStockout = adjustedRate > 0 ? Math.round(product.stock / adjustedRate) : Infinity;

      // Calculate urgency
      let urgency: "critical" | "warning" | "low" | "ok" = "ok";
      if (daysUntilStockout <= 7) urgency = "critical";
      else if (daysUntilStockout <= 14) urgency = "warning";
      else if (daysUntilStockout <= 30) urgency = "low";

      // Reorder recommendation
      const safetyStock = Math.ceil(dailySalesRate * 14); // 2 weeks safety
      const reorderPoint = Math.ceil(dailySalesRate * 7) + safetyStock;
      const recommendedOrder = Math.max(0, reorderPoint + forecastedSales - product.stock);

      return {
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        dailySalesRate: Math.round(dailySalesRate * 100) / 100,
        trend: Math.round(trend),
        forecastedSales,
        daysUntilStockout: daysUntilStockout === Infinity ? null : daysUntilStockout,
        urgency,
        reorderPoint,
        recommendedOrder,
        revenue30d: Math.round(recentSales * (product.sale_price || product.price)),
      };
    });

    // Sort by urgency
    const urgencyOrder = { critical: 0, warning: 1, low: 2, ok: 3 };
    forecasts.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    // Summary
    const criticalCount = forecasts.filter((f) => f.urgency === "critical").length;
    const warningCount = forecasts.filter((f) => f.urgency === "warning").length;
    const totalRecommendedOrder = forecasts.reduce((s, f) => s + f.recommendedOrder, 0);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          totalProducts: forecasts.length,
          criticalCount,
          warningCount,
          totalRecommendedOrder,
        },
        forecasts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
