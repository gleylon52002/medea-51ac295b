import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
  // PayTR callback is always POST, no CORS needed (server-to-server)
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const MERCHANT_KEY = Deno.env.get("PAYTR_MERCHANT_KEY");
  const MERCHANT_SALT = Deno.env.get("PAYTR_MERCHANT_SALT");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!MERCHANT_KEY || !MERCHANT_SALT || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("PayTR callback: Missing environment variables");
    return new Response("OK", { status: 200 });
  }

  try {
    const formData = await req.formData();
    const merchant_oid = formData.get("merchant_oid") as string;
    const status = formData.get("status") as string;
    const total_amount = formData.get("total_amount") as string;
    const hash = formData.get("hash") as string;
    const failed_reason_code = formData.get("failed_reason_code") as string;
    const failed_reason_msg = formData.get("failed_reason_msg") as string;
    const test_mode = formData.get("test_mode") as string;

    console.log(`PayTR callback: order=${merchant_oid}, status=${status}, amount=${total_amount}`);

    // Verify hash: hash = base64(hmac_sha256(merchant_oid + merchant_salt + status + total_amount, merchant_key))
    const hashStr = `${merchant_oid}${MERCHANT_SALT}${status}${total_amount}`;
    const expectedHash = await hmacSha256Base64(hashStr, MERCHANT_KEY);

    if (hash !== expectedHash) {
      console.error("PayTR callback: Hash mismatch!", { received: hash, expected: expectedHash });
      return new Response("OK", { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find order by order_number - merchant_oid has special chars stripped, so we need to search
    // Try exact match first, then try matching stripped version
    let order: any = null;
    let findError: any = null;
    
    const { data: exactMatch, error: exactErr } = await supabase
      .from("orders")
      .select("id, payment_status, order_number")
      .eq("order_number", merchant_oid)
      .maybeSingle();
    
    if (exactMatch) {
      order = exactMatch;
    } else {
      // Search recent pending orders and match by stripped order_number
      const { data: pendingOrders, error: searchErr } = await supabase
        .from("orders")
        .select("id, payment_status, order_number")
        .eq("payment_status", "pending")
        .order("created_at", { ascending: false })
        .limit(50);
      
      findError = searchErr;
      if (pendingOrders) {
        order = pendingOrders.find(o => o.order_number.replace(/[^a-zA-Z0-9]/g, '') === merchant_oid);
      }
    }

    if (findError || !order) {
      console.error("PayTR callback: Order not found:", merchant_oid, findError);
      return new Response("OK", { status: 200 });
    }

    // Prevent duplicate processing
    if (order.payment_status === "paid" || order.payment_status === "failed") {
      console.log("PayTR callback: Order already processed:", merchant_oid);
      return new Response("OK", { status: 200 });
    }

    if (status === "success") {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateError) {
        console.error("PayTR callback: Update error:", updateError);
      } else {
        console.log("PayTR callback: Order confirmed:", merchant_oid);
      }
    } else {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "failed",
          status: "cancelled",
          notes: `Ödeme başarısız: ${failed_reason_msg || ""} (Kod: ${failed_reason_code || ""})`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateError) {
        console.error("PayTR callback: Update error:", updateError);
      } else {
        console.log("PayTR callback: Order cancelled:", merchant_oid);
      }
    }

    // Log the transaction
    await supabase.from("payment_transactions").insert({
      order_id: order.id,
      payment_method: "paytr",
      amount: parseInt(total_amount) / 100,
      status: status === "success" ? "completed" : "failed",
      transaction_id: merchant_oid,
      callback_data: {
        merchant_oid,
        status,
        total_amount,
        failed_reason_code,
        failed_reason_msg,
        test_mode,
      },
    });

    return new Response("OK", { status: 200 });
  } catch (error: any) {
    console.error("PayTR callback error:", error);
    return new Response("OK", { status: 200 });
  }
});
