import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EInvoiceRequest {
  action: "create" | "send" | "list" | "download";
  orderId?: string;
  invoiceId?: string;
  provider?: "parasut" | "logo" | "efatura";
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

    const payload: EInvoiceRequest = await req.json();
    const { action, orderId, invoiceId, provider = "efatura" } = payload;

    // Get e-invoice settings
    const { data: eInvoiceSettings } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "einvoice_settings")
      .maybeSingle();

    const settings = (eInvoiceSettings?.value || {}) as {
      enabled?: boolean;
      provider?: string;
      api_key?: string;
      api_secret?: string;
      company_info?: {
        name: string;
        taxNumber: string;
        taxOffice: string;
        address: string;
      };
    };

    switch (action) {
      case "create": {
        if (!orderId) {
          return new Response(
            JSON.stringify({ success: false, error: "orderId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get order details
        const { data: order } = await supabase
          .from("orders")
          .select(`
            *,
            order_items(*)
          `)
          .eq("id", orderId)
          .single();

        if (!order) {
          return new Response(
            JSON.stringify({ success: false, error: "Order not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if invoice already exists
        const { data: existingInvoice } = await supabase
          .from("invoices")
          .select("id, invoice_number")
          .eq("order_id", orderId)
          .maybeSingle();

        if (existingInvoice) {
          return new Response(
            JSON.stringify({
              success: true,
              message: "Invoice already exists",
              invoiceId: existingInvoice.id,
              invoiceNumber: existingInvoice.invoice_number,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generate invoice number
        const year = new Date().getFullYear();
        const { count } = await supabase.from("invoices").select("*", { count: "exact", head: true });
        const invoiceNumber = `MDA${year}${String((count || 0) + 1).padStart(6, "0")}`;

        // Create invoice record
        const shippingAddress = order.shipping_address as any;
        const { data: newInvoice, error: insertError } = await supabase
          .from("invoices")
          .insert({
            order_id: orderId,
            invoice_number: invoiceNumber,
            billing_info: {
              name: shippingAddress?.full_name || "",
              address: shippingAddress?.address || "",
              city: shippingAddress?.city || "",
              district: shippingAddress?.district || "",
              phone: shippingAddress?.phone || "",
            },
            items: order.order_items,
            subtotal: order.subtotal,
            tax_amount: Math.round(order.subtotal * 0.2), // 20% KDV
            shipping_cost: order.shipping_cost,
            discount_amount: order.discount_amount || 0,
            total: order.total,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // If provider is configured, send to e-invoice system
        if (settings.enabled && settings.api_key) {
          // Mock e-invoice submission - in production, integrate with actual API
          await supabase.from("einvoice_logs" as any).insert({
            invoice_id: newInvoice.id,
            provider: settings.provider || provider,
            status: "queued",
            request_data: { invoiceNumber, orderId },
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            invoiceId: newInvoice.id,
            invoiceNumber,
            message: "Fatura oluşturuldu",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "send": {
        if (!invoiceId) {
          return new Response(
            JSON.stringify({ success: false, error: "invoiceId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Mock send to GİB/e-fatura system
        // In production, implement actual API calls to Paraşüt, Logo, etc.
        return new Response(
          JSON.stringify({
            success: true,
            message: "e-Fatura sistemi entegrasyonu için API anahtarı yapılandırması gereklidir",
            requiresConfig: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "list": {
        const { data: invoices } = await supabase
          .from("invoices")
          .select("id, invoice_number, total, invoice_date, order_id")
          .order("invoice_date", { ascending: false })
          .limit(100);

        return new Response(
          JSON.stringify({ success: true, invoices }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "download": {
        if (!invoiceId) {
          return new Response(
            JSON.stringify({ success: false, error: "invoiceId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: invoice } = await supabase
          .from("invoices")
          .select("pdf_url")
          .eq("id", invoiceId)
          .single();

        return new Response(
          JSON.stringify({
            success: true,
            pdfUrl: invoice?.pdf_url || null,
            message: invoice?.pdf_url ? undefined : "PDF henüz oluşturulmamış",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
