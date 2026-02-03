import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  orderId: string;
  orderNumber: string;
  amount: number;
  provider: "shopier" | "shopinext" | "payizone";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: PaymentRequest = await req.json();
    const { orderId, orderNumber, amount, provider, customerName, customerEmail, customerPhone, returnUrl } = body;

    // Get payment provider config
    const { data: config } = await supabase
      .from("payment_settings")
      .select("config, is_active")
      .eq("method", provider)
      .single();

    if (!config?.is_active) {
      return new Response(
        JSON.stringify({ error: "Payment provider is not active" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const providerConfig = config.config as Record<string, string>;
    let paymentUrl = "";
    let paymentData: Record<string, string | number> = {};

    const callbackUrl = `${supabaseUrl}/functions/v1/payment-callback/${provider}`;

    switch (provider) {
      case "shopier":
        // Shopier payment creation
        const shopierApiUser = providerConfig.api_user;
        const shopierApiKey = providerConfig.api_key;
        const shopierSecret = providerConfig.secret;

        if (!shopierApiUser || !shopierApiKey) {
          return new Response(
            JSON.stringify({ error: "Shopier API credentials not configured" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generate Shopier payment form data
        const shopierData = {
          API_key: shopierApiKey,
          API_secret: shopierSecret,
          platform_order_id: orderNumber,
          product_name: `Sipariş #${orderNumber}`,
          product_price: amount.toFixed(2),
          product_type: "1",
          buyer_name: customerName.split(" ")[0] || customerName,
          buyer_surname: customerName.split(" ").slice(1).join(" ") || customerName,
          buyer_email: customerEmail,
          buyer_phone: customerPhone.replace(/\s/g, ""),
          buyer_id_nr: "",
          buyer_ip: "",
          module_version: "1.0",
          website_index: "https://medea.lovable.app",
          random_nr: Math.random().toString(36).substring(2, 15),
          callback: callbackUrl,
          success_url: `${returnUrl}?status=success`,
          fail_url: `${returnUrl}?status=failed`,
        };

        // For Shopier, we need to redirect to their payment page
        // The actual implementation would generate a form and redirect
        paymentUrl = "https://www.shopier.com/ShowProduct/api_pay3.php";
        paymentData = shopierData;
        break;

      case "shopinext":
        // ShopiNext token-based API
        const shopinextToken = providerConfig.token;
        const shopinextMerchantId = providerConfig.merchant_id;

        if (!shopinextToken || !shopinextMerchantId) {
          return new Response(
            JSON.stringify({ error: "ShopiNext credentials not configured" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        paymentData = {
          merchantId: shopinextMerchantId,
          token: shopinextToken,
          orderId: orderNumber,
          amount: amount,
          currency: "TRY",
          customerName,
          customerEmail,
          customerPhone,
          callbackUrl,
          returnUrl: `${returnUrl}?status=success`,
          failUrl: `${returnUrl}?status=failed`,
        };

        // ShopiNext API endpoint (placeholder - actual endpoint from their docs)
        paymentUrl = "https://api.shopinext.com/payment/create";
        break;

      case "payizone":
        // Payizone API
        const payizoneApiKey = providerConfig.api_key;
        const payizoneSecretKey = providerConfig.secret_key;

        if (!payizoneApiKey || !payizoneSecretKey) {
          return new Response(
            JSON.stringify({ error: "Payizone credentials not configured" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        paymentData = {
          api_key: payizoneApiKey,
          merchant_order_id: orderNumber,
          amount: amount,
          currency: "TRY",
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          callback_url: callbackUrl,
          success_url: `${returnUrl}?status=success`,
          fail_url: `${returnUrl}?status=failed`,
        };

        // Payizone API endpoint (placeholder)
        paymentUrl = "https://api.payizone.com/v1/payment/init";
        break;
    }

    // Record initial transaction
    await supabase.from("payment_transactions").insert({
      order_id: orderId,
      payment_method: provider,
      amount,
      status: "pending",
    });

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl,
        paymentData,
        provider,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Create payment error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});