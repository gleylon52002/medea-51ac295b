import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hmacSha256Base64(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const MERCHANT_ID = Deno.env.get("PAYTR_MERCHANT_ID");
  const MERCHANT_KEY = Deno.env.get("PAYTR_MERCHANT_KEY");
  const MERCHANT_SALT = Deno.env.get("PAYTR_MERCHANT_SALT");

  if (!MERCHANT_ID || !MERCHANT_KEY || !MERCHANT_SALT) {
    return new Response(
      JSON.stringify({ success: false, error: "PayTR API bilgileri yapılandırılmamış" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const {
      merchant_oid,
      email,
      payment_amount, // already multiplied by 100
      user_basket,    // base64 encoded JSON array
      user_name,
      user_address,
      user_phone,
      user_ip,
      merchant_ok_url,
      merchant_fail_url,
      no_installment = "0",
      max_installment = "0",
      currency = "TL",
      test_mode = "0",
      lang = "tr",
      timeout_limit = "30",
    } = body;

    if (!merchant_oid || !email || !payment_amount || !user_basket) {
      return new Response(
        JSON.stringify({ success: false, error: "Eksik parametreler" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build hash string: merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode
    const hashStr = `${MERCHANT_ID}${user_ip}${merchant_oid}${email}${payment_amount}${user_basket}${no_installment}${max_installment}${currency}${test_mode}`;
    const paytrToken = await hmacSha256Base64(hashStr + MERCHANT_SALT, MERCHANT_KEY);

    const postData = new URLSearchParams({
      merchant_id: MERCHANT_ID,
      user_ip: user_ip || "",
      merchant_oid,
      email,
      payment_amount: String(payment_amount),
      paytr_token: paytrToken,
      user_basket,
      debug_on: "1",
      no_installment: String(no_installment),
      max_installment: String(max_installment),
      user_name: user_name || "",
      user_address: user_address || "",
      user_phone: user_phone || "",
      merchant_ok_url: merchant_ok_url || "",
      merchant_fail_url: merchant_fail_url || "",
      timeout_limit: String(timeout_limit),
      currency,
      test_mode: String(test_mode),
      lang,
    });

    console.log("PayTR token request for order:", merchant_oid);

    const response = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: postData.toString(),
    });

    const result = await response.json();
    console.log("PayTR token response:", JSON.stringify(result));

    if (result.status === "success") {
      return new Response(
        JSON.stringify({ success: true, token: result.token }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: result.reason || "Token alınamadı" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("PayTR get-token error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Beklenmeyen hata" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
