import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, pageContext, currentPath } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch some DB context for richer answers
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let dbContext = "";

    // Fetch product count and categories for context
    const { count: productCount } = await supabase.from("products").select("id", { count: "exact", head: true });
    const { count: orderCount } = await supabase.from("orders").select("id", { count: "exact", head: true });
    const { data: categories } = await supabase.from("categories").select("name").eq("is_active", true);

    dbContext = `
Mağaza Durumu:
- Toplam Ürün: ${productCount || 0}
- Toplam Sipariş: ${orderCount || 0}
- Kategoriler: ${categories?.map((c: any) => c.name).join(", ") || "Yok"}
`;

    const systemPrompt = `Sen MEDEA doğal kozmetik e-ticaret sitesinin AI yönetim asistanısın. Adın "MEDEA AI".

Görevlerin:
1. Admin panelinde her sayfada yöneticiye yardımcı olmak
2. İçerik oluşturma konusunda öneriler sunmak
3. SEO tavsiyeleri vermek
4. Sayfanın işlevselliğini açıklamak
5. Pazarlama ve satış stratejileri önermek

Şu an admin "${currentPath}" sayfasında.
Sayfa Bilgisi: ${pageContext}

${dbContext}

Kurallar:
- Türkçe yanıt ver
- Kısa, net ve uygulanabilir öneriler sun
- Doğal kozmetik sektörüne özgü içerikler öner
- Markdown formatı kullan (başlıklar, listeler, kalın yazı)
- E-ticaret ve SEO best practice'lerini uygula
- Kullanıcıya yardımcı ol, teknik jargondan kaçın`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
    console.error("admin-ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Bilinmeyen hata" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
