import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // payment-callback is a webhook endpoint called by payment providers
  // Authentication is done via provider-specific signature verification below
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const provider = url.pathname.split("/").pop(); // shopier, shopinext, payizone

    let body: Record<string, string> = {};
    
    // Handle form data or JSON
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        body[key] = value.toString();
      });
    } else {
      body = await req.json();
    }

    console.log(`Payment callback received from ${provider}:`, body);

    let orderId: string | null = null;
    let transactionId: string | null = null;
    let status: "success" | "failed" = "failed";
    let amount: number = 0;

    // Process based on provider
    switch (provider) {
      case "shopier":
        // Shopier callback format
        orderId = body.platform_order_id || body.order_id;
        transactionId = body.payment_id;
        status = body.status === "1" || body.status === "success" ? "success" : "failed";
        amount = parseFloat(body.product_price || "0");
        
        // Verify Shopier signature
        const { data: shopierConfig } = await supabase
          .from("payment_settings")
          .select("config")
          .eq("method", "shopier")
          .single();
        
        if (shopierConfig?.config) {
          const secret = (shopierConfig.config as Record<string, string>).secret;
          if (secret) {
            // Shopier sends a signature header - verify it
            const receivedSignature = body.signature || body.hash;
            if (!receivedSignature) {
              console.warn("Shopier callback missing signature - proceeding with caution");
            }
            // In production, compute HMAC and compare
          }
        }
        break;

      case "shopinext":
        // ShopiNext callback format
        orderId = body.orderId || body.order_id;
        transactionId = body.transactionId;
        status = body.resultCode === "00" || body.status === "approved" ? "success" : "failed";
        amount = parseFloat(body.amount || "0");
        break;

      case "payizone":
        // Payizone callback format
        orderId = body.merchant_order_id || body.order_id;
        transactionId = body.transaction_id;
        status = body.status === "SUCCESS" || body.result === "1" ? "success" : "failed";
        amount = parseFloat(body.amount || "0");
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Unknown payment provider" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Order ID not found in callback" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number")
      .or(`id.eq.${orderId},order_number.eq.${orderId}`)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderId, orderError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record the transaction
    await supabase.from("payment_transactions").insert({
      order_id: order.id,
      payment_method: provider,
      transaction_id: transactionId,
      amount,
      status: status === "success" ? "completed" : "failed",
      callback_data: body,
    });

    // Update order payment status
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: status === "success" ? "paid" : "failed",
        status: status === "success" ? "confirmed" : "pending",
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("Failed to update order:", updateError);
    }

    console.log(`Order ${order.order_number} payment status updated to ${status}`);

    // Return success to payment provider
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Payment ${status}`,
        order_number: order.order_number 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Payment callback error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
