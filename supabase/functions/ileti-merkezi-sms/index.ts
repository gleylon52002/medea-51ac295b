import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accountSid, authToken, from, to, body } = await req.json();

    if (!accountSid || !authToken || !from || !to || !body) {
      return new Response(JSON.stringify({ success: false, error: "Eksik parametreler" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formatPhone = (phone: string): string => {
      let cleaned = phone.replace(/\D/g, "");
      if (cleaned.startsWith("90")) return `+${cleaned}`;
      if (cleaned.startsWith("0")) return `+90${cleaned.slice(1)}`;
      if (cleaned.startsWith("5")) return `+90${cleaned}`;
      return `+${cleaned}`;
    };

    const toNumbers = Array.isArray(to) ? to : to.split(",").map((p: string) => p.trim());
    const results = [];

    for (const phone of toNumbers) {
      const formattedPhone = formatPhone(phone);
      const params = new URLSearchParams({
        From: from,
        To: formattedPhone,
        Body: body,
      });

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const credentials = btoa(`${accountSid}:${authToken}`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const result = await response.json();
      results.push({
        phone: formattedPhone,
        sid: result.sid,
        status: result.status,
        error: result.message || result.code || null,
      });
    }

    const allSuccess = results.every((r) => r.sid && !r.error);
    const anySuccess = results.some((r) => r.sid && !r.error);

    return new Response(
      JSON.stringify({
        success: anySuccess,
        allSuccess,
        results,
        message: allSuccess
          ? "Tüm SMS'ler başarıyla gönderildi!"
          : anySuccess
            ? "Bazı SMS'ler gönderilemedi"
            : "SMS gönderilemedi",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Twilio SMS Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
