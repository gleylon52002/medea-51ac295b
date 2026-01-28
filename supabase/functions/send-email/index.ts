import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "order_confirmation" | "contact_form" | "newsletter_welcome";
  to: string;
  data: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email service not configured" 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const { type, to, data } = await req.json() as EmailRequest;

    let subject = "";
    let html = "";

    switch (type) {
      case "order_confirmation":
        subject = `Siparişiniz Alındı - ${data.orderNumber}`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #8B7355;">MEDEA</h1>
            <h2>Siparişiniz için teşekkürler!</h2>
            <p>Sayın ${data.customerName},</p>
            <p>Siparişiniz başarıyla alınmıştır.</p>
            <p><strong>Sipariş Numarası:</strong> ${data.orderNumber}</p>
            <p><strong>Toplam:</strong> ${data.total}</p>
            <hr />
            <h3>Teslimat Adresi:</h3>
            <p>${data.shippingAddress}</p>
            <hr />
            <p>Siparişiniz hazırlandığında size bilgi vereceğiz.</p>
            <p>MEDEA Kozmetik</p>
          </div>
        `;
        break;

      case "contact_form":
        subject = `İletişim Formu: ${data.subject}`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #8B7355;">MEDEA - Yeni İletişim Mesajı</h1>
            <p><strong>Gönderen:</strong> ${data.name}</p>
            <p><strong>E-posta:</strong> ${data.email}</p>
            <p><strong>Konu:</strong> ${data.subject}</p>
            <hr />
            <p><strong>Mesaj:</strong></p>
            <p>${data.message}</p>
          </div>
        `;
        break;

      case "newsletter_welcome":
        subject = "MEDEA Bültenine Hoşgeldiniz!";
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #8B7355;">MEDEA</h1>
            <h2>Bültene Hoşgeldiniz!</h2>
            <p>Merhaba,</p>
            <p>MEDEA bültenine başarıyla kayıt oldunuz.</p>
            <p>Artık yeni ürünlerimiz, özel indirimler ve doğal bakım ipuçlarından haberdar olacaksınız.</p>
            <p>Teşekkürler,<br/>MEDEA Kozmetik</p>
          </div>
        `;
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "MEDEA <noreply@medea.com.tr>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const responseData = await res.json();

    return new Response(
      JSON.stringify({ success: true, id: responseData.id }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Email sending error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
