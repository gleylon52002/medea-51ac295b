import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CargoRequest {
  action: "create_shipment" | "track" | "get_label";
  provider: "yurtici" | "aras" | "mng" | "ptt" | "surat";
  orderId?: string;
  trackingNumber?: string;
  shipmentData?: {
    senderName: string;
    senderAddress: string;
    senderPhone: string;
    receiverName: string;
    receiverAddress: string;
    receiverPhone: string;
    receiverCity: string;
    receiverDistrict: string;
    weight?: number;
    description?: string;
  };
}

const CARGO_TRACKING_URLS: Record<string, string> = {
  yurtici: "https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=",
  aras: "https://www.araskargo.com.tr/trmKargoTakip.aspx?q=",
  mng: "https://www.mngkargo.com.tr/wps/portal/kargotakip?code=",
  ptt: "https://gonderitakip.ptt.gov.tr/Track/Result?q=",
  surat: "https://suratkargo.com.tr/kargo-takip?q=",
  hepsijet: "https://www.hepsijet.com/gonderi-takip?q=",
  trendyol: "https://www.trendyolexpress.com/shipment/",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload: CargoRequest = await req.json();
    const { action, provider, orderId, trackingNumber, shipmentData } = payload;

    // Get cargo API credentials
    const { data: cargoSettings } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "cargo_api_settings")
      .maybeSingle();

    const settings = (cargoSettings?.value || {}) as Record<string, any>;
    const providerConfig = settings[provider] || {};

    switch (action) {
      case "track": {
        // Return tracking URL for the provider
        const baseUrl = CARGO_TRACKING_URLS[provider] || "";
        return new Response(
          JSON.stringify({
            success: true,
            trackingUrl: baseUrl + (trackingNumber || ""),
            provider,
            trackingNumber,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create_shipment": {
        if (!shipmentData || !orderId) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing shipment data" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Simulated shipment creation - in production, integrate with actual APIs
        // Each provider has different API endpoints and authentication
        const mockTrackingNumber = `${provider.toUpperCase()}-${Date.now()}`;

        // Update order with tracking info
        await supabase
          .from("orders")
          .update({
            tracking_number: mockTrackingNumber,
            shipping_company: provider,
            status: "shipped",
          })
          .eq("id", orderId);

        // Log the shipment creation
        await supabase.from("cargo_shipments" as any).insert({
          order_id: orderId,
          provider,
          tracking_number: mockTrackingNumber,
          status: "created",
          shipment_data: shipmentData,
        });

        return new Response(
          JSON.stringify({
            success: true,
            trackingNumber: mockTrackingNumber,
            trackingUrl: CARGO_TRACKING_URLS[provider] + mockTrackingNumber,
            message: "Kargo kaydı oluşturuldu",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_label": {
        // Return label generation endpoint - mock for now
        return new Response(
          JSON.stringify({
            success: true,
            labelUrl: null,
            message: "Etiket oluşturma için kargo firması API entegrasyonu gereklidir",
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
