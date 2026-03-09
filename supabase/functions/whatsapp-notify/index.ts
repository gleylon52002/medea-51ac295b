import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppPayload {
  type: "order_confirmation" | "shipping_update" | "delivery_complete";
  phone: string;
  data: {
    orderNumber?: string;
    customerName?: string;
    total?: string;
    trackingNumber?: string;
    shippingCompany?: string;
  };
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

    // Get WhatsApp settings
    const { data: waSettings } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "whatsapp_settings")
      .maybeSingle();

    const settings = waSettings?.value as {
      enabled?: boolean;
      phone_number_id?: string;
      access_token?: string;
    } | null;

    if (!settings?.enabled || !settings?.phone_number_id || !settings?.access_token) {
      return new Response(
        JSON.stringify({ success: false, message: "WhatsApp not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: WhatsAppPayload = await req.json();
    const { type, phone, data } = payload;

    // Format phone number (remove leading 0, add country code if needed)
    let formattedPhone = phone.replace(/\D/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "90" + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith("90")) {
      formattedPhone = "90" + formattedPhone;
    }

    // Build message based on type
    let message = "";
    switch (type) {
      case "order_confirmation":
        message = `🛍️ *Siparişiniz Alındı!*\n\nMerhaba ${data.customerName || ""},\n\nSipariş No: *${data.orderNumber}*\nToplam: *${data.total}*\n\nSiparişiniz en kısa sürede hazırlanacaktır. Teşekkür ederiz!`;
        break;
      case "shipping_update":
        message = `📦 *Kargonuz Yola Çıktı!*\n\nSipariş No: *${data.orderNumber}*\nKargo Firması: *${data.shippingCompany || "-"}*\nTakip No: *${data.trackingNumber || "-"}*\n\nKargonuzu takip edebilirsiniz.`;
        break;
      case "delivery_complete":
        message = `✅ *Teslimat Tamamlandı!*\n\nSipariş No: *${data.orderNumber}*\n\nÜrünlerimizi beğeneceğinizi umuyoruz. Bizi değerlendirmeyi unutmayın! 💚`;
        break;
    }

    // Send via WhatsApp Cloud API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${settings.phone_number_id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${settings.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedPhone,
          type: "text",
          text: { body: message },
        }),
      }
    );

    const result = await response.json();

    // Log the notification
    await supabase.from("notification_logs").insert({
      channel: "whatsapp",
      recipient: formattedPhone,
      message_type: type,
      status: response.ok ? "sent" : "failed",
      metadata: { result, data },
    } as any);

    return new Response(
      JSON.stringify({ success: response.ok, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
