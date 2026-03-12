import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: "LOVABLE_API_KEY is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
  if (!TWILIO_API_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: "TWILIO_API_KEY is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const payload = await req.json();
    const { from, to, body } = payload;

    if (!from || !to || !body) {
      return new Response(
        JSON.stringify({ success: false, error: "Eksik parametreler: from, to, body gerekli" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let toNumbers: string[] = [];
    if (Array.isArray(to)) {
      toNumbers = to.map((p: unknown) => String(p).trim()).filter(Boolean);
    } else {
      toNumbers = String(to).split(",").map((p: string) => p.trim()).filter(Boolean);
    }

    const results: Array<{
      phone: string;
      ok: boolean;
      sid: string | null;
      status: string | null;
      errorCode: number | string | null;
      errorMessage: string | null;
    }> = [];

    for (const rawPhone of toNumbers) {
      const formattedTo = formatTrPhone(rawPhone);
      if (!formattedTo) {
        results.push({ phone: rawPhone, ok: false, sid: null, status: null, errorCode: "INVALID_PHONE", errorMessage: "Geçersiz telefon numarası" });
        continue;
      }

      try {
        const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TWILIO_API_KEY,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: formattedTo,
            From: from,
            Body: body,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error(`Twilio error for ${formattedTo}:`, JSON.stringify(data));
          results.push({
            phone: formattedTo,
            ok: false,
            sid: null,
            status: null,
            errorCode: data?.code || response.status,
            errorMessage: data?.message || `HTTP ${response.status}`,
          });
        } else {
          results.push({
            phone: formattedTo,
            ok: true,
            sid: data.sid,
            status: data.status,
            errorCode: null,
            errorMessage: null,
          });
        }
      } catch (networkErr: any) {
        results.push({
          phone: formattedTo,
          ok: false,
          sid: null,
          status: null,
          errorCode: "NETWORK_ERROR",
          errorMessage: networkErr?.message || "Twilio ağına bağlanılamadı",
        });
      }
    }

    const successCount = results.filter((r) => r.ok).length;
    const failCount = results.length - successCount;

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        allSuccess: failCount === 0,
        successCount,
        failCount,
        from,
        results,
        message: failCount === 0
          ? "Tüm SMS'ler başarıyla gönderildi"
          : successCount > 0
            ? "Bazı SMS'ler gönderildi, bazıları başarısız oldu"
            : "Hiçbir SMS gönderilemedi",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("SMS function error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Beklenmeyen sunucu hatası" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
