import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type EmailType = 
  | "order_confirmation" 
  | "order_status_update" 
  | "shipping_notification"
  | "contact_form"
  | "newsletter_welcome"
  | "low_stock_alert"
  | "newsletter_broadcast"
  | "test_email";

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

    // Get email settings from site_settings
    const { data: emailSettingsRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "email")
      .single();

    const emailSettings = (emailSettingsRow?.value as Record<string, any>) || {};
    const senderName = emailSettings.sender_name || "MEDEA";
    // Use Resend's default sender unless a verified custom domain is configured
    const senderEmail = emailSettings.sender_email || "onboarding@resend.dev";

    // Check if this email type is enabled
    if (type === "order_confirmation" && emailSettings.order_confirmation_enabled === false) {
      return new Response(
        JSON.stringify({ success: false, message: "Order confirmation emails disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (type === "order_status_update" && emailSettings.order_status_enabled === false) {
      return new Response(
        JSON.stringify({ success: false, message: "Order status emails disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (type === "shipping_notification" && emailSettings.shipping_notification_enabled === false) {
      return new Response(
        JSON.stringify({ success: false, message: "Shipping notification emails disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let subject = "";
    let html = "";
    let order: any = null;
    let shippingAddress: any = null;

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
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <div style="background: #8B7355; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0;">${senderName}</h1>
              </div>
              <div style="padding: 30px 20px;">
                <h2 style="color: #333;">Siparişiniz için teşekkürler!</h2>
                <p>Sayın ${shippingAddress?.full_name || 'Değerli Müşterimiz'},</p>
                <p>Siparişiniz başarıyla alınmıştır.</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Sipariş Numarası:</strong> ${order.order_number}</p>
                  <p><strong>Toplam:</strong> ${Number(order.total).toFixed(2)}₺</p>
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
                        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${Number(item.total_price).toFixed(2)}₺</td>
                      </tr>
                    `).join("") || ""}
                  </tbody>
                </table>
                <h3>Teslimat Adresi:</h3>
                <p>${shippingAddress?.address || ""}<br>${shippingAddress?.district || ""}, ${shippingAddress?.city || ""}</p>
                <hr />
                <p>Siparişiniz hazırlandığında size bilgi vereceğiz.</p>
              </div>
              <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                <p>${senderName}</p>
              </div>
            </div>
          `;
        } else if (data) {
          subject = `Siparişiniz Alındı - ${data.orderNumber}`;
          html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <div style="background: #8B7355; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0;">${senderName}</h1>
              </div>
              <div style="padding: 30px 20px;">
                <h2>Siparişiniz için teşekkürler!</h2>
                <p>Sayın ${data.customerName},</p>
                <p>Siparişiniz başarıyla alınmıştır.</p>
                <p><strong>Sipariş Numarası:</strong> ${data.orderNumber}</p>
                <p><strong>Toplam:</strong> ${data.total}</p>
                <hr />
                <h3>Teslimat Adresi:</h3>
                <p>${data.shippingAddress}</p>
              </div>
              <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                <p>${senderName}</p>
              </div>
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
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <div style="background: #8B7355; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0;">${senderName}</h1>
              </div>
              <div style="padding: 30px 20px;">
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
              </div>
              <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                <p>${senderName}</p>
              </div>
            </div>
          `;
        }
        break;

      case "shipping_notification":
        if (order) {
          subject = `Siparişiniz Kargoya Verildi - ${order.order_number}`;
          html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <div style="background: #8B7355; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0;">${senderName}</h1>
              </div>
              <div style="padding: 30px 20px;">
                <h2>🚚 Siparişiniz Yola Çıktı!</h2>
                <p>Sayın ${shippingAddress?.full_name || 'Değerli Müşterimiz'},</p>
                <p><strong>${order.order_number}</strong> numaralı siparişiniz kargoya verildi.</p>
                ${order.tracking_number ? `
                  <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Takip Numarası:</strong> ${order.tracking_number}</p>
                    ${order.shipping_company ? `<p><strong>Kargo Firması:</strong> ${order.shipping_company}</p>` : ""}
                  </div>
                ` : ""}
              </div>
              <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                <p>${senderName}</p>
              </div>
            </div>
          `;
        }
        break;

      case "contact_form":
        subject = `İletişim Formu: ${data?.subject || "Yeni Mesaj"}`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: #8B7355; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">${senderName} - Yeni İletişim Mesajı</h1>
            </div>
            <div style="padding: 30px 20px;">
              <p><strong>Gönderen:</strong> ${data?.name || "-"}</p>
              <p><strong>E-posta:</strong> ${data?.email || "-"}</p>
              <p><strong>Konu:</strong> ${data?.subject || "-"}</p>
              <hr />
              <p><strong>Mesaj:</strong></p>
              <p>${data?.message || "-"}</p>
            </div>
          </div>
        `;
        break;

      case "newsletter_welcome":
        subject = `${senderName} Bültenine Hoşgeldiniz!`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: #8B7355; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">${senderName}</h1>
            </div>
            <div style="padding: 30px 20px;">
              <h2>Bültene Hoşgeldiniz!</h2>
              <p>Merhaba,</p>
              <p>${senderName} bültenine başarıyla kayıt oldunuz.</p>
              <p>Artık yeni ürünlerimiz, özel indirimler ve doğal bakım ipuçlarından haberdar olacaksınız.</p>
              <p>Teşekkürler,<br/>${senderName}</p>
            </div>
          </div>
        `;
        break;

      case "low_stock_alert":
        subject = `⚠️ Düşük Stok Uyarısı - ${data?.productName || "Ürün"}`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: #dc2626; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">⚠️ Düşük Stok Uyarısı</h1>
            </div>
            <div style="padding: 30px 20px;">
              <p>Aşağıdaki ürünün stok seviyesi düşük:</p>
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Ürün:</strong> ${data?.productName || "-"}</p>
                <p><strong>Mevcut Stok:</strong> ${data?.currentStock || 0} adet</p>
              </div>
              <p>Lütfen stok güncelleme işlemini yapın.</p>
            </div>
          </div>
        `;
        break;

      case "newsletter_broadcast":
        subject = data?.subject as string || `${senderName} Bülten`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: #8B7355; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">${senderName}</h1>
            </div>
            <div style="padding: 30px 20px;">
              ${(data?.body as string || "").split("\n").map((line: string) => `<p>${line || "&nbsp;"}</p>`).join("")}
            </div>
            <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
              <p>${senderName} — Bu e-postayı bülten aboneliğiniz nedeniyle aldınız.</p>
            </div>
          </div>
        `;
        break;

      case "test_email":
        subject = data?.subject as string || `${senderName} Test E-postası`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: #8B7355; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">${senderName} — Test</h1>
            </div>
            <div style="padding: 30px 20px;">
              <h2>🧪 Bu bir test e-postasıdır</h2>
              <p>${data?.body as string || "E-posta sisteminiz düzgün çalışıyor!"}</p>
              <p style="color: #666; font-size: 12px;">Gönderim zamanı: ${new Date().toLocaleString("tr-TR")}</p>
            </div>
          </div>
        `;
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    // Log email attempt
    await supabase.from("email_logs").insert({
      email_type: type,
      recipient_email: to,
      subject,
      status: RESEND_API_KEY ? "pending" : "skipped",
      order_id: orderId || null,
      user_id: order?.user_id || null,
    });

    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ success: false, message: "E-posta servisi yapılandırılmamış. Resend API anahtarı gerekli." }),
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
        from: `${senderName} <${senderEmail}>`,
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      
      // Update email log
      await supabase
        .from("email_logs")
        .update({ status: "failed", error_message: errorData })
        .eq("recipient_email", to)
        .eq("email_type", type)
        .order("created_at", { ascending: false })
        .limit(1);

      throw new Error(`Failed to send email: ${errorData}`);
    }

    const responseData = await res.json();

    // Update email log status
    await supabase
      .from("email_logs")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("recipient_email", to)
      .eq("email_type", type)
      .order("created_at", { ascending: false })
      .limit(1);

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