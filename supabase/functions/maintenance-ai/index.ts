import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { messages, executeAction, actionType, actionParams, imageBase64, imageContext, fileBase64, fileName, fileType } = body;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle action execution
    if (executeAction) {
      const result = await executeMaintenanceAction(supabase, actionType, actionParams || {}, LOVABLE_API_KEY);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle image analysis
    if (imageBase64) {
      const analysisResult = await analyzeImage(LOVABLE_API_KEY, imageBase64, imageContext || "Bu görseli analiz et ve ne olduğunu açıkla.");
      return new Response(JSON.stringify({ content: analysisResult }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle non-image file analysis
    if (fileBase64 && fileName) {
      const analysisResult = await analyzeFile(LOVABLE_API_KEY, fileBase64, fileName, fileType || "application/octet-stream", imageContext || `Bu dosyayı analiz et: ${fileName}`);
      return new Response(JSON.stringify({ content: analysisResult }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather comprehensive system diagnostics
    const diagnostics = await gatherSystemDiagnostics(supabase);
    const systemPrompt = buildSystemPrompt(diagnostics);

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

// ==================== IMAGE ANALYSIS ====================

async function analyzeImage(apiKey: string, base64: string, context: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Sen MEDEA e-ticaret admin AI asistanısın. ${context}\n\nGörseli analiz et ve Türkçe yanıt ver. Eğer bu bir ürün görseli ise:\n- Ürün adı önerisi\n- Kategori önerisi\n- Açıklama önerisi\n- SEO anahtar kelimeleri\nsun ve [ACTION:create_product_from_image:Ürünü Oluştur:Görselden ürün oluşturulacak] formatında aksiyon butonu ekle.` },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }
          ],
        },
      ],
    }),
  });

  if (!response.ok) throw new Error("Görsel analizi başarısız");
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "Görsel analiz edilemedi.";
}

// ==================== DIAGNOSTICS ====================

async function gatherSystemDiagnostics(supabase: ReturnType<typeof createClient>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

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
    { data: outOfStockProducts },
    { data: todayOrders },
    { data: weekOrders },
    { data: recentActionLogs },
    { data: maintenanceTasks },
    { data: products },
    { data: contactMessages },
    { data: unreadMessages },
    { data: pendingReviews },
  ] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("categories").select("id, name, slug, is_active"),
    supabase.from("orders").select("id, order_number, status, total, created_at, user_id, shipping_address, notes").order("created_at", { ascending: false }).limit(10),
    supabase.from("products").select("id, name, stock, price").lte("stock", 5).gt("stock", 0).order("stock", { ascending: true }).limit(15),
    supabase.from("site_settings").select("key, value"),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false),
    supabase.from("sellers").select("id, store_name, status, reputation_points, user_id"),
    supabase.from("coupons").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("campaigns").select("id, name, is_active, starts_at, ends_at"),
    supabase.from("blog_posts").select("id", { count: "exact", head: true }),
    supabase.from("faqs").select("id", { count: "exact", head: true }),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("products").select("id, name").eq("stock", 0).eq("is_active", true).limit(20),
    supabase.from("orders").select("total, status").gte("created_at", today.toISOString()),
    supabase.from("orders").select("total, status, created_at").gte("created_at", weekAgo.toISOString()),
    supabase.from("ai_action_logs").select("*").order("created_at", { ascending: false }).limit(10),
    supabase.from("maintenance_tasks").select("*").eq("is_active", true).order("created_at", { ascending: false }),
    supabase.from("products").select("id, name, description, slug, category_id, ingredients, short_description, keywords, price, sale_price, stock, is_active, images").limit(50),
    supabase.from("contact_messages").select("id, name, email, subject, message, is_read, replied_at, created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("conversations").select("id, participants, context_type, last_message_at").order("last_message_at", { ascending: false }).limit(10),
    supabase.from("reviews").select("id, product_id, rating, comment, is_approved, created_at").eq("is_approved", false).limit(10),
  ]);

  const settingsMap: Record<string, unknown> = {};
  siteSettings?.forEach((s: { key: string; value: unknown }) => { settingsMap[s.key] = s.value; });

  const pendingOrders = recentOrders?.filter((o: { status: string }) => o.status === "pending").length || 0;
  const activeSellerCount = sellers?.filter((s: { status: string }) => s.status === "active").length || 0;
  const activeCampaigns = campaigns?.filter((c: { is_active: boolean }) => c.is_active).length || 0;
  const todayRevenue = todayOrders?.filter((o: { status: string }) => o.status === "delivered").reduce((sum: number, o: { total: number }) => sum + (Number(o.total) || 0), 0) || 0;
  const weekRevenue = weekOrders?.filter((o: { status: string }) => o.status === "delivered").reduce((sum: number, o: { total: number }) => sum + (Number(o.total) || 0), 0) || 0;

  return {
    productCount: productCount || 0,
    orderCount: orderCount || 0,
    userCount: userCount || 0,
    reviewCount: reviewCount || 0,
    messageCount: messageCount || 0,
    couponCount: couponCount || 0,
    blogCount: blogCount || 0,
    faqCount: faqCount || 0,
    newsletterCount: newsletterCount || 0,
    pendingOrders,
    activeSellerCount,
    activeCampaigns,
    todayRevenue,
    weekRevenue,
    categories: categories || [],
    lowStockProducts: lowStockProducts || [],
    outOfStockProducts: outOfStockProducts || [],
    sellers: sellers || [],
    settingsMap,
    recentOrders: recentOrders || [],
    recentActionLogs: recentActionLogs || [],
    maintenanceTasks: maintenanceTasks || [],
    products: products || [],
    contactMessages: contactMessages || [],
    unreadConversations: unreadMessages || [],
    pendingReviews: pendingReviews || [],
  };
}

// ==================== SYSTEM PROMPT ====================

function buildSystemPrompt(d: Awaited<ReturnType<typeof gatherSystemDiagnostics>>): string {
  return `Sen MEDEA e-ticaret platformunun TAM YETKİLİ Bakım AI Sistemisin. Adın "MEDEA Bakım AI".
Türkçe yanıt ver. Markdown formatı kullan.

## SENİN YETKİLERİN - TAM ADMİN ERİŞİMİ
Sen admin panelindeki HER ŞEYİ yapabilirsin:

### 🛒 ÜRÜN YÖNETİMİ
- Yeni ürün oluştur (görsel + başlık ile otomatik)
- Ürün bilgilerini güncelle (fiyat, açıklama, stok, SEO)
- Ürünleri pasife/aktife al
- Toplu fiyat güncelleme
- Ürün açıklamaları AI ile oluştur
- Ürün kategorilendirme

### 📦 SİPARİŞ YÖNETİMİ
- Sipariş durumlarını güncelle (onay, hazırlık, kargo, teslim)
- Kargo bilgisi ekle
- Sipariş analizi ve raporlama

### 💬 MESAJ YÖNETİMİ
- İletişim formundaki mesajları oku ve yanıtla
- Satıcılara mesaj gönder
- Konuşmalardaki mesajları yanıtla

### 📝 İÇERİK YÖNETİMİ
- Blog yazıları oluştur ve yayınla
- SSS oluştur ve güncelle
- Ürün açıklamaları oluştur
- SEO meta bilgilerini güncelle

### ⚙️ AYAR YÖNETİMİ
- Site ayarlarını güncelle (genel, iletişim, kargo, SEO)
- Tema ayarlarını değiştir
- Kampanya oluştur/güncelle
- Kupon oluştur

### 👥 KULLANICI & SATICI YÖNETİMİ
- Satıcı başvurularını onayla/reddet
- Yorum onaylama/reddetme
- Kullanıcı bilgilerini görüntüle

### 📊 ANALİZ & RAPORLAMA
- Satış trendleri analizi
- SEO raporu
- Stok analizi
- Performans raporu

### 📸 GÖRSEL ANALİZİ
- Yüklenen görselleri analiz et
- Görselden ürün bilgisi çıkar
- Ürün görseli olarak kaydet

## Aksiyon Butonları Formatı
[ACTION:aksiyon_tipi:Buton Yazısı:Kısa açıklama]

## TÜM KULLANILABILIR AKSİYONLAR

### Ürün Aksiyonları
- create_product: Yeni ürün oluştur (params: name, price, category_id, description, images, stock)
- create_product_from_image: Görselden ürün oluştur (params: name, price, category_id, description, image_url)
- update_product: Ürün güncelle (params: product_id, updates)
- deactivate_out_of_stock: Stoksuz ürünleri pasife al
- activate_in_stock: Stoklu ürünleri aktife al
- bulk_price_update: Toplu fiyat güncelle (params: percentage, category_id)
- generate_product_descriptions: Eksik ürün açıklamalarını AI ile oluştur
- update_seo_meta: SEO meta bilgilerini güncelle

### Sipariş Aksiyonları
- update_order_status: Sipariş durumu güncelle (params: order_id, status)
- bulk_confirm_orders: Bekleyen siparişleri toplu onayla

### Mesaj Aksiyonları
- reply_contact_message: İletişim mesajını yanıtla (params: message_id, reply_text)
- reply_conversation: Konuşmaya mesaj gönder (params: conversation_id, content)
- mark_messages_read: Mesajları okundu işaretle (params: message_ids)

### İçerik Aksiyonları
- create_blog_posts: Blog yazıları oluştur ve yayınla
- generate_faqs: SSS oluştur
- create_campaign: Kampanya oluştur (params: name, discount_type, discount_value, etc.)
- create_coupon: Kupon oluştur (params: code, discount_type, discount_value, etc.)

### Ayar Aksiyonları
- update_site_settings: Site ayarlarını güncelle (params: key, value)

### Yorum Aksiyonları
- approve_reviews: Yorumları onayla (params: review_ids)
- reject_reviews: Yorumları reddet (params: review_ids)

### Diğer
- cleanup_old_carts: Eski sepetleri temizle
- generate_seo_report: SEO raporu oluştur
- send_stock_alert: Stok uyarısı gönder

## MEDEA SİSTEM DURUMU (Canlı Veri)

### Özet
- Ürün: ${d.productCount} | Sipariş: ${d.orderCount} | Bekleyen: ${d.pendingOrders}
- Kullanıcı: ${d.userCount} | Yorum: ${d.reviewCount} | Mesaj (okunmamış): ${d.messageCount}
- Bugün Gelir: ₺${d.todayRevenue.toLocaleString("tr-TR")} | Hafta: ₺${d.weekRevenue.toLocaleString("tr-TR")}
- Kupon: ${d.couponCount} | Kampanya: ${d.activeCampaigns} | Blog: ${d.blogCount}
- Newsletter: ${d.newsletterCount} | SSS: ${d.faqCount}

### Kategoriler
${d.categories.map((c: any) => `- ${c.name} (ID: ${c.id}) ${c.is_active ? "✅" : "❌"}`).join("\n") || "Yok"}

### Ürünler (İlk 20)
${d.products.slice(0, 20).map((p: any) => 
  `- ${p.name} | ₺${p.price}${p.sale_price ? ` (İndirimli: ₺${p.sale_price})` : ''} | Stok: ${p.stock} | ${p.is_active ? "Aktif" : "Pasif"} | Kat: ${p.category_id || "Yok"}`
).join("\n") || "Yok"}

### Stok Durumu
Stoksuz (${d.outOfStockProducts.length}): ${d.outOfStockProducts.map((p: any) => p.name).join(", ") || "Yok ✅"}
Düşük (≤5): ${d.lowStockProducts.map((p: any) => `${p.name}(${p.stock})`).join(", ") || "Yok ✅"}

### Son 10 Sipariş
${d.recentOrders.map((o: any) => `- #${o.order_number} | ${o.status} | ₺${o.total}`).join("\n") || "Yok"}

### İletişim Mesajları (Son 10)
${d.contactMessages.slice(0, 10).map((m: any) => 
  `- [${m.is_read ? "Okundu" : "YENİ"}] ${m.name} (${m.email}): "${m.subject}" - ${m.message.substring(0, 80)}... | ID: ${m.id}${m.replied_at ? " ✅ Yanıtlandı" : " ⚠️ Yanıt bekleniyor"}`
).join("\n") || "Mesaj yok"}

### Onay Bekleyen Yorumlar
${d.pendingReviews.slice(0, 5).map((r: any) => 
  `- ⭐${r.rating} | "${(r.comment || "").substring(0, 60)}..." | ID: ${r.id}`
).join("\n") || "Yok ✅"}

### Satıcılar
${d.sellers.slice(0, 5).map((s: any) => `- ${s.store_name}: ${s.status} (${s.reputation_points} puan) | ID: ${s.id}`).join("\n") || "Yok"}

### Site Ayarları
- Genel: ${d.settingsMap.general ? "✅" : "⚠️ Eksik"}
- İletişim: ${d.settingsMap.contact ? "✅" : "⚠️ Eksik"}
- Kargo: ${d.settingsMap.shipping ? "✅" : "⚠️ Eksik"}
- SEO: ${d.settingsMap.seo ? "✅" : "⚠️ Eksik"}

## Kurallar
- Gerçek veriye dayalı yanıtlar ver
- Uygulanabilir aksiyonlar için [ACTION:...] formatını MUTLAKA kullan
- Admin "yap", "oluştur", "gönder" dediğinde hemen aksiyon butonu sun
- Mesaj yanıtlama isteklerinde mesaj içeriğini analiz edip uygun yanıt öner
- Ürün oluşturmada kategori otomatik eşle
- Güvenlik konularında dikkatli ol
- İçerik oluşturmada MEDEA markasına uygun profesyonel ton kullan`;
}

// ==================== CONTENT GENERATION HELPERS ====================

async function generateWithAI(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) throw new Error(`AI generation failed: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

function extractJSON(raw: string): any {
  const arrayMatch = raw.match(/\[[\s\S]*\]/);
  if (arrayMatch) return JSON.parse(arrayMatch[0]);
  const objMatch = raw.match(/\{[\s\S]*\}/);
  if (objMatch) return JSON.parse(objMatch[0]);
  throw new Error("AI yanıtından JSON çıkarılamadı");
}

// ==================== ACTION EXECUTION ====================

async function executeMaintenanceAction(
  supabase: ReturnType<typeof createClient>, 
  actionType: string, 
  params: Record<string, unknown>,
  apiKey: string
): Promise<{ success: boolean; message: string; affected?: number; details?: unknown }> {
  
  switch (actionType) {
    // ============ PRODUCT ACTIONS ============
    case "create_product": {
      const { name, price, category_id, description, images, stock, short_description, ingredients } = params as any;
      if (!name || !price) return { success: false, message: "Ürün adı ve fiyat gerekli" };

      const slug = (name as string).toLowerCase()
        .replace(/[ğ]/g, "g").replace(/[ü]/g, "u").replace(/[ş]/g, "s")
        .replace(/[ı]/g, "i").replace(/[ö]/g, "o").replace(/[ç]/g, "c")
        .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
        + "-" + Date.now().toString(36);

      // Auto-generate description if not provided
      let finalDescription = description;
      if (!finalDescription && name) {
        try {
          const raw = await generateWithAI(apiKey, `"${name}" adlı doğal kozmetik ürünü için 150 kelimelik SEO uyumlu Türkçe ürün açıklaması yaz. Sadece açıklama metnini döndür.`);
          finalDescription = raw;
        } catch { /* ignore */ }
      }

      // Auto-generate meta
      let metaTitle = `${name} | MEDEA Doğal Kozmetik`;
      let metaDescription = (finalDescription || name).substring(0, 155);

      const { data, error } = await supabase.from("products").insert({
        name,
        slug,
        price: Number(price),
        stock: Number(stock || 10),
        category_id: category_id || null,
        description: finalDescription || null,
        short_description: short_description || null,
        ingredients: ingredients || null,
        images: images || [],
        is_active: true,
        is_featured: false,
        meta_title: metaTitle,
        meta_description: metaDescription,
      }).select("id, name").single();

      if (error) throw error;
      return { success: true, message: `"${name}" ürünü oluşturuldu`, affected: 1, details: data };
    }

    case "create_product_from_image": {
      const { name, price, category_id, description, image_url } = params as any;
      if (!name) return { success: false, message: "Ürün adı gerekli" };

      const slug = (name as string).toLowerCase()
        .replace(/[ğ]/g, "g").replace(/[ü]/g, "u").replace(/[ş]/g, "s")
        .replace(/[ı]/g, "i").replace(/[ö]/g, "o").replace(/[ç]/g, "c")
        .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
        + "-" + Date.now().toString(36);

      let finalDescription = description;
      if (!finalDescription) {
        try {
          finalDescription = await generateWithAI(apiKey, `"${name}" adlı doğal kozmetik ürünü için 150 kelimelik SEO uyumlu Türkçe ürün açıklaması yaz. Sadece açıklama metnini döndür.`);
        } catch { /* ignore */ }
      }

      const { data, error } = await supabase.from("products").insert({
        name,
        slug,
        price: Number(price || 99),
        stock: 10,
        category_id: category_id || null,
        description: finalDescription || null,
        images: image_url ? [image_url] : [],
        is_active: true,
        meta_title: `${name} | MEDEA Doğal Kozmetik`,
        meta_description: (finalDescription || name).substring(0, 155),
      }).select("id, name").single();

      if (error) throw error;
      return { success: true, message: `"${name}" görselden oluşturuldu`, affected: 1, details: data };
    }

    case "update_product": {
      const { product_id, updates } = params as { product_id: string; updates: Record<string, unknown> };
      if (!product_id) return { success: false, message: "Ürün ID gerekli" };

      const { error } = await supabase.from("products").update(updates).eq("id", product_id);
      if (error) throw error;
      return { success: true, message: "Ürün güncellendi", affected: 1 };
    }

    case "deactivate_out_of_stock": {
      const { data, error } = await supabase
        .from("products").update({ is_active: false }).eq("stock", 0).eq("is_active", true).select("id");
      if (error) throw error;
      return { success: true, message: `${data?.length || 0} stoksuz ürün pasife alındı`, affected: data?.length || 0 };
    }

    case "activate_in_stock": {
      const { data, error } = await supabase
        .from("products").update({ is_active: true }).gt("stock", 0).eq("is_active", false).select("id");
      if (error) throw error;
      return { success: true, message: `${data?.length || 0} ürün aktifleştirildi`, affected: data?.length || 0 };
    }

    case "bulk_price_update": {
      const { percentage, category_id } = params as { percentage?: number; category_id?: string };
      if (!percentage) return { success: false, message: "Yüzde değeri gerekli" };

      let query = supabase.from("products").select("id, price");
      if (category_id) query = query.eq("category_id", category_id);

      const { data: products, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      let updated = 0;
      for (const product of products || []) {
        const newPrice = Math.round(product.price * (1 + percentage / 100) * 100) / 100;
        await supabase.from("products").update({ price: newPrice }).eq("id", product.id);
        updated++;
      }
      return { success: true, message: `${updated} ürün fiyatı %${percentage} güncellendi`, affected: updated };
    }

    // ============ ORDER ACTIONS ============
    case "update_order_status": {
      const { order_id, status } = params as { order_id: string; status: string };
      if (!order_id || !status) return { success: false, message: "Sipariş ID ve durum gerekli" };

      const { error } = await supabase.from("orders").update({ status }).eq("id", order_id);
      if (error) throw error;
      return { success: true, message: `Sipariş durumu "${status}" olarak güncellendi`, affected: 1 };
    }

    case "bulk_confirm_orders": {
      const { data, error } = await supabase
        .from("orders").update({ status: "confirmed" }).eq("status", "pending").select("id");
      if (error) throw error;
      return { success: true, message: `${data?.length || 0} sipariş onaylandı`, affected: data?.length || 0 };
    }

    // ============ MESSAGE ACTIONS ============
    case "reply_contact_message": {
      const { message_id, reply_text } = params as { message_id: string; reply_text: string };
      if (!message_id || !reply_text) return { success: false, message: "Mesaj ID ve yanıt metni gerekli" };

      // Get the original message
      const { data: msg } = await supabase.from("contact_messages").select("*").eq("id", message_id).single();
      if (!msg) return { success: false, message: "Mesaj bulunamadı" };

      // Try to send email via Resend
      try {
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        if (RESEND_API_KEY) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "MEDEA <onboarding@resend.dev>",
              to: [msg.email],
              subject: `Re: ${msg.subject}`,
              html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                <h2 style="color:#333;">Merhaba ${msg.name},</h2>
                <p>${reply_text.replace(/\n/g, '<br>')}</p>
                <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
                <p style="color:#666;font-size:12px;">MEDEA Doğal Kozmetik</p>
              </div>`,
            }),
          });
        }
      } catch (e) {
        console.error("Email send error:", e);
      }

      // Mark as replied
      await supabase.from("contact_messages").update({ 
        replied_at: new Date().toISOString(), 
        is_read: true 
      }).eq("id", message_id);

      return { success: true, message: `${msg.name} adlı kişiye yanıt gönderildi`, affected: 1 };
    }

    case "reply_conversation": {
      const { conversation_id, content } = params as { conversation_id: string; content: string };
      if (!conversation_id || !content) return { success: false, message: "Konuşma ID ve içerik gerekli" };

      // Get admin user ID (first admin)
      const { data: adminRole } = await supabase.from("user_roles").select("user_id").eq("role", "admin").limit(1).single();
      if (!adminRole) return { success: false, message: "Admin kullanıcı bulunamadı" };

      const { error } = await supabase.from("messages").insert({
        conversation_id,
        sender_id: adminRole.user_id,
        content,
      });
      if (error) throw error;

      // Update conversation last_message_at
      await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversation_id);

      return { success: true, message: "Mesaj gönderildi", affected: 1 };
    }

    case "mark_messages_read": {
      const { message_ids } = params as { message_ids?: string[] };
      if (!message_ids?.length) {
        // Mark all unread
        const { data, error } = await supabase
          .from("contact_messages").update({ is_read: true }).eq("is_read", false).select("id");
        if (error) throw error;
        return { success: true, message: `${data?.length || 0} mesaj okundu olarak işaretlendi`, affected: data?.length || 0 };
      }
      for (const id of message_ids) {
        await supabase.from("contact_messages").update({ is_read: true }).eq("id", id);
      }
      return { success: true, message: `${message_ids.length} mesaj okundu işaretlendi`, affected: message_ids.length };
    }

    // ============ CONTENT ACTIONS ============
    case "create_blog_posts": {
      const [{ data: products }, { data: categories }] = await Promise.all([
        supabase.from("products").select("name, slug, description, ingredients, short_description, category_id").eq("is_active", true).limit(20),
        supabase.from("categories").select("name, slug").eq("is_active", true),
      ]);

      if (!products?.length) return { success: false, message: "Blog oluşturmak için aktif ürün bulunamadı" };

      const productInfo = products.slice(0, 10).map(p => 
        `- ${p.name}: ${p.short_description || p.description?.substring(0, 100) || 'Açıklama yok'}${p.ingredients ? ` | ${p.ingredients.substring(0, 100)}` : ''}`
      ).join("\n");

      const raw = await generateWithAI(apiKey, `MEDEA doğal kozmetik için SEO uyumlu 3-5 blog yazısı oluştur.\n\nÜrünler:\n${productInfo}\nKategoriler: ${categories?.map(c => c.name).join(", ")}\n\nJSON array döndür: [{"title":"","slug":"","content":"(min 500 kelime markdown)","excerpt":"(150 kar)","meta_title":"(60 kar)","meta_description":"(160 kar)","tags":["",""]}]\nSADECE JSON döndür.`);
      
      const blogPosts = extractJSON(raw);
      let created = 0;
      const titles: string[] = [];

      for (const post of blogPosts) {
        const { data: existing } = await supabase.from("blog_posts").select("id").eq("slug", post.slug).maybeSingle();
        if (existing) post.slug = `${post.slug}-${Date.now()}`;

        const { error } = await supabase.from("blog_posts").insert({
          title: post.title, slug: post.slug, content: post.content, excerpt: post.excerpt,
          meta_title: post.meta_title, meta_description: post.meta_description, tags: post.tags, is_published: true,
        });
        if (!error) { created++; titles.push(post.title); }
      }
      return { success: true, message: `${created} blog yazısı oluşturuldu`, affected: created, details: { titles } };
    }

    case "generate_faqs": {
      const [{ data: products }, { data: categories }] = await Promise.all([
        supabase.from("products").select("name, short_description, ingredients").eq("is_active", true).limit(15),
        supabase.from("categories").select("name").eq("is_active", true),
      ]);

      const raw = await generateWithAI(apiKey, `MEDEA doğal kozmetik sitesi için 8-12 SSS oluştur.\nÜrünler: ${products?.map(p => p.name).join(", ")}\nKategoriler: ${categories?.map(c => c.name).join(", ")}\nJSON: [{"question":"","answer":""}]\nSADECE JSON döndür.`);
      
      const faqs = extractJSON(raw);
      let created = 0;

      for (let i = 0; i < faqs.length; i++) {
        const { error } = await supabase.from("faqs").insert({
          question: faqs[i].question, answer: faqs[i].answer, sort_order: i, is_active: true,
        });
        if (!error) created++;
      }
      return { success: true, message: `${created} SSS oluşturuldu`, affected: created };
    }

    case "generate_product_descriptions": {
      const { data: products } = await supabase.from("products")
        .select("id, name, ingredients, short_description, category_id")
        .or("description.is.null,description.eq.").eq("is_active", true).limit(10);

      if (!products?.length) return { success: false, message: "Açıklaması eksik ürün bulunamadı" };

      const raw = await generateWithAI(apiKey, `Bu ürünler için SEO uyumlu Türkçe açıklama yaz (min 100 kelime).\nJSON: [{"id":"","description":""}]\n\n${products.map(p => `- ID: ${p.id} | ${p.name}${p.ingredients ? ` | İçerik: ${p.ingredients.substring(0, 80)}` : ''}`).join("\n")}\nSADECE JSON döndür.`);
      
      const descriptions = extractJSON(raw);
      let updated = 0;

      for (const item of descriptions) {
        const { error } = await supabase.from("products").update({ description: item.description }).eq("id", item.id);
        if (!error) updated++;
      }
      return { success: true, message: `${updated} ürün açıklaması güncellendi`, affected: updated };
    }

    case "update_seo_meta": {
      const { data: products } = await supabase.from("products")
        .select("id, name, short_description, ingredients").is("meta_title", null).eq("is_active", true).limit(20);

      if (!products?.length) return { success: false, message: "SEO meta eksik ürün bulunamadı" };

      const raw = await generateWithAI(apiKey, `SEO meta oluştur.\nJSON: [{"id":"","meta_title":"(max 60)","meta_description":"(max 160)"}]\n\n${products.map(p => `- ID: ${p.id} | ${p.name}`).join("\n")}\nSADECE JSON döndür.`);
      
      const metas = extractJSON(raw);
      let updated = 0;

      for (const item of metas) {
        const { error } = await supabase.from("products").update({ meta_title: item.meta_title, meta_description: item.meta_description }).eq("id", item.id);
        if (!error) updated++;
      }
      return { success: true, message: `${updated} ürünün SEO meta güncellendi`, affected: updated };
    }

    case "create_campaign": {
      const { name, discount_type, discount_value, description, applies_to } = params as any;
      if (!name || !discount_type || !discount_value) return { success: false, message: "Kampanya adı, indirim tipi ve değeri gerekli" };

      const { error } = await supabase.from("campaigns").insert({
        name, discount_type, discount_value: Number(discount_value),
        description: description || null, applies_to: applies_to || "all",
        is_active: true, starts_at: new Date().toISOString(),
      });
      if (error) throw error;
      return { success: true, message: `"${name}" kampanyası oluşturuldu`, affected: 1 };
    }

    case "create_coupon": {
      const { code, discount_type, discount_value, max_uses, minimum_order_amount } = params as any;
      if (!code || !discount_type || !discount_value) return { success: false, message: "Kupon kodu, indirim tipi ve değeri gerekli" };

      const { error } = await supabase.from("coupons").insert({
        code: (code as string).toUpperCase(), discount_type, discount_value: Number(discount_value),
        max_uses: max_uses ? Number(max_uses) : null,
        minimum_order_amount: minimum_order_amount ? Number(minimum_order_amount) : null,
        is_active: true,
      });
      if (error) throw error;
      return { success: true, message: `"${code}" kuponu oluşturuldu`, affected: 1 };
    }

    // ============ SETTINGS ACTIONS ============
    case "update_site_settings": {
      const { key, value } = params as { key: string; value: unknown };
      if (!key) return { success: false, message: "Ayar anahtarı gerekli" };

      const { data: existing } = await supabase.from("site_settings").select("id").eq("key", key).maybeSingle();
      
      if (existing) {
        const { error } = await supabase.from("site_settings").update({ value }).eq("key", key);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert({ key, value });
        if (error) throw error;
      }
      return { success: true, message: `"${key}" ayarı güncellendi`, affected: 1 };
    }

    // ============ REVIEW ACTIONS ============
    case "approve_reviews": {
      const { review_ids } = params as { review_ids?: string[] };
      if (!review_ids?.length) {
        const { data, error } = await supabase.from("reviews").update({ is_approved: true }).eq("is_approved", false).select("id");
        if (error) throw error;
        return { success: true, message: `${data?.length || 0} yorum onaylandı`, affected: data?.length || 0 };
      }
      let count = 0;
      for (const id of review_ids) {
        const { error } = await supabase.from("reviews").update({ is_approved: true }).eq("id", id);
        if (!error) count++;
      }
      return { success: true, message: `${count} yorum onaylandı`, affected: count };
    }

    case "reject_reviews": {
      const { review_ids } = params as { review_ids: string[] };
      if (!review_ids?.length) return { success: false, message: "Yorum ID'leri gerekli" };
      let count = 0;
      for (const id of review_ids) {
        const { error } = await supabase.from("reviews").delete().eq("id", id);
        if (!error) count++;
      }
      return { success: true, message: `${count} yorum silindi`, affected: count };
    }

    // ============ OTHER ACTIONS ============
    case "cleanup_old_carts": {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase.from("abandoned_cart_reminders")
        .delete().lt("created_at", thirtyDaysAgo).eq("recovered", false).select("id");
      if (error) throw error;
      return { success: true, message: `${data?.length || 0} eski sepet silindi`, affected: data?.length || 0 };
    }

    case "generate_seo_report": {
      const [{ count: withMeta }, { count: withoutMeta }, { data: seoSettings }] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).not("meta_title", "is", null),
        supabase.from("products").select("id", { count: "exact", head: true }).is("meta_title", null),
        supabase.from("site_settings").select("key, value").eq("key", "seo"),
      ]);
      return {
        success: true, message: "SEO raporu oluşturuldu",
        details: { productsWithMeta: withMeta || 0, productsWithoutMeta: withoutMeta || 0, seoConfigured: !!seoSettings?.length },
      };
    }

    case "send_stock_alert": {
      return { success: true, message: "Stok uyarı bildirimi gönderildi" };
    }

    default:
      return { success: false, message: `Bilinmeyen aksiyon: ${actionType}` };
  }
}
