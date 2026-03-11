import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function formatTrPhone(phone: string): string {
  let cleaned = String(phone || "").replace(/\D/g, "");

  if (!cleaned) return "";

  if (cleaned.startsWith("90")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+90${cleaned.slice(1)}`;
  if (cleaned.startsWith("5")) return `+90${cleaned}`;

  return `+${cleaned}`;
}

function formatIntlPhone(phone: string): string {
  const cleaned = String(phone || "").replace(/\D/g, "");
  return cleaned ? `+${cleaned}` : "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        error: "Sadece POST desteklenir.",
      },
      200,
    );
  }

  try {
    const payload = await req.json();

    const accountSid = String(payload?.accountSid || "").trim();
    const authToken = String(payload?.authToken || "").trim();
    const from = String(payload?.from || "").trim();
    const body = String(payload?.body || "").trim();

    let toNumbers: string[] = [];

    if (Array.isArray(payload?.to)) {
      toNumbers = payload.to.map((p: unknown) => String(p).trim()).filter(Boolean);
    } else if (typeof payload?.to === "string") {
      toNumbers = payload.to
        .split(",")
        .map((p: string) => p.trim())
        .filter(Boolean);
    }

    if (!accountSid || !authToken || !from || !body || toNumbers.length === 0) {
      return jsonResponse(
        {
          success: false,
          allSuccess: false,
          successCount: 0,
          failCount: toNumbers.length || 0,
          from: formatIntlPhone(from),
          results: [],
          message: "Eksik parametreler",
          error: "Eksik parametreler",
          required: ["accountSid", "authToken", "from", "to", "body"],
        },
        200,
      );
    }

    if (!accountSid.startsWith("AC")) {
      return jsonResponse(
        {
          success: false,
          allSuccess: false,
          successCount: 0,
          failCount: toNumbers.length,
          from: formatIntlPhone(from),
          results: [],
          message: "Geçersiz Account SID",
          error: "Geçersiz Account SID",
        },
        200,
      );
    }

    const formattedFrom = formatIntlPhone(from);

    const results: Array<{
      phone: string;
      ok: boolean;
      httpStatus: number;
      sid: string | null;
      status: string | null;
      errorCode: number | string | null;
      errorMessage: string | null;
      moreInfo: string | null;
      raw: unknown;
    }> = [];

    for (const rawPhone of toNumbers) {
      const formattedTo = formatTrPhone(rawPhone);

      if (!formattedTo) {
        results.push({
          phone: rawPhone,
          ok: false,
          httpStatus: 400,
          sid: null,
          status: null,
          errorCode: "INVALID_PHONE",
          errorMessage: "Geçersiz telefon numarası",
          moreInfo: null,
          raw: null,
        });
        continue;
      }

      const params = new URLSearchParams({
        From: formattedFrom,
        To: formattedTo,
        Body: body,
      });

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const credentials = btoa(`${accountSid}:${authToken}`);

      let twilioResponse: Response;
      let twilioResult: any = null;

      try {
        twilioResponse = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });
      } catch (networkErr: any) {
        results.push({
          phone: formattedTo,
          ok: false,
          httpStatus: 500,
          sid: null,
          status: null,
          errorCode: "NETWORK_ERROR",
          errorMessage: networkErr?.message || "Twilio ağına bağlanılamadı",
          moreInfo: null,
          raw: null,
        });
        continue;
      }

      try {
        twilioResult = await twilioResponse.json();
      } catch {
        const text = await twilioResponse.text().catch(() => "");
        twilioResult = { message: text || "Twilio JSON dönmedi" };
      }

      results.push({
        phone: formattedTo,
        ok: twilioResponse.ok,
        httpStatus: twilioResponse.status,
        sid: twilioResult?.sid ?? null,
        status: twilioResult?.status ?? null,
        errorCode: twilioResult?.code ?? null,
        errorMessage: twilioResult?.message ?? null,
        moreInfo: twilioResult?.more_info ?? null,
        raw: twilioResult,
      });
    }

    const successCount = results.filter((r) => r.ok && r.sid).length;
    const failCount = results.length - successCount;
    const success = successCount > 0;
    const allSuccess = failCount === 0;

    return jsonResponse(
      {
        success,
        allSuccess,
        successCount,
        failCount,
        from: formattedFrom,
        results,
        message: allSuccess
          ? "Tüm SMS'ler başarıyla gönderildi"
          : success
            ? "Bazı SMS'ler gönderildi, bazıları başarısız oldu"
            : "Hiçbir SMS gönderilemedi",
      },
      200,
    );
  } catch (error: any) {
    return jsonResponse(
      {
        success: false,
        allSuccess: false,
        successCount: 0,
        failCount: 0,
        results: [],
        message: error?.message || "Beklenmeyen sunucu hatası",
        error: error?.message || "Beklenmeyen sunucu hatası",
      },
      200,
    );
  }
});
