import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PaymentRequest {
  orderId: string;
  orderNumber: string;
  amount: number;
  provider: "credit_card" | "shopier" | "shopinext" | "payizone";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // --- Authentication: verify the caller ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Service client for privileged operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: PaymentRequest = await req.json();
    const { orderId, orderNumber, amount, provider, customerName, customerEmail, customerPhone, returnUrl } = body;

    // Verify order ownership
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, user_id")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Unauthorized: not your order" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For credit_card, determine which provider to use
    let effectiveProvider = provider;
    if (provider === "credit_card") {
      // Check which online payment provider is active (prefer payizone > shopinext > shopier)
      const { data: allConfigs } = await supabase
        .from("payment_settings")
        .select("method, config, is_active")
        .in("method", ["payizone", "shopinext", "shopier"])
        .eq("is_active", true);

      if (allConfigs && allConfigs.length > 0) {
        const preferred = allConfigs.find(c => c.method === "payizone") 
          || allConfigs.find(c => c.method === "shopinext")
          || allConfigs.find(c => c.method === "shopier");
        if (preferred) {
          effectiveProvider = preferred.method as "shopier" | "shopinext" | "payizone";
        } else {
          return new Response(
            JSON.stringify({ error: "No online payment provider configured" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: "No online payment provider configured" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get payment provider config
    const { data: config } = await supabase
      .from("payment_settings")
      .select("config, is_active")
      .eq("method", effectiveProvider)
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
    const callbackUrl = `${supabaseUrl}/functions/v1/payment-callback/${effectiveProvider}`;

    switch (effectiveProvider) {
      case "shopier": {
        // Use environment variables for Shopier credentials
        const shopierApiKey = Deno.env.get("SHOPIER_API_KEY") || providerConfig.api_key;
        const shopierSecret = Deno.env.get("SHOPIER_API_SECRET") || providerConfig.secret;
        const shopierWebsiteIndex = providerConfig.website_index || "0";
        if (!shopierApiKey || !shopierSecret) {
          return new Response(JSON.stringify({ error: "Shopier API credentials not configured" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        
        // Build Shopier payment form data
        const randomNr = Math.random().toString(36).substring(2, 15);
        const currency = "TRY";
        const totalOrderValue = amount.toFixed(2);
        
        // Signature: hash_hmac('SHA256', random_nr + platform_order_id + total_order_value + currency, secret)
        const signData = `${randomNr}${orderNumber}${totalOrderValue}${currency}`;
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw", encoder.encode(shopierSecret),
          { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
        );
        const sigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(signData));
        const signature = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
        
        const buyerName = customerName.split(" ")[0] || customerName;
        const buyerSurname = customerName.split(" ").slice(1).join(" ") || customerName;
        
        paymentData = {
          API_key: shopierApiKey,
          website_index: shopierWebsiteIndex,
          platform_order_id: orderNumber,
          product_name: `Sipariş #${orderNumber}`,
          product_type: 1,
          total_order_value: totalOrderValue,
          currency: currency,
          buyer_name: buyerName,
          buyer_surname: buyerSurname,
          buyer_email: customerEmail,
          buyer_phone: customerPhone.replace(/\D/g, ""),
          buyer_account_age: 1,
          buyer_id_nr: "",
          buyer_ip: "",
          module_version: "1.0",
          random_nr: randomNr,
          signature: signature,
          callback: callbackUrl,
          platform: "0",
          is_in_frame: "0",
          language: "tr",
          success_url: `${returnUrl}?status=success&order=${orderNumber}`,
          fail_url: `${returnUrl}?status=failed&order=${orderNumber}`,
        };
        paymentUrl = "https://www.shopier.com/ShowProduct/api_pay4.php";
        break;
      }
      case "shopinext": {
        const shopinextToken = providerConfig.token;
        const shopinextMerchantId = providerConfig.merchant_id;
        if (!shopinextToken || !shopinextMerchantId) {
          return new Response(JSON.stringify({ error: "ShopiNext credentials not configured" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        paymentData = {
          merchantId: shopinextMerchantId,
          token: shopinextToken,
          orderId: orderNumber,
          amount,
          currency: "TRY",
          customerName,
          customerEmail,
          customerPhone,
          callbackUrl,
          returnUrl: `${returnUrl}?status=success&order=${orderNumber}`,
          failUrl: `${returnUrl}?status=failed&order=${orderNumber}`,
        };
        paymentUrl = "https://api.shopinext.com/payment/create";
        break;
      }
      case "payizone": {
        const payizoneApiKey = providerConfig.api_key;
        const payizoneSecretKey = providerConfig.secret_key;
        if (!payizoneApiKey || !payizoneSecretKey) {
          return new Response(JSON.stringify({ error: "Payizone credentials not configured" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        paymentData = {
          api_key: payizoneApiKey,
          merchant_order_id: orderNumber,
          amount,
          currency: "TRY",
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          callback_url: callbackUrl,
          success_url: `${returnUrl}?status=success&order=${orderNumber}`,
          fail_url: `${returnUrl}?status=failed&order=${orderNumber}`,
        };
        paymentUrl = "https://api.payizone.com/v1/payment/init";
        break;
      }
    }

    // Record initial transaction
    await supabase.from("payment_transactions").insert({
      order_id: orderId,
      payment_method: effectiveProvider,
      amount,
      status: "pending",
    });

    // For providers that have a direct API, try to call it and get a redirect URL
    if (effectiveProvider === "payizone" || effectiveProvider === "shopinext") {
      try {
        const apiResponse = await fetch(paymentUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentData),
        });
        
        if (apiResponse.ok) {
          const apiResult = await apiResponse.json();
          const redirectUrl = apiResult.payment_url || apiResult.redirect_url || apiResult.url || apiResult.paymentUrl;
          if (redirectUrl) {
            return new Response(
              JSON.stringify({ success: true, paymentUrl: redirectUrl, provider: effectiveProvider, redirect: true }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
        
        console.log(`${effectiveProvider} API response status: ${apiResponse.status}`);
      } catch (apiErr) {
        console.error(`${effectiveProvider} API call failed:`, apiErr);
      }
    }

    // Return payment URL and data for form-based submission (Shopier) or fallback
    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentUrl, 
        paymentData, 
        provider: effectiveProvider,
        redirect: effectiveProvider !== "shopier",
        formPost: effectiveProvider === "shopier",
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
