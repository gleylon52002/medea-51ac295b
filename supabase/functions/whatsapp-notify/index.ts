import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    // Get WhatsApp settings from database
    const { data: waSettings, error: settingsError } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "whatsapp_settings")
      .maybeSingle();

    if (settingsError) {
      console.error("Failed to fetch WhatsApp settings:", settingsError);
    }

    const settings = waSettings?.value as {
      enabled?: boolean;
      phone_number_id?: string;
      access_token?: string;
    } | null;

    console.log("WhatsApp settings loaded:", {
      enabled: settings?.enabled,
      hasPhoneNumberId: !!settings?.phone_number_id,
      hasAccessToken: !!settings?.access_token,
      phoneNumberId: settings?.phone_number_id,
    });

    if (!settings?.enabled || !settings?.phone_number_id || !settings?.access_token) {
      const missing = [];
      if (!settings?.enabled) missing.push("enabled=false");
      if (!settings?.phone_number_id) missing.push("phone_number_id missing");
      if (!settings?.access_token) missing.push("access_token missing");
      console.error("WhatsApp not configured. Missing:", missing.join(", "));
      return new Response(
        JSON.stringify({ success: false, message: "WhatsApp yapılandırılmamış: " + missing.join(", ") }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: WhatsAppPayload = await req.json();
    const { type, phone, data } = payload;

    // Format phone number: digits only, with country code, no + sign
    let formattedPhone = phone.replace(/\D/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "90" + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith("90") && formattedPhone.length === 10) {
      formattedPhone = "90" + formattedPhone;
    }

    // Build the API URL dynamically using the stored Phone Number ID
    const apiUrl = `https://graph.facebook.com/v22.0/${settings.phone_number_id}/messages`;

    // Use template message format as required by WhatsApp Business API
    const requestBody = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: "hello_world",
        language: {
          code: "en_US",
        },
      },
    };

    console.log("=== WhatsApp API Request ===");
    console.log("URL:", apiUrl);
    console.log("Phone:", formattedPhone);
    console.log("Type:", type);
    console.log("Body:", JSON.stringify(requestBody));

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${settings.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    console.log("=== WhatsApp API Response ===");
    console.log("Status:", response.status, response.statusText);
    console.log("Response:", JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error("=== WhatsApp API ERROR ===");
      console.error("HTTP Status:", response.status);
      console.error("Error Type:", result?.error?.type);
      console.error("Error Code:", result?.error?.code);
      console.error("Error Message:", result?.error?.message);
      console.error("Error Subcode:", result?.error?.error_subcode);
      console.error("FB Trace ID:", result?.error?.fbtrace_id);
      console.error("Full Error:", JSON.stringify(result?.error, null, 2));
    }

    // Log the notification to database
    await supabase.from("notification_logs").insert({
      channel: "whatsapp",
      recipient: formattedPhone,
      message_type: type,
      status: response.ok ? "sent" : "failed",
      metadata: {
        result,
        data,
        api_status: response.status,
        api_url: apiUrl,
        phone_number_id: settings.phone_number_id,
        error_details: !response.ok ? result?.error : null,
      },
    } as any);

    return new Response(
      JSON.stringify({
        success: response.ok,
        result,
        ...(!response.ok && {
          error_message: result?.error?.message,
          error_code: result?.error?.code,
          error_type: result?.error?.type,
        }),
      }),
      {
        status: response.ok ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("WhatsApp function exception:", error.message, error.stack);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
