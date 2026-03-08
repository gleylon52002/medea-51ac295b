import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const triggerType = body.trigger_type;
    const userId = body.user_id;
    const metadata = body.metadata || {};

    if (!triggerType) {
      return new Response(JSON.stringify({ error: "trigger_type required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active automations for this trigger
    const { data: automations, error: autoError } = await supabase
      .from("email_automations")
      .select("*")
      .eq("trigger_type", triggerType)
      .eq("is_active", true);

    if (autoError) throw autoError;
    if (!automations || automations.length === 0) {
      return new Response(JSON.stringify({ message: "No active automations for this trigger", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile if userId provided
    let userProfile: any = null;
    let userEmail = metadata.email || "";
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", userId)
        .maybeSingle();
      userProfile = profile;
      userEmail = userEmail || profile?.email || "";
    }

    if (!userEmail) {
      return new Response(JSON.stringify({ error: "No email found for user" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerName = userProfile?.full_name || metadata.customer_name || "Değerli Müşterimiz";
    let sentCount = 0;

    for (const automation of automations) {
      // Replace template variables
      let subject = automation.email_subject;
      let body = automation.email_body;

      const replacements: Record<string, string> = {
        "{musteri_adi}": customerName,
        "{email}": userEmail,
        "{siparis_no}": metadata.order_number || "",
        "{urun_adi}": metadata.product_name || "",
      };

      for (const [key, value] of Object.entries(replacements)) {
        subject = subject.replaceAll(key, value);
        body = body.replaceAll(key, value);
      }

      // If delay > 0, we'd need a queue system. For now, send immediately
      // (In production, you'd use pg_cron or a job queue for delayed sends)
      if (automation.delay_minutes === 0 || triggerType === "welcome") {
        // Send email via Resend
        if (resendKey) {
          try {
            const emailRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Medea <onboarding@resend.dev>",
                to: [userEmail],
                subject: subject,
                text: body,
              }),
            });

            if (emailRes.ok) {
              sentCount++;
              // Update sent count
              await supabase
                .from("email_automations")
                .update({ sent_count: automation.sent_count + 1 })
                .eq("id", automation.id);

              // Log the email
              await supabase.from("email_logs").insert({
                email_type: `automation_${triggerType}`,
                recipient_email: userEmail,
                subject: subject,
                user_id: userId || null,
                status: "sent",
                sent_at: new Date().toISOString(),
              });
            }
          } catch (emailErr) {
            console.error("Email send error:", emailErr);
            await supabase.from("email_logs").insert({
              email_type: `automation_${triggerType}`,
              recipient_email: userEmail,
              subject: subject,
              user_id: userId || null,
              status: "failed",
              error_message: String(emailErr),
            });
          }
        } else {
          console.log("RESEND_API_KEY not set, skipping email send");
          // Still log it
          await supabase.from("email_logs").insert({
            email_type: `automation_${triggerType}`,
            recipient_email: userEmail,
            subject: subject,
            user_id: userId || null,
            status: "skipped",
            error_message: "RESEND_API_KEY not configured",
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, total_automations: automations.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Process email automation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
