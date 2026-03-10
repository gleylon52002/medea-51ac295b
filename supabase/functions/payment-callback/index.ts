import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// HMAC-SHA256 signature computation (base64 encoded to match Shopier format)
async function computeHmacSha256Base64(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

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

    console.log(`Payment callback received from ${provider}`);

    let orderId: string | null = null;
    let transactionId: string | null = null;
    let status: "success" | "failed" = "failed";
    let amount: number = 0;

    // Process based on provider
    switch (provider) {
      case "shopier": {
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
            const receivedSignature = body.signature || body.hash;
            if (!receivedSignature) {
              console.error("Shopier callback missing signature");
              return new Response(JSON.stringify({ error: "Missing signature" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
            // Compute HMAC from relevant fields: random_nr + platform_order_id + total_order_value + currency
            const signData = `${body.random_nr || ""}${body.platform_order_id || ""}${body.total_order_value || body.product_price || ""}${body.currency || "TRY"}`;
            const expectedSignature = await computeHmacSha256Base64(signData, secret);
            if (receivedSignature !== expectedSignature) {
              console.error("Shopier signature mismatch");
              return new Response(JSON.stringify({ error: "Invalid signature" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          } else {
            console.error("Shopier secret not configured - rejecting callback");
            return new Response(JSON.stringify({ error: "Provider not configured" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } else {
          console.error("Shopier config not found");
          return new Response(JSON.stringify({ error: "Provider not configured" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        break;
      }

      case "shopinext": {
        orderId = body.orderId || body.order_id;
        transactionId = body.transactionId;
        status = body.resultCode === "00" || body.status === "approved" ? "success" : "failed";
        amount = parseFloat(body.amount || "0");

        // Verify ShopiNext signature
        const { data: shopinextConfig } = await supabase
          .from("payment_settings")
          .select("config")
          .eq("method", "shopinext")
          .single();

        if (shopinextConfig?.config) {
          const token = (shopinextConfig.config as Record<string, string>).token;
          if (token) {
            const receivedSignature = body.signature || body.hash;
            if (!receivedSignature) {
              console.error("ShopiNext callback missing signature");
              return new Response(JSON.stringify({ error: "Missing signature" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
            const signData = `${body.orderId || body.order_id || ""}${body.amount || ""}${body.resultCode || body.status || ""}`;
            const expectedSignature = await computeHmacSha256(signData, token);
            if (receivedSignature !== expectedSignature) {
              console.error("ShopiNext signature mismatch");
              return new Response(JSON.stringify({ error: "Invalid signature" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          } else {
            return new Response(JSON.stringify({ error: "Provider not configured" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
        break;
      }

      case "payizone": {
        orderId = body.merchant_order_id || body.order_id;
        transactionId = body.transaction_id;
        status = body.status === "SUCCESS" || body.result === "1" ? "success" : "failed";
        amount = parseFloat(body.amount || "0");

        // Verify Payizone signature
        const { data: payizoneConfig } = await supabase
          .from("payment_settings")
          .select("config")
          .eq("method", "payizone")
          .single();

        if (payizoneConfig?.config) {
          const secretKey = (payizoneConfig.config as Record<string, string>).secret_key;
          if (secretKey) {
            const receivedSignature = body.signature || body.hash;
            if (!receivedSignature) {
              console.error("Payizone callback missing signature");
              return new Response(JSON.stringify({ error: "Missing signature" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
            const signData = `${body.merchant_order_id || body.order_id || ""}${body.amount || ""}${body.status || body.result || ""}`;
            const expectedSignature = await computeHmacSha256(signData, secretKey);
            if (receivedSignature !== expectedSignature) {
              console.error("Payizone signature mismatch");
              return new Response(JSON.stringify({ error: "Invalid signature" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          } else {
            return new Response(JSON.stringify({ error: "Provider not configured" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
        break;
      }

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
