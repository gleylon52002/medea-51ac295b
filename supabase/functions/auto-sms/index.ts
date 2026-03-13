import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

function formatTrPhone(phone: string): string {
  let cleaned = String(phone || "").replace(/\D/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("90") && cleaned.length >= 12) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+90${cleaned.slice(1)}`;
  if (cleaned.startsWith("5")) return `+90${cleaned}`;
  return `+${cleaned}`;
}

// SMS message templates
const templates: Record<string, (vars: Record<string, string>) => string> = {
  welcome: (v) =>
    `Merhaba ${v.name || ""}! 🎉 Medea'ya hoş geldiniz. İlk siparişinizde %10 indirim için HOSGELDIN kodunu kullanabilirsiniz. medea.tr`,

  order_confirmed: (v) =>
    `Siparişiniz alındı! 🛒 Sipariş No: ${v.order_number || ""}. Toplam: ₺${v.total || "0"}. Siparişinizi hesabınızdan takip edebilirsiniz. medea.tr`,

  order_shipped: (v) =>
    `Siparişiniz kargoya verildi! 🚚 Sipariş No: ${v.order_number || ""}. Kargo Takip: ${v.tracking_number || "-"}. medea.tr`,

  order_delivered: (v) =>
    `Siparişiniz teslim edildi! ✅ Deneyiminizi paylaşır mısınız? Ürünlerimizi değerlendirerek diğer müşterilere yardımcı olun: medea.tr/hesabim/siparisler`,

  review_request: (v) =>
    `Merhaba ${v.name || ""}! Aldığınız "${v.product_name || "ürün"}" hakkında ne düşünüyorsunuz? 🌟 Yorumunuz bizim için çok değerli: medea.tr/hesabim/siparisler`,

  promotion: (v) =>
    `🎁 ${v.title || "Özel Kampanya"}! ${v.message || "Kaçırmayın!"} medea.tr`,

  abandoned_cart: (v) =>
    `Sepetinizde ürünler sizi bekliyor! 🛍️ Siparişinizi tamamlamayı unutmayın. medea.tr/odeme`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!LOVABLE_API_KEY || !TWILIO_API_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: "SMS API anahtarları yapılandırılmamış" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json();
    const { type, phone, variables = {}, from } = body;

    if (!type || !phone) {
      return new Response(
        JSON.stringify({ success: false, error: "type ve phone parametreleri gerekli" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get SMS settings for 'from' number
    let fromNumber = from;
    if (!fromNumber) {
      const { data: settings } = await supabase
        .from("sms_settings")
        .select("config")
        .eq("provider", "twilio")
        .eq("is_active", true)
        .single();
      fromNumber = settings?.config?.fromNumber || settings?.config?.from_number;
    }

    if (!fromNumber) {
      return new Response(
        JSON.stringify({ success: false, error: "Gönderici numarası bulunamadı. SMS ayarlarını kontrol edin." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate message from template
    const templateFn = templates[type];
    if (!templateFn) {
      return new Response(
        JSON.stringify({ success: false, error: `Bilinmeyen şablon tipi: ${type}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const message = templateFn(variables);
    const formattedPhone = formatTrPhone(phone);

    if (!formattedPhone) {
      return new Response(
        JSON.stringify({ success: false, error: "Geçersiz telefon numarası" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send via Twilio gateway
    const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: formattedPhone,
        From: fromNumber,
        Body: message,
      }),
    });

    const data = await response.json();

    // Log the SMS
    try {
      await supabase.from("sms_logs").insert({
        phone: formattedPhone,
        content: message,
        provider: "twilio",
        status: response.ok ? "sent" : "failed",
        error_message: response.ok ? null : (data?.message || "Gönderim hatası"),
        metadata: { type, variables, sid: data?.sid },
        sent_at: response.ok ? new Date().toISOString() : null,
      });
    } catch (logErr) {
      console.error("SMS log error:", logErr);
    }

    if (!response.ok) {
      console.error(`Auto SMS error for ${formattedPhone}:`, JSON.stringify(data));
      return new Response(
        JSON.stringify({ success: false, error: data?.message || "SMS gönderilemedi" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, sid: data.sid, message: "SMS gönderildi" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Auto SMS error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Beklenmeyen hata" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});