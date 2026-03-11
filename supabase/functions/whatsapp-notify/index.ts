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

const WHATSAPP_API_URL = "https://graph.facebook.com/v22.0/1027325807129390/messages";

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

    if (!settings?.enabled || !settings?.access_token) {
      console.error("WhatsApp not configured. Enabled:", settings?.enabled, "Token present:", !!settings?.access_token);
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

    console.log(`Sending WhatsApp ${type} to ${formattedPhone}`);

    // Send via WhatsApp Cloud API using template message
    const requestBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "template",
      template: {
        name: "hello_world",
        language: {
          code: "en_US",
        },
      },
    };

    console.log("WhatsApp API Request URL:", WHATSAPP_API_URL);
    console.log("WhatsApp API Request Body:", JSON.stringify(requestBody));

    const response = await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    console.log("WhatsApp API Response Status:", response.status);
    console.log("WhatsApp API Response Body:", JSON.stringify(result));

    if (!response.ok) {
      console.error("WhatsApp API Error:", JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        error: result?.error,
        errorMessage: result?.error?.message,
        errorCode: result?.error?.code,
        errorType: result?.error?.type,
        errorFbtraceId: result?.error?.fbtrace_id,
      }));
    }

    // Log the notification
    await supabase.from("notification_logs").insert({
      channel: "whatsapp",
      recipient: formattedPhone,
      message_type: type,
      status: response.ok ? "sent" : "failed",
      metadata: { 
        result, 
        data,
        api_status: response.status,
        api_url: WHATSAPP_API_URL,
        error_details: !response.ok ? result?.error : null,
      },
    } as any);

    return new Response(
      JSON.stringify({ 
        success: response.ok, 
        result,
        ...(! response.ok && { 
          error_message: result?.error?.message,
          error_code: result?.error?.code,
        }),
      }),
      { 
        status: response.ok ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("WhatsApp function error:", error.message, error.stack);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
