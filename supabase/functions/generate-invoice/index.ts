import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InvoiceRequest {
  orderId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // --- Authentication ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Service client for privileged operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId }: InvoiceRequest = await req.json();

    // Verify order ownership (or admin)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`*, order_items(*)`)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check ownership - allow order owner or admin
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (order.user_id !== userId && !isAdmin) {
      return new Response(JSON.stringify({ error: "Unauthorized: not your order" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if invoice already exists
    const { data: existingInvoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();

    if (existingInvoice) {
      return new Response(
        JSON.stringify({ success: true, invoice: existingInvoice }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create invoice record
    const invoiceData = {
      order_id: orderId,
      invoice_number: invoiceNumber,
      invoice_date: new Date().toISOString(),
      billing_info: order.billing_address || order.shipping_address,
      items: order.order_items.map((item: any) => ({
        product_name: item.product_name, quantity: item.quantity,
        unit_price: item.unit_price, total_price: item.total_price,
      })),
      subtotal: order.subtotal,
      tax_amount: 0,
      shipping_cost: order.shipping_cost,
      discount_amount: order.discount_amount || 0,
      total: order.total,
    };

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices").insert(invoiceData).select().single();

    if (invoiceError) throw invoiceError;

    const shippingAddress = order.shipping_address as {
      full_name: string; address: string; city: string; district: string; phone: string;
    };

    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Fatura - ${invoiceNumber}</title>
  <style>
    body { font-family: 'Helvetica', Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; }
    .logo { font-size: 28px; font-weight: bold; color: #8b5e3c; }
    .invoice-info { text-align: right; }
    .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .addresses { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .address-block { width: 45%; }
    .address-title { font-weight: bold; margin-bottom: 10px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f5f5f5; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals { width: 300px; margin-left: auto; }
    .totals tr td { padding: 8px 12px; }
    .totals .total { font-size: 18px; font-weight: bold; background: #f5f5f5; }
    .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">MEDEA</div>
    <div class="invoice-info">
      <div class="invoice-title">FATURA</div>
      <p><strong>Fatura No:</strong> ${invoiceNumber}</p>
      <p><strong>Tarih:</strong> ${new Date().toLocaleDateString("tr-TR")}</p>
      <p><strong>Sipariş No:</strong> ${order.order_number}</p>
    </div>
  </div>
  <div class="addresses">
    <div class="address-block">
      <div class="address-title">Fatura Adresi</div>
      <p>${shippingAddress.full_name}</p>
      <p>${shippingAddress.address}</p>
      <p>${shippingAddress.district}, ${shippingAddress.city}</p>
      <p>Tel: ${shippingAddress.phone}</p>
    </div>
    <div class="address-block">
      <div class="address-title">Teslimat Adresi</div>
      <p>${shippingAddress.full_name}</p>
      <p>${shippingAddress.address}</p>
      <p>${shippingAddress.district}, ${shippingAddress.city}</p>
    </div>
  </div>
  <table>
    <thead><tr><th>Ürün</th><th class="text-center">Adet</th><th class="text-right">Birim Fiyat</th><th class="text-right">Toplam</th></tr></thead>
    <tbody>
      ${order.order_items.map((item: any) => `
        <tr><td>${item.product_name}</td><td class="text-center">${item.quantity}</td><td class="text-right">${item.unit_price.toFixed(2)}₺</td><td class="text-right">${item.total_price.toFixed(2)}₺</td></tr>
      `).join("")}
    </tbody>
  </table>
  <table class="totals">
    <tr><td>Ara Toplam</td><td class="text-right">${order.subtotal.toFixed(2)}₺</td></tr>
    ${order.discount_amount > 0 ? `<tr><td>İndirim</td><td class="text-right">-${order.discount_amount.toFixed(2)}₺</td></tr>` : ""}
    <tr><td>Kargo</td><td class="text-right">${order.shipping_cost.toFixed(2)}₺</td></tr>
    <tr class="total"><td>Genel Toplam</td><td class="text-right">${order.total.toFixed(2)}₺</td></tr>
  </table>
  <div class="footer">
    <p>Bu fatura elektronik olarak oluşturulmuştur.</p>
    <p>Medea - Doğal Kozmetik Ürünleri</p>
  </div>
</body>
</html>`;

    return new Response(
      JSON.stringify({ success: true, invoice, html: invoiceHtml }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in generate-invoice function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
