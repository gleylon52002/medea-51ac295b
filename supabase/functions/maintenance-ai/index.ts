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
    const { messages, executeAction, actionType, actionParams } = body;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle action execution
    if (executeAction) {
      const result = await executeMaintenanceAction(supabase, actionType, actionParams, LOVABLE_API_KEY);
      return new Response(JSON.stringify(result), {
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
  ] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("categories").select("name, slug, is_active"),
    supabase.from("orders").select("id, order_number, status, total, created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("products").select("id, name, stock, price").lte("stock", 5).gt("stock", 0).order("stock", { ascending: true }).limit(15),
    supabase.from("site_settings").select("key, value"),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false),
    supabase.from("sellers").select("id, store_name, status, reputation_points"),
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
    supabase.from("products").select("id, name, description, slug, category_id, ingredients, short_description, keywords").eq("is_active", true).limit(50),
  ]);

  // Process data
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
  };
}

function buildSystemPrompt(d: Awaited<ReturnType<typeof gatherSystemDiagnostics>>): string {
  return `Sen MEDEA e-ticaret platformunun Bakım AI Sistemisin. Adın "MEDEA Bakım AI". 
Türkçe yanıt ver. Markdown formatı kullan.

## Görevlerin
1. **Sistem Durumu İzleme**: Veritabanı, ayarlar, ürünler, siparişler hakkında anlık durum bilgisi ver
2. **Sorun Giderme**: Admin'in bildirdiği sorunları analiz et, çözüm öner
3. **Aksiyon Önerme**: Yapılması gereken işlemleri aksiyon butonları olarak öner
4. **İçerik Üretimi**: Blog yazıları, ürün açıklamaları, SEO içerikleri oluştur ve veritabanına kaydet
5. **Strateji ve Öneriler**: Satış, SEO, pazarlama stratejileri öner
6. **Toplu İşlemler**: Admin istediğinde toplu güncelleme/silme işlemlerini yönet

## ÖNEMLİ: İÇERİK OLUŞTURMA KOMANDLlARI
Kullanıcı "blog yazısı oluştur", "blog paylaş", "SEO uyumlu blog yaz" gibi bir komut verdiğinde:
1. Mevcut ürün verilerini analiz et
2. Her ürün veya kategori için SEO uyumlu blog yazısı oluşturmak üzere aksiyon butonları öner
3. **MUTLAKA** [ACTION:create_blog_posts:Blog Yazıları Oluştur:Ürünlere dayalı SEO uyumlu blog yazıları oluşturulacak] formatında aksiyon butonu ekle

Kullanıcı "FAQ oluştur", "SSS güncelle" derse:
- [ACTION:generate_faqs:SSS Oluştur:Ürün ve kategori bazlı SSS oluşturulacak] formatında buton ekle

## Aksiyon Butonları Formatı
Kullanıcıya uygulanabilir aksiyonlar önerirken şu formatı kullan:
[ACTION:aksiyon_tipi:Buton Yazısı:Kısa açıklama]

Örnek:
[ACTION:deactivate_out_of_stock:Stoksuz Ürünleri Pasifle:${d.outOfStockProducts.length} ürün pasife alınacak]
[ACTION:create_blog_posts:Blog Yazıları Oluştur:Ürünlere dayalı SEO uyumlu blog yazıları]
[ACTION:generate_product_descriptions:Açıklamaları Güncelle:Eksik ürün açıklamalarını AI ile oluştur]
[ACTION:generate_faqs:SSS Oluştur:Ürün ve site bazlı SSS oluştur]
[ACTION:update_seo_meta:SEO Meta Güncelle:Eksik meta başlık ve açıklamaları doldur]

## Kullanılabilir Aksiyon Tipleri
- deactivate_out_of_stock: Stoku 0 olan aktif ürünleri pasife al
- activate_in_stock: Stoku olan pasif ürünleri aktifleştir  
- send_stock_alert: Düşük stok uyarı e-postası gönder
- generate_seo_report: SEO analiz raporu oluştur
- update_product_tags: Ürün etiketlerini AI ile güncelle
- cleanup_old_carts: Eski terk edilmiş sepetleri temizle
- bulk_price_update: Toplu fiyat güncelleme (params gerekli)
- **create_blog_posts**: Ürünlere dayalı SEO uyumlu blog yazıları oluştur ve yayınla
- **generate_product_descriptions**: Eksik ürün açıklamalarını AI ile oluştur
- **generate_faqs**: Ürün ve kategori bazlı SSS oluştur
- **update_seo_meta**: Eksik SEO meta bilgilerini AI ile doldur

## MEDEA SİSTEM DURUMU (Canlı Veri)

### Özet İstatistikler
- Toplam Ürün: ${d.productCount}
- Toplam Sipariş: ${d.orderCount}
- Bekleyen Sipariş: ${d.pendingOrders}
- Toplam Kullanıcı: ${d.userCount}
- Bugünkü Gelir: ₺${d.todayRevenue.toLocaleString("tr-TR")}
- Haftalık Gelir: ₺${d.weekRevenue.toLocaleString("tr-TR")}
- Toplam Yorum: ${d.reviewCount}
- Okunmamış Mesaj: ${d.messageCount}
- Aktif Kupon: ${d.couponCount}
- Aktif Kampanya: ${d.activeCampaigns}
- **Blog Yazısı: ${d.blogCount}**

### Ürün Listesi (İçerik üretimi için)
${d.products.slice(0, 20).map((p: { name: string; slug: string; description?: string; ingredients?: string; short_description?: string }) => 
  `- ${p.name} (/${p.slug})${p.short_description ? ` - ${p.short_description.substring(0, 60)}` : ''}${p.ingredients ? ` [İçerik: ${p.ingredients.substring(0, 50)}...]` : ''}`
).join("\n") || "Ürün yok"}

### Stok Durumu
**Stoksuz Ürünler (${d.outOfStockProducts.length} adet)**:
${d.outOfStockProducts.map((p: { name: string }) => `- ${p.name}`).join("\n") || "Stoksuz ürün yok ✅"}

**Düşük Stoklu Ürünler (≤5 adet)**:
${d.lowStockProducts.map((p: { name: string; stock: number }) => `- ${p.name}: ${p.stock} adet`).join("\n") || "Düşük stoklu ürün yok ✅"}

### Kategori Durumu
${d.categories.map((c: { name: string; slug: string; is_active: boolean }) => `- ${c.name} (${c.slug}) - ${c.is_active ? "Aktif" : "Pasif"}`).join("\n") || "Kategori yok"}

### Son 10 Sipariş
${d.recentOrders.map((o: { order_number: string; status: string; total: number; created_at: string }) => `- #${o.order_number} | ${o.status} | ₺${o.total} | ${new Date(o.created_at).toLocaleDateString("tr-TR")}`).join("\n") || "Sipariş yok"}

### Satıcılar (Pazaryeri)
- Aktif Satıcı: ${d.activeSellerCount}
- Toplam Satıcı: ${d.sellers.length}
${d.sellers.slice(0, 5).map((s: { store_name: string; status: string; reputation_points: number }) => `  - ${s.store_name}: ${s.status} (${s.reputation_points} puan)`).join("\n") || ""}

### Site Ayarları Durumu
- Genel Ayarlar: ${d.settingsMap.general ? "✅" : "⚠️ Eksik"}
- İletişim Ayarları: ${d.settingsMap.contact ? "✅" : "⚠️ Eksik"}
- Kargo Ayarları: ${d.settingsMap.shipping ? "✅" : "⚠️ Eksik"}
- SEO Ayarları: ${d.settingsMap.seo ? "✅" : "⚠️ Eksik"}

### Zamanlanmış Görevler
${d.maintenanceTasks.map((t: { title: string; action_type: string; is_active: boolean }) => `- ${t.title} (${t.action_type}) - ${t.is_active ? "Aktif" : "Pasif"}`).join("\n") || "Aktif görev yok"}

### Son AI Aksiyonları
${d.recentActionLogs.map((l: { action_type: string; status: string; created_at: string }) => `- ${l.action_type}: ${l.status} (${new Date(l.created_at).toLocaleString("tr-TR")})`).join("\n") || "Henüz aksiyon yok"}

## Kurallar
- Gerçek veriye dayalı yanıtlar ver
- Sorun tespitinde somut çözüm adımları öner
- Uygulanabilir aksiyonlar için [ACTION:...] formatını kullan
- İçerik oluşturma isteklerinde MUTLAKA aksiyon butonu öner, sadece sözel açıklama yapma
- Admin'e saygılı ve profesyonel davran
- Güvenlik konularında dikkatli ol`;
}

async function generateBlogPostsWithAI(
  apiKey: string,
  products: Array<{ name: string; slug: string; description?: string; ingredients?: string; short_description?: string; category_id?: string }>,
  categories: Array<{ name: string; slug: string }>
): Promise<Array<{ title: string; slug: string; content: string; excerpt: string; meta_title: string; meta_description: string; tags: string[] }>> {
  
  const productInfo = products.slice(0, 10).map(p => 
    `- ${p.name}: ${p.short_description || p.description?.substring(0, 100) || 'Açıklama yok'}${p.ingredients ? ` | İçerikler: ${p.ingredients.substring(0, 100)}` : ''}`
  ).join("\n");

  const categoryInfo = categories.map(c => c.name).join(", ");

  const prompt = `Sen bir doğal kozmetik ve cilt bakımı blog yazarısın. MEDEA markası için SEO uyumlu blog yazıları oluştur.

Mevcut ürünler:
${productInfo}

Kategoriler: ${categoryInfo}

Her ürün grubu veya kategori için 1 adet SEO uyumlu blog yazısı oluştur. Toplamda en az 3, en fazla 5 blog yazısı oluştur.

Her blog yazısı için şu JSON formatında çıktı ver:
[
  {
    "title": "Blog başlığı (SEO uyumlu, 50-60 karakter)",
    "slug": "blog-url-slug",
    "content": "Tam blog içeriği (markdown formatında, en az 500 kelime, ürün isimlerini ve faydalarını doğal şekilde içermeli, H2/H3 başlıklar kullanılmalı)",
    "excerpt": "Kısa özet (150-160 karakter)",
    "meta_title": "SEO meta başlığı (50-60 karakter)",
    "meta_description": "SEO meta açıklaması (150-160 karakter)",
    "tags": ["etiket1", "etiket2", "etiket3"]
  }
]

Kurallar:
- Doğal, bilgilendirici ve okuyucu dostu yaz
- Ürün isimlerini doğal şekilde içeriğe yerleştir (reklam gibi değil)
- SEO anahtar kelimeleri doğal kullan
- Her yazı benzersiz ve değerli bilgi içermeli
- Türkçe yaz
- SADECE JSON array döndür, başka hiçbir şey yazma`;

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

  if (!response.ok) {
    throw new Error(`AI blog generation failed: ${response.status}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content?.trim() || "[]";
  
  // Extract JSON from response (might be wrapped in markdown code blocks)
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("AI yanıtından blog verisi çıkarılamadı");
  
  return JSON.parse(jsonMatch[0]);
}

async function executeMaintenanceAction(
  supabase: ReturnType<typeof createClient>, 
  actionType: string, 
  params: Record<string, unknown>,
  apiKey: string
): Promise<{ success: boolean; message: string; affected?: number; details?: unknown }> {
  switch (actionType) {
    case "deactivate_out_of_stock": {
      const { data, error } = await supabase
        .from("products")
        .update({ is_active: false })
        .eq("stock", 0)
        .eq("is_active", true)
        .select("id");
      
      if (error) throw error;
      return { 
        success: true, 
        message: `${data?.length || 0} stoksuz ürün pasife alındı`,
        affected: data?.length || 0
      };
    }

    case "activate_in_stock": {
      const { data, error } = await supabase
        .from("products")
        .update({ is_active: true })
        .gt("stock", 0)
        .eq("is_active", false)
        .select("id");
      
      if (error) throw error;
      return { 
        success: true, 
        message: `${data?.length || 0} ürün aktifleştirildi`,
        affected: data?.length || 0
      };
    }

    case "cleanup_old_carts": {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("abandoned_cart_reminders")
        .delete()
        .lt("created_at", thirtyDaysAgo)
        .eq("recovered", false)
        .select("id");
      
      if (error) throw error;
      return { 
        success: true, 
        message: `${data?.length || 0} eski sepet kaydı silindi`,
        affected: data?.length || 0
      };
    }

    case "generate_seo_report": {
      const [
        { count: productsWithMeta },
        { count: productsWithoutMeta },
        { data: siteSettings },
      ] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).not("meta_title", "is", null),
        supabase.from("products").select("id", { count: "exact", head: true }).is("meta_title", null),
        supabase.from("site_settings").select("key, value").eq("key", "seo"),
      ]);

      return {
        success: true,
        message: "SEO raporu oluşturuldu",
        details: {
          productsWithMeta: productsWithMeta || 0,
          productsWithoutMeta: productsWithoutMeta || 0,
          seoSettingsConfigured: !!siteSettings?.length,
        }
      };
    }

    case "create_blog_posts": {
      // Fetch products and categories for context
      const [{ data: products }, { data: categories }] = await Promise.all([
        supabase.from("products").select("name, slug, description, ingredients, short_description, category_id").eq("is_active", true).limit(20),
        supabase.from("categories").select("name, slug").eq("is_active", true),
      ]);

      if (!products?.length) {
        return { success: false, message: "Blog oluşturmak için aktif ürün bulunamadı" };
      }

      // Generate blog posts with AI
      const blogPosts = await generateBlogPostsWithAI(apiKey, products, categories || []);

      // Insert blog posts into database
      let created = 0;
      const createdTitles: string[] = [];

      for (const post of blogPosts) {
        // Check if slug already exists
        const { data: existing } = await supabase
          .from("blog_posts")
          .select("id")
          .eq("slug", post.slug)
          .maybeSingle();

        if (existing) {
          // Append timestamp to make slug unique
          post.slug = `${post.slug}-${Date.now()}`;
        }

        const { error } = await supabase.from("blog_posts").insert({
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          meta_title: post.meta_title,
          meta_description: post.meta_description,
          tags: post.tags,
          is_published: true,
        });

        if (!error) {
          created++;
          createdTitles.push(post.title);
        } else {
          console.error("Blog insert error:", error);
        }
      }

      return {
        success: true,
        message: `${created} blog yazısı oluşturuldu ve yayınlandı`,
        affected: created,
        details: { titles: createdTitles }
      };
    }

    case "generate_product_descriptions": {
      // Find products without descriptions
      const { data: products } = await supabase
        .from("products")
        .select("id, name, ingredients, short_description, category_id")
        .or("description.is.null,description.eq.")
        .eq("is_active", true)
        .limit(10);

      if (!products?.length) {
        return { success: false, message: "Açıklaması eksik ürün bulunamadı" };
      }

      const prompt = `Bu ürünler için SEO uyumlu, detaylı ürün açıklamaları yaz. Her biri en az 100 kelime olsun.
JSON formatında döndür: [{"id": "ürün_id", "description": "açıklama"}]

Ürünler:
${products.map(p => `- ID: ${p.id} | Ad: ${p.name}${p.ingredients ? ` | İçerik: ${p.ingredients.substring(0, 80)}` : ''}`).join("\n")}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) throw new Error("AI açıklama üretimi başarısız");

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content?.trim() || "[]";
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("AI yanıtı işlenemedi");

      const descriptions = JSON.parse(jsonMatch[0]);
      let updated = 0;

      for (const item of descriptions) {
        const { error } = await supabase
          .from("products")
          .update({ description: item.description })
          .eq("id", item.id);
        if (!error) updated++;
      }

      return { success: true, message: `${updated} ürün açıklaması güncellendi`, affected: updated };
    }

    case "generate_faqs": {
      const [{ data: products }, { data: categories }] = await Promise.all([
        supabase.from("products").select("name, short_description, ingredients").eq("is_active", true).limit(15),
        supabase.from("categories").select("name").eq("is_active", true),
      ]);

      const prompt = `Bir doğal kozmetik e-ticaret sitesi (MEDEA) için SSS (Sıkça Sorulan Sorular) oluştur.

Ürünler: ${products?.map(p => p.name).join(", ") || "Genel"}
Kategoriler: ${categories?.map(c => c.name).join(", ") || "Genel"}

En az 8 SSS oluştur. JSON formatında döndür:
[{"question": "Soru?", "answer": "Detaylı cevap"}]

Konular: Ürün kullanımı, kargo, iade, cilt tipleri, doğal içerikler, saklama koşulları, alerjiler vb.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) throw new Error("AI SSS üretimi başarısız");

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content?.trim() || "[]";
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("AI yanıtı işlenemedi");

      const faqs = JSON.parse(jsonMatch[0]);
      let created = 0;

      for (let i = 0; i < faqs.length; i++) {
        const { error } = await supabase.from("faqs").insert({
          question: faqs[i].question,
          answer: faqs[i].answer,
          sort_order: i,
          is_active: true,
        });
        if (!error) created++;
      }

      return { success: true, message: `${created} SSS oluşturuldu`, affected: created };
    }

    case "update_seo_meta": {
      const { data: products } = await supabase
        .from("products")
        .select("id, name, short_description, ingredients")
        .is("meta_title", null)
        .eq("is_active", true)
        .limit(20);

      if (!products?.length) {
        return { success: false, message: "SEO meta bilgisi eksik ürün bulunamadı" };
      }

      const prompt = `Bu ürünler için SEO meta başlık ve açıklaması oluştur.
JSON formatında döndür: [{"id": "ürün_id", "meta_title": "başlık (max 60 karakter)", "meta_description": "açıklama (max 160 karakter)"}]

Ürünler:
${products.map(p => `- ID: ${p.id} | Ad: ${p.name}${p.short_description ? ` | ${p.short_description.substring(0, 60)}` : ''}`).join("\n")}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) throw new Error("AI SEO meta üretimi başarısız");

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content?.trim() || "[]";
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("AI yanıtı işlenemedi");

      const metas = JSON.parse(jsonMatch[0]);
      let updated = 0;

      for (const item of metas) {
        const { error } = await supabase
          .from("products")
          .update({ meta_title: item.meta_title, meta_description: item.meta_description })
          .eq("id", item.id);
        if (!error) updated++;
      }

      return { success: true, message: `${updated} ürünün SEO meta bilgisi güncellendi`, affected: updated };
    }

    case "bulk_price_update": {
      const { percentage, category_id } = params as { percentage?: number; category_id?: string };
      if (!percentage) {
        return { success: false, message: "Yüzde değeri gerekli" };
      }

      let query = supabase.from("products").select("id, price");
      if (category_id) {
        query = query.eq("category_id", category_id);
      }

      const { data: products, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      let updated = 0;
      for (const product of products || []) {
        const newPrice = product.price * (1 + percentage / 100);
        await supabase.from("products").update({ price: newPrice }).eq("id", product.id);
        updated++;
      }

      return {
        success: true,
        message: `${updated} ürün fiyatı %${percentage} güncellendi`,
        affected: updated
      };
    }

    default:
      return { success: false, message: `Bilinmeyen aksiyon tipi: ${actionType}` };
  }
}
