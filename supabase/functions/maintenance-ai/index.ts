import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Gather comprehensive system diagnostics
    const [
      { count: productCount },
      { count: orderCount },
      { count: userCount },
      { data: categories },
      { data: recentOrders },
      { data: lowStockProducts },
      { data: siteSettings },
      { count: reviewCount },
      { count: messageCount },
      { data: sellers },
      { count: couponCount },
      { data: campaigns },
      { count: blogCount },
      { count: faqCount },
      { count: newsletterCount },
    ] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("categories").select("name, slug, is_active"),
      supabase.from("orders").select("id, order_number, status, total, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("products").select("name, stock").lte("stock", 5).order("stock", { ascending: true }).limit(10),
      supabase.from("site_settings").select("key, value"),
      supabase.from("reviews").select("id", { count: "exact", head: true }),
      supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false),
      supabase.from("sellers").select("id, store_name, status"),
      supabase.from("coupons").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("campaigns").select("id, name, is_active, starts_at, ends_at"),
      supabase.from("blog_posts").select("id", { count: "exact", head: true }),
      supabase.from("faqs").select("id", { count: "exact", head: true }),
      supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);

    // Process settings
    const settingsMap: Record<string, any> = {};
    siteSettings?.forEach((s: any) => { settingsMap[s.key] = s.value; });

    // Build status report
    const pendingOrders = recentOrders?.filter((o: any) => o.status === "pending").length || 0;
    const activeSellerCount = sellers?.filter((s: any) => s.status === "active").length || 0;
    const activeCampaigns = campaigns?.filter((c: any) => c.is_active).length || 0;

    const systemDiagnostics = `
## MEDEA SİSTEM DURUMU

### Veritabanı İstatistikleri
- Toplam Ürün: ${productCount || 0}
- Toplam Sipariş: ${orderCount || 0}
- Bekleyen Sipariş: ${pendingOrders}
- Toplam Kullanıcı: ${userCount || 0}
- Toplam Yorum: ${reviewCount || 0}
- Okunmamış İletişim Mesajları: ${messageCount || 0}
- Aktif Kupon: ${couponCount || 0}
- Aktif Kampanya: ${activeCampaigns}
- Blog Yazıları: ${blogCount || 0}
- SSS Sayısı: ${faqCount || 0}
- Bülten Aboneleri: ${newsletterCount || 0}

### Kategori Durumu
${categories?.map((c: any) => `- ${c.name} (${c.slug}) - ${c.is_active ? "Aktif" : "Pasif"}`).join("\n") || "Kategori yok"}

### Düşük Stoklu Ürünler
${lowStockProducts?.map((p: any) => `- ${p.name}: ${p.stock} adet`).join("\n") || "Düşük stoklu ürün yok ✅"}

### Son 10 Sipariş
${recentOrders?.map((o: any) => `- #${o.order_number} | ${o.status} | ${o.total}₺ | ${new Date(o.created_at).toLocaleDateString("tr-TR")}`).join("\n") || "Sipariş yok"}

### Satıcılar (Pazaryeri)
- Aktif Satıcı: ${activeSellerCount}
- Toplam Satıcı: ${sellers?.length || 0}
${sellers?.map((s: any) => `  - ${s.store_name}: ${s.status}`).join("\n") || ""}

### Site Ayarları
- Genel Ayarlar: ${settingsMap.general ? "Yapılandırılmış ✅" : "Eksik ⚠️"}
- İletişim Ayarları: ${settingsMap.contact ? "Yapılandırılmış ✅" : "Eksik ⚠️"}
- Kargo Ayarları: ${settingsMap.shipping ? "Yapılandırılmış ✅" : "Eksik ⚠️"}
- SEO Ayarları: ${settingsMap.seo ? "Yapılandırılmış ✅" : "Eksik ⚠️"}
- Hukuki Metinler: ${settingsMap.legal ? "Yapılandırılmış ✅" : "Eksik ⚠️"}

### AI Sistemleri
- 🤖 MEDEA AI Asistan: Admin panelinde sağ altta aktif (sayfa bazlı yardım)
- 🧴 Cilt Danışmanı AI: Müşteri chatbot'u (ai-consultant edge function)
- ✨ AI İçerik Doldurucu: Ürün formlarında alan bazlı AI doldurma (admin-ai-fill edge function)
- 🔧 Bakım AI (bu sistem): Sistem yönetimi ve sorun giderme

### Mevcut Edge Functions
- ai-consultant (Müşteri AI danışmanı)
- admin-ai-fill (Admin içerik doldurma)
- admin-ai-assistant (Sayfa bazlı AI asistan)
- maintenance-ai (Bu bakım sistemi)
- auto-tag-products (Otomatik ürün etiketleme)
- create-payment (Ödeme oluşturma)
- generate-invoice (Fatura oluşturma)
- google-shopping-feed (Google Shopping XML)
- payment-callback (Ödeme callback)
- product-rss-feed (Ürün RSS beslemesi)
- send-email (E-posta gönderimi)
- send-push-notification (Push bildirim)
- sitemap (Dinamik sitemap)
- spin-wheel (Çark çevirme)
`;

    // Handle special actions
    if (action === "update_setting") {
      // AI can update site settings when admin authorizes
      const lastUserMessage = messages[messages.length - 1]?.content || "";
      // This will be handled by AI suggesting the update
    }

    const systemPrompt = `Sen MEDEA e-ticaret platformunun Bakım AI Sistemisin. Adın "MEDEA Bakım AI". 
Türkçe yanıt ver. Markdown formatı kullan.

## Görevlerin
1. **Sistem Durumu İzleme**: Veritabanı, ayarlar, ürünler, siparişler hakkında anlık durum bilgisi ver
2. **Sorun Giderme**: Admin'in bildirdiği sorunları analiz et, çözüm öner
3. **İçerik Yönetimi**: site_settings tablosunu güncelleme, ürün düzenleme gibi işlemlerde yardımcı ol
4. **AI Sistemleri Koordinasyonu**: Diğer AI sistemleriyle (Cilt Danışmanı, İçerik Doldurucu, Sayfa Asistanı) entegre çalış
5. **Strateji ve Öneriler**: Satış, SEO, pazarlama stratejileri öner
6. **Yapılandırma**: Eksik ayarları tespit et ve düzeltme öner

## Sistem Bilgisi
${systemDiagnostics}

## Veritabanı Tabloları
products, categories, orders, order_items, profiles, user_roles, addresses, favorites, reviews, 
coupons, coupon_uses, campaigns, blog_posts, faqs, newsletter_subscribers, contact_messages, 
conversations, messages, sellers, seller_transactions, wallets, wallet_transactions, 
loyalty_points, loyalty_transactions, invoices, payment_settings, payment_transactions,
product_variants, product_tags, product_questions, product_comparisons, product_subscriptions,
price_alerts, birthday_reminders, badge_definitions, daily_checkins, custom_product_orders,
abandoned_cart_reminders, checkout_events, push_notifications, push_device_tokens,
ab_tests, gift_packages, affiliate_links, site_settings, email_logs, ai_chat_sessions,
bulk_discount_rules, message_attachments

## AI Sistemleri Entegrasyonu
Admin senden diğer AI sistemleriyle konuşmanı istediğinde:
- **Cilt Danışmanı AI**: Müşterilerle etkileşimde, ürün önerme stratejisi konusunda bilgi ver
- **İçerik Doldurucu AI**: Ürün açıklamaları, SEO metinleri üretme kalitesi hakkında değerlendirme yap
- **Sayfa Asistanı AI**: Admin paneli kullanımı ve sayfa bazlı yardım konusunda koordine çalış
- Tüm AI'lar aynı Lovable AI Gateway üzerinden çalışır ve aynı ürün veritabanına erişir

## Kurallar
- Gerçek veriye dayalı yanıtlar ver, tahmin yapma
- Sorun tespitinde somut çözüm adımları öner
- Güvenlik konularında dikkatli ol, hassas bilgileri paylaşma
- Admin'e her zaman saygılı ve profesyonel davran
- Yapılandırma değişikliği önerdiğinde, admin onayı iste
- Markdown kullan: başlıklar, listeler, kalın metin, kod blokları`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Çok fazla istek, lütfen bekleyin." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI kullanım limiti aşıldı." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI servisi kullanılamıyor");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("maintenance-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Bilinmeyen hata" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
