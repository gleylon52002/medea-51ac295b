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
      const result = await executeMaintenanceAction(supabase, actionType, actionParams);
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
  };
}

function buildSystemPrompt(d: Awaited<ReturnType<typeof gatherSystemDiagnostics>>): string {
  return `Sen MEDEA e-ticaret platformunun Bakım AI Sistemisin. Adın "MEDEA Bakım AI". 
Türkçe yanıt ver. Markdown formatı kullan.

## Görevlerin
1. **Sistem Durumu İzleme**: Veritabanı, ayarlar, ürünler, siparişler hakkında anlık durum bilgisi ver
2. **Sorun Giderme**: Admin'in bildirdiği sorunları analiz et, çözüm öner
3. **Aksiyon Önerme**: Yapılması gereken işlemleri aksiyon butonları olarak öner
4. **AI Sistemleri Koordinasyonu**: Diğer AI sistemleriyle (Cilt Danışmanı, İçerik Doldurucu, Sayfa Asistanı) entegre çalış
5. **Strateji ve Öneriler**: Satış, SEO, pazarlama stratejileri öner
6. **Toplu İşlemler**: Admin istediğinde toplu güncelleme/silme işlemlerini yönet

## Aksiyon Butonları Formatı
Kullanıcıya uygulanabilir aksiyonlar önerirken şu formatı kullan:
[ACTION:aksiyon_tipi:Buton Yazısı:Kısa açıklama]

Örnek:
[ACTION:deactivate_out_of_stock:Stoksuz Ürünleri Pasifle:${d.outOfStockProducts.length} ürün pasife alınacak]
[ACTION:send_stock_alert:Stok Uyarısı Gönder:Düşük stoklu ürünler için e-posta gönder]
[ACTION:generate_seo_report:SEO Raporu Oluştur:Detaylı SEO analizi yap]
[ACTION:update_product_tags:Etiketleri Güncelle:AI ile ürün etiketlerini optimize et]

## Kullanılabilir Aksiyon Tipleri
- deactivate_out_of_stock: Stoku 0 olan aktif ürünleri pasife al
- activate_in_stock: Stoku olan pasif ürünleri aktifleştir  
- send_stock_alert: Düşük stok uyarı e-postası gönder
- generate_seo_report: SEO analiz raporu oluştur
- update_product_tags: Ürün etiketlerini AI ile güncelle
- cleanup_old_carts: Eski terk edilmiş sepetleri temizle
- bulk_price_update: Toplu fiyat güncelleme (params gerekli)

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

### AI Sistemleri
- 🤖 MEDEA AI Asistan: Admin panelinde sağ altta aktif
- 🧴 Cilt Danışmanı AI: Müşteri chatbot'u
- ✨ AI İçerik Doldurucu: Ürün formlarında AI doldurma
- 🔧 Bakım AI (bu sistem): Sistem yönetimi ve sorun giderme

## Kurallar
- Gerçek veriye dayalı yanıtlar ver
- Sorun tespitinde somut çözüm adımları öner
- Uygulanabilir aksiyonlar için [ACTION:...] formatını kullan
- Admin'e saygılı ve profesyonel davran
- Güvenlik konularında dikkatli ol`;
}

async function executeMaintenanceAction(
  supabase: ReturnType<typeof createClient>, 
  actionType: string, 
  params: Record<string, unknown>
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
      // Gather SEO metrics
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
