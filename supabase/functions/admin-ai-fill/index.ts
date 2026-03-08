import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { field, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompts: Record<string, string> = {
      short_description: `Aşağıdaki ürün bilgilerini kullanarak, e-ticaret ürün listesinde kullanılacak kısa, dikkat çekici ve SEO uyumlu bir kısa açıklama yaz (max 150 karakter). Sadece açıklamayı yaz, başka bir şey yazma.

Ürün Bilgileri:
${context}`,

      description: `Aşağıdaki ürün bilgilerini kullanarak, doğal kozmetik e-ticaret sitesine uygun, detaylı ve ikna edici bir ürün açıklaması yaz. HTML kullanma, düz metin yaz. Paragraflar halinde, ürünün faydalarını ve özelliklerini vurgula. Sadece açıklamayı yaz.

Ürün Bilgileri:
${context}`,

      ingredients: `Aşağıdaki ürün bilgilerini kullanarak, bu doğal kozmetik ürünün olası içeriklerini (INCI formatında) listele. Gerçekçi ve doğal içerikler kullan. Sadece içerik listesini yaz.

Ürün Bilgileri:
${context}`,

      usage_instructions: `Aşağıdaki ürün bilgilerini kullanarak, kullanıcıya yönelik net ve anlaşılır kullanım talimatı yaz. Adım adım açıkla. Sadece talimatı yaz.

Ürün Bilgileri:
${context}`,

      keywords: `Aşağıdaki ürün bilgilerini kullanarak, SEO için en uygun 5-8 anahtar kelimeyi virgülle ayırarak yaz. Türkçe ve alakalı kelimeler kullan. Sadece anahtar kelimeleri yaz.

Ürün Bilgileri:
${context}`,

      meta_title: `Aşağıdaki ürün bilgilerini kullanarak, SEO uyumlu bir meta başlık yaz (max 60 karakter). "| MEDEA" sonekini ekle. Sadece başlığı yaz.

Ürün Bilgileri:
${context}`,

      meta_description: `Aşağıdaki ürün bilgilerini kullanarak, SEO uyumlu bir meta açıklama yaz (max 160 karakter). Kullanıcıyı tıklamaya teşvik edecek şekilde yaz. Sadece açıklamayı yaz.

Ürün Bilgileri:
${context}`,

      // Generic fallback for any field
      generic: `Aşağıdaki bağlamı kullanarak, "${field}" alanı için uygun bir içerik oluştur. Türkçe yaz, kısa ve öz ol. Sadece içeriği yaz.

Bağlam:
${context}`,
    };

    const prompt = prompts[field] || prompts.generic;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Sen bir e-ticaret içerik uzmanısın. Doğal kozmetik ürünleri konusunda uzmanlaşmışsın. Verilen talimatları tam olarak takip et, ekstra açıklama ekleme." },
          { role: "user", content: prompt },
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
    console.error("admin-ai-fill error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Bilinmeyen hata" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
