import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  message: string;
  sessionId?: string;
  userId?: string;
  context?: {
    orderNumber?: string;
    productId?: string;
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

    const payload: ChatRequest = await req.json();
    const { message, sessionId, userId, context } = payload;
    const lowerMessage = message.toLowerCase().trim();

    // Get site FAQs for knowledge base
    const { data: faqs } = await supabase
      .from("faqs")
      .select("question, answer")
      .eq("is_active", true)
      .limit(50);

    // Check for order tracking request
    const orderNumberMatch = lowerMessage.match(/(?:sipariş|takip|kargo).*?(mda-[a-z0-9-]+)/i) ||
                            lowerMessage.match(/(mda-[a-z0-9-]+)/i);

    if (orderNumberMatch) {
      const orderNumber = orderNumberMatch[1].toUpperCase();
      const { data: order } = await supabase
        .from("orders")
        .select("order_number, status, tracking_number, shipping_company, created_at")
        .eq("order_number", orderNumber)
        .maybeSingle();

      if (order) {
        const statusMap: Record<string, string> = {
          pending: "Beklemede",
          confirmed: "Onaylandı",
          preparing: "Hazırlanıyor",
          shipped: "Kargoya Verildi",
          delivered: "Teslim Edildi",
          cancelled: "İptal Edildi",
        };
        
        let response = `📦 **Sipariş Durumu**\n\nSipariş No: ${order.order_number}\nDurum: ${statusMap[order.status] || order.status}`;
        
        if (order.tracking_number) {
          response += `\nKargo Takip No: ${order.tracking_number}`;
          if (order.shipping_company) {
            response += `\nKargo Firması: ${order.shipping_company}`;
          }
        }

        return new Response(
          JSON.stringify({ success: true, response, type: "order_status" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: true,
            response: "Bu sipariş numarasına ait kayıt bulunamadı. Lütfen sipariş numaranızı kontrol edin.",
            type: "not_found",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check for common questions in FAQs
    let bestMatch: { question: string; answer: string } | null = null;
    let bestScore = 0;

    const keywords = lowerMessage.split(/\s+/).filter((w) => w.length > 2);

    faqs?.forEach((faq) => {
      const faqLower = faq.question.toLowerCase();
      let score = 0;
      keywords.forEach((kw) => {
        if (faqLower.includes(kw)) score++;
      });
      if (score > bestScore) {
        bestScore = score;
        bestMatch = faq;
      }
    });

    if (bestMatch && bestScore >= 2) {
      return new Response(
        JSON.stringify({
          success: true,
          response: bestMatch.answer,
          type: "faq",
          matchedQuestion: bestMatch.question,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Intent detection for common queries
    const intents: { keywords: string[]; response: string; type: string }[] = [
      {
        keywords: ["iade", "iptal", "geri"],
        response: "İade ve iptal işlemleri için sipariş detay sayfanızdan 'İade Talebi' oluşturabilirsiniz. Ürünler, teslim tarihinden itibaren 14 gün içinde iade edilebilir. Detaylı bilgi için İade Politikamızı inceleyebilirsiniz.",
        type: "return_policy",
      },
      {
        keywords: ["kargo", "teslimat", "ne zaman"],
        response: "Siparişleriniz genellikle 1-3 iş günü içinde kargoya verilir. 300₺ üzeri siparişlerde kargo ücretsizdir. Kargo takibi için sipariş numaranızı paylaşabilirsiniz.",
        type: "shipping_info",
      },
      {
        keywords: ["ödeme", "kredi kartı", "havale", "eft"],
        response: "Kredi kartı, banka kartı, havale/EFT ve kapıda ödeme seçenekleri mevcuttur. Tüm ödemeleriniz 256-bit SSL ile güvence altındadır.",
        type: "payment_info",
      },
      {
        keywords: ["indirim", "kupon", "kampanya"],
        response: "Aktif kampanyalarımızı anasayfada görebilirsiniz. İlk siparişinizde HOSGELDIN kodu ile %10 indirim kazanabilirsiniz! Ayrıca çarkıfelek çevirerek sürpriz kuponlar kazanabilirsiniz.",
        type: "promotions",
      },
      {
        keywords: ["iletişim", "telefon", "mail", "ulaş"],
        response: "Bize iletisim@medea.tr adresinden veya İletişim sayfamızdaki form aracılığıyla ulaşabilirsiniz. Mesajlarınıza en kısa sürede dönüş yapıyoruz.",
        type: "contact",
      },
      {
        keywords: ["hesap", "şifre", "giriş", "kayıt"],
        response: "Hesap işlemleri için sağ üst köşedeki kullanıcı ikonuna tıklayabilirsiniz. Şifrenizi unuttuysanız 'Şifremi Unuttum' seçeneğini kullanabilirsiniz.",
        type: "account",
      },
    ];

    for (const intent of intents) {
      if (intent.keywords.some((kw) => lowerMessage.includes(kw))) {
        return new Response(
          JSON.stringify({ success: true, response: intent.response, type: intent.type }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Default response - use AI if available
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (lovableApiKey) {
      try {
        const aiResponse = await fetch("https://api.lovable.dev/api/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${lovableApiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: `Sen MEDEA kozmetik markasının müşteri hizmetleri asistanısın. Türkçe yanıt ver. Kısa, samimi ve yardımcı ol. Site hakkında genel bilgiler:
- Doğal, el yapımı kozmetik ürünleri satıyoruz
- 300₺ üzeri siparişlerde ücretsiz kargo
- 14 gün iade hakkı
- Güvenli ödeme seçenekleri
Sipariş takibi için sipariş numarası iste (MDA-XXXX formatında).`,
              },
              { role: "user", content: message },
            ],
            max_tokens: 300,
          }),
        });

        const aiResult = await aiResponse.json();
        const aiMessage = aiResult.choices?.[0]?.message?.content || null;

        if (aiMessage) {
          return new Response(
            JSON.stringify({ success: true, response: aiMessage, type: "ai" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (e) {
        console.error("AI error:", e);
      }
    }

    // Fallback response
    return new Response(
      JSON.stringify({
        success: true,
        response: "Merhaba! Size nasıl yardımcı olabilirim? Sipariş takibi için sipariş numaranızı (MDA-XXXX) yazabilirsiniz. Ayrıca iade, kargo, ödeme veya kampanyalar hakkında sorularınızı yanıtlayabilirim.",
        type: "greeting",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
