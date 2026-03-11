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
    const { api_id, api_key, sender, message, phones, message_content_type } = await req.json();

    if (!api_id || !api_key || !sender || !message || !phones) {
      return new Response(
        JSON.stringify({ success: false, error: "Eksik parametreler" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Telefon numaralarını diziye çevir
    const phoneList = Array.isArray(phones)
      ? phones
      : phones.split(",").map((p) => p.trim());

    const body = {
      api_id,
      api_key,
      sender,
      message_type: "normal",
      message,
      message_content_type: message_content_type || "bilgi",
      phones: phoneList,
    };

    console.log("VatanSMS API Request:", JSON.stringify({ ...body, api_key: "***", api_id: "***" }));

    const response = await fetch("https://api.vatansms.net/api/v1/1toN", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    console.log("VatanSMS API Response:", JSON.stringify(result));

    if (result.status === "success" || result.code === 200 || response.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "SMS başarıyla gönderildi!",
          data: result,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.message || result.description || "SMS gönderilemedi",
          data: result,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("VatanSMS Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
