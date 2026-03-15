import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";
const ADMIN_PHONE = "+905350582392";

function formatTrPhone(phone: string): string {
  let cleaned = String(phone || "").replace(/\D/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("90") && cleaned.length >= 12) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+90${cleaned.slice(1)}`;
  if (cleaned.startsWith("5")) return `+90${cleaned}`;
  return `+${cleaned}`;
}

async function sendSms(
  fromNumber: string,
  toPhone: string,
  message: string,
  lovableApiKey: string,
  twilioApiKey: string,
): Promise<{ ok: boolean; data: any }> {
  const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": twilioApiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: toPhone,
      From: fromNumber,
      Body: message,
    }),
  });
  const data = await response.json();
  return { ok: response.ok, data };
}

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

    // Check if this automation type is enabled
    const { data: automationSetting } = await supabase
      .from("sms_automation_settings")
      .select("is_enabled, message_template")
      .eq("trigger_type", type)
      .single();

    if (automationSetting && !automationSetting.is_enabled) {
      console.log(`SMS automation '${type}' is disabled, skipping.`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, message: "Bu otomasyon devre dışı" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Build user message from template or fallback
    let message = "";
    if (automationSetting?.message_template) {
      message = automationSetting.message_template;
      for (const [key, value] of Object.entries(variables)) {
        message = message.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
      }
    } else {
      const templates: Record<string, (vars: Record<string, string>) => string> = {
        welcome: (v) => `Merhaba ${v.name || ""}! Medea'ya hoş geldiniz. İlk siparişinizde %10 indirim için HOSGELDIN kodunu kullanabilirsiniz.`,
        order_confirmed: (v) => `Siparişiniz alındı! Sipariş No: ${v.order_number || ""}. Toplam: ₺${v.total || "0"}.`,
        order_shipped: (v) => `Siparişiniz kargoya verildi! Sipariş No: ${v.order_number || ""}. Kargo Takip: ${v.tracking_number || "-"}.`,
        order_delivered: (v) => `Siparişiniz teslim edildi! Deneyiminizi paylaşır mısınız?`,
        review_request: (v) => `Merhaba ${v.name || ""}! Aldığınız "${v.product_name || "ürün"}" hakkında ne düşünüyorsunuz?`,
        promotion: (v) => `${v.title || "Özel Kampanya"}! ${v.message || "Kaçırmayın!"}`,
        abandoned_cart: () => `Sepetinizde ürünler sizi bekliyor! Siparişinizi tamamlamayı unutmayın.`,
        login_welcome: (v) => `Merhaba ${v.name || ""}! Hesabınıza başarıyla giriş yapıldı.`,
      };
      const templateFn = templates[type];
      if (!templateFn) {
        return new Response(
          JSON.stringify({ success: false, error: `Bilinmeyen şablon tipi: ${type}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      message = templateFn(variables);
    }

    const formattedPhone = formatTrPhone(phone);
    if (!formattedPhone) {
      return new Response(
        JSON.stringify({ success: false, error: "Geçersiz telefon numarası" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- Send SMS to the USER ----
    const userResult = await sendSms(fromNumber, formattedPhone, message, LOVABLE_API_KEY, TWILIO_API_KEY);

    // Log user SMS
    try {
      await supabase.from("sms_logs").insert({
        phone: formattedPhone,
        content: message,
        provider: "twilio",
        status: userResult.ok ? "sent" : "failed",
        error_message: userResult.ok ? null : (userResult.data?.message || "Gönderim hatası"),
        metadata: { type, variables, sid: userResult.data?.sid },
        sent_at: userResult.ok ? new Date().toISOString() : null,
      });
    } catch (logErr) {
      console.error("SMS log error:", logErr);
    }

    // ---- Send notification SMS to ADMIN for key events ----
    const adminNotifyTypes = ["welcome", "order_confirmed", "order_shipped", "order_delivered"];
    if (adminNotifyTypes.includes(type)) {
      try {
        const adminMessages: Record<string, string> = {
          welcome: `🆕 Yeni üye kaydı: ${variables.name || "Bilinmiyor"} (${formattedPhone})`,
          order_confirmed: `🛒 Yeni sipariş! No: ${variables.order_number || "-"}, Tutar: ₺${variables.total || "0"}, Müşteri: ${variables.name || formattedPhone}`,
          order_shipped: `📦 Sipariş kargoya verildi. No: ${variables.order_number || "-"}, Takip: ${variables.tracking_number || "-"}`,
          order_delivered: `✅ Sipariş teslim edildi. Müşteri: ${formattedPhone}`,
        };
        const adminMsg = adminMessages[type] || `Bildirim: ${type}`;
        const adminResult = await sendSms(fromNumber, ADMIN_PHONE, adminMsg, LOVABLE_API_KEY, TWILIO_API_KEY);
        
        // Log admin SMS
        await supabase.from("sms_logs").insert({
          phone: ADMIN_PHONE,
          content: adminMsg,
          provider: "twilio",
          status: adminResult.ok ? "sent" : "failed",
          error_message: adminResult.ok ? null : (adminResult.data?.message || "Admin SMS hatası"),
          metadata: { type: `admin_${type}`, sid: adminResult.data?.sid },
          sent_at: adminResult.ok ? new Date().toISOString() : null,
        });

        if (!adminResult.ok) {
          console.error("Admin SMS failed:", JSON.stringify(adminResult.data));
        }
      } catch (adminErr) {
        console.error("Admin SMS error:", adminErr);
      }
    }

    if (!userResult.ok) {
      console.error(`Auto SMS error for ${formattedPhone}:`, JSON.stringify(userResult.data));
      return new Response(
        JSON.stringify({ success: false, error: userResult.data?.message || "SMS gönderilemedi" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, sid: userResult.data.sid, message: "SMS gönderildi" }),
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
