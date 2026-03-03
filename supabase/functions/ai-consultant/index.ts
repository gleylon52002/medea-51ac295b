import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch products from DB for context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: products } = await supabase
      .from("products")
      .select("id, name, slug, description, short_description, price, sale_price, ingredients, usage_instructions, categories(name, slug)")
      .eq("is_active", true)
      .limit(50);

    const { data: tags } = await supabase
      .from("product_tags")
      .select("product_id, tag");

    const { data: faqs } = await supabase
      .from("faqs")
      .select("question, answer")
      .eq("is_active", true);

    const productContext = (products || []).map((p: any) => {
      const productTags = (tags || []).filter((t: any) => t.product_id === p.id).map((t: any) => t.tag);
      return `- ${p.name} (/${p.slug}): ${p.short_description || p.description || ''} | Fiyat: ${p.sale_price || p.price}₺ | İçerikler: ${p.ingredients || 'Belirtilmemiş'} | Etiketler: ${productTags.join(', ') || 'Yok'} | Kategori: ${p.categories?.name || 'Genel'}`;
    }).join("\n");

    const faqContext = (faqs || []).map((f: any) => `S: ${f.question}\nC: ${f.answer}`).join("\n\n");

    let systemPrompt = "";

    if (mode === "faq") {
      systemPrompt = `Sen Medea mağazasının yardımcı chatbot'usun. Türkçe yanıt ver. Müşterilere SSS sorularını yanıtla ve sipariş hakkında bilgi ver.

SSS Veritabanı:
${faqContext}

Ürün Kataloğu:
${productContext}

Kurallar:
- Kısa ve net yanıtlar ver
- Ürün önerirken her zaman ürün linkini "/urun/slug" formatında ver
- Bilmediğin konularda "Bu konuda size yardımcı olamıyorum, lütfen iletişim sayfamızdan bize ulaşın" de
- Sipariş takibi sorulursa hesap sayfasına yönlendir`;
    } else {
      systemPrompt = `Sen Medea'nın AI cilt danışmanısın. Doğal güzellik ve cilt bakımı konusunda uzman bir danışman olarak kullanıcılara yardım ediyorsun. Türkçe yanıt ver.

Görevin:
1. Kullanıcının cilt tipini, sorunlarını ve tercihlerini anla
2. Uygun ürünleri öner (her zaman "/urun/slug" formatında link ver)
3. Kullanım tavsiyeleri sun
4. Doğal içerikler hakkında bilgi ver

Ürün Kataloğu:
${productContext}

Kurallar:
- Tıbbi tavsiye verme, sadece kozmetik öneriler sun
- Her öneride ürün linki ver: [Ürün Adı](/urun/slug)
- Kullanıcının cilt tipine göre kişiselleştirilmiş öneriler sun
- Samimi ve profesyonel bir ton kullan
- Kısa paragraflar ve madde işaretleri kullan`;
    }

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
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Çok fazla istek gönderildi, lütfen biraz bekleyin." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI hizmeti kullanım limiti aşıldı." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI servisi şu an kullanılamıyor" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-consultant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
