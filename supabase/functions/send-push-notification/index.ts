import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userId = claimsData.claims.sub;

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const { title, message, target_type, target_user_ids, data: extraData } =
      await req.json();

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: "Title and message are required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OneSignal not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Build OneSignal payload
    const payload: Record<string, unknown> = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      data: extraData || {},
    };

    if (target_type === "all") {
      payload.included_segments = ["All"];
    } else if (
      target_type === "targeted" &&
      target_user_ids?.length > 0
    ) {
      // Get player_ids for target users
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: tokens } = await serviceClient
        .from("push_device_tokens")
        .select("player_id")
        .in("user_id", target_user_ids)
        .eq("is_active", true);

      if (!tokens || tokens.length === 0) {
        // Log notification even if no tokens found
        await serviceClient.from("push_notifications").insert({
          title,
          message,
          target_type,
          target_user_ids: target_user_ids || [],
          sent_count: 0,
          status: "no_devices",
          sent_by: userId,
          sent_at: new Date().toISOString(),
        });

        return new Response(
          JSON.stringify({ success: false, error: "No devices found for target users" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      payload.include_subscription_ids = tokens.map(
        (t: { player_id: string }) => t.player_id
      );
    } else if (target_type === "segment") {
      payload.included_segments = extraData?.segments || ["All"];
    }

    // Send via OneSignal
    const response = await fetch(
      "https://api.onesignal.com/notifications",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    // Log notification
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await serviceClient.from("push_notifications").insert({
      title,
      message,
      target_type,
      target_user_ids: target_user_ids || [],
      sent_count: result.recipients || 0,
      status: response.ok ? "sent" : "failed",
      metadata: result,
      sent_by: userId,
      sent_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: response.ok,
        recipients: result.recipients || 0,
        id: result.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
