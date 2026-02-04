import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type EmailType = 
  | "order_confirmation" 
  | "order_status_update" 
  | "shipping_notification"
  | "contact_form"
  | "newsletter_welcome";

interface EmailRequest {
  type: EmailType;
  to: string;
  orderId?: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, to, orderId, data } = await req.json() as EmailRequest;

    let subject = "";
    let html = "";
    let order: any = null;
    let shippingAddress: any = null;

    // Fetch order details if orderId is provided
    if (orderId) {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(`*, order_items(*)`)
        .eq("id", orderId)
        .single();

      if (!orderError && orderData) {
        order = orderData;
        shippingAddress = order.shipping_address as {
          full_name: string;
          address: string;
          city: string;
          district: string;
          phone: string;
        };
      }
    }

    switch (type) {
      case "order_confirmation":
        if (order) {
          subject = `Siparişiniz Alındı - ${order.order_number}`;
          html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #8B7355;">MEDEA</h1>
              <h2>Siparişiniz için teşekkürler!</h2>
              <p>Sayın ${shippingAddress?.full_name || 'Değerli Müşterimiz'},</p>
              <p>Siparişiniz başarıyla alınmıştır.</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Sipariş Numarası:</strong> ${order.order_number}</p>
                <p><strong>Toplam:</strong> ${order.total.toFixed(2)}₺</p>
              </div>
              <h3>Ürünler:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f0f0f0;">
                    <th style="padding: 10px; text-align: left;">Ürün</th>
                    <th style="padding: 10px; text-align: center;">Adet</th>
                    <th style="padding: 10px; text-align: right;">Fiyat</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.order_items?.map((item: any) => `
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td>
                      <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
                      <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${item.total_price.toFixed(2)}₺</td>
                    </tr>
                  `).join("") || ""}
                </tbody>
              </table>
              <h3>Teslimat Adresi:</h3>
              <p>${shippingAddress?.address || ""}<br>${shippingAddress?.district || ""}, ${shippingAddress?.city || ""}</p>
              <hr />
              <p>Siparişiniz hazırlandığında size bilgi vereceğiz.</p>
              <p>MEDEA Kozmetik</p>
            </div>
          `;
        } else if (data) {
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
        }
        break;

      case "order_status_update":
        if (order) {
          const statusLabels: Record<string, string> = {
            pending: "Beklemede",
            confirmed: "Onaylandı",
            preparing: "Hazırlanıyor",
            shipped: "Kargoya Verildi",
            delivered: "Teslim Edildi",
            cancelled: "İptal Edildi",
          };
          const statusLabel = statusLabels[order.status] || order.status;

          subject = `Sipariş Durumu Güncellendi - ${order.order_number}`;
          html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #8B7355;">MEDEA</h1>
              <h2>Sipariş Durumu Güncellendi</h2>
              <p>Sayın ${shippingAddress?.full_name || 'Değerli Müşterimiz'},</p>
              <p><strong>${order.order_number}</strong> numaralı siparişinizin durumu güncellendi.</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="font-size: 24px; font-weight: bold; color: #333; margin: 0;">
                  ${statusLabel}
                </p>
              </div>
              ${order.status === "shipped" && order.tracking_number ? `
                <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Kargo Takip Numarası:</strong> ${order.tracking_number}</p>
                  ${order.shipping_company ? `<p><strong>Kargo Firması:</strong> ${order.shipping_company}</p>` : ""}
                </div>
              ` : ""}
              <p>MEDEA Kozmetik</p>
            </div>
          `;
        }
        break;

      case "shipping_notification":
        if (order) {
          subject = `Siparişiniz Kargoya Verildi - ${order.order_number}`;
          html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #8B7355;">MEDEA</h1>
              <h2>🚚 Siparişiniz Yola Çıktı!</h2>
              <p>Sayın ${shippingAddress?.full_name || 'Değerli Müşterimiz'},</p>
              <p><strong>${order.order_number}</strong> numaralı siparişiniz kargoya verildi.</p>
              ${order.tracking_number ? `
                <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Takip Numarası:</strong> ${order.tracking_number}</p>
                  ${order.shipping_company ? `<p><strong>Kargo Firması:</strong> ${order.shipping_company}</p>` : ""}
                </div>
              ` : ""}
              <p>MEDEA Kozmetik</p>
            </div>
          `;
        }
        break;

      case "contact_form":
        subject = `İletişim Formu: ${data?.subject || "Yeni Mesaj"}`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #8B7355;">MEDEA - Yeni İletişim Mesajı</h1>
            <p><strong>Gönderen:</strong> ${data?.name || "-"}</p>
            <p><strong>E-posta:</strong> ${data?.email || "-"}</p>
            <p><strong>Konu:</strong> ${data?.subject || "-"}</p>
            <hr />
            <p><strong>Mesaj:</strong></p>
            <p>${data?.message || "-"}</p>
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

    // Log email attempt
    if (orderId) {
      await supabase.from("email_logs").insert({
        email_type: type,
        recipient_email: to,
        subject,
        status: RESEND_API_KEY ? "pending" : "skipped",
        order_id: orderId,
        user_id: order?.user_id,
      });
    }

    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ success: false, message: "Email service not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "MEDEA <noreply@medea.lovable.app>",
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

    // Update email log status
    if (orderId) {
      await supabase
        .from("email_logs")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("order_id", orderId)
        .eq("email_type", type);
    }

    return new Response(
      JSON.stringify({ success: true, id: responseData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Email sending error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
