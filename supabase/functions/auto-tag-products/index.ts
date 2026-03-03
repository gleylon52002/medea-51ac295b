import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get product details
    const { data: product, error } = await supabase
      .from("products")
      .select("id, name, description, short_description, ingredients, usage_instructions")
      .eq("id", product_id)
      .single();

    if (error || !product) {
      return new Response(JSON.stringify({ error: "Ürün bulunamadı" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Aşağıdaki ürün bilgilerine göre uygun etiketleri belirle. SADECE uygun olan etiketleri JSON dizisi olarak döndür, başka bir şey yazma.

Olası etiketler: "vegan", "doğal", "organik", "el yapımı", "plastik içermez", "kuru cilt", "yağlı cilt", "karma cilt", "hassas cilt", "anti-aging", "nemlendirici", "arındırıcı", "hediye uygun", "bebek uygun", "erkek bakım", "saç bakım", "vücut bakım", "yüz bakım"

Ürün: ${product.name}
Açıklama: ${product.description || product.short_description || ''}
İçerikler: ${product.ingredients || 'Belirtilmemiş'}
Kullanım: ${product.usage_instructions || ''}

Yanıt formatı: ["etiket1", "etiket2"]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Sen bir ürün etiketleme uzmanısın. Sadece JSON dizisi döndür." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI servisi kullanılamıyor" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";

    // Extract JSON array from response
    const jsonMatch = content.match(/\[.*\]/s);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "AI yanıtı ayrıştırılamadı", raw: content }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tagsArray: string[] = JSON.parse(jsonMatch[0]);

    // Remove old auto tags
    await supabase.from("product_tags").delete().eq("product_id", product_id).eq("is_auto", true);

    // Insert new auto tags
    if (tagsArray.length > 0) {
      const tagRows = tagsArray.map((tag: string) => ({
        product_id,
        tag: tag.toLowerCase().trim(),
        is_auto: true,
      }));

      await supabase.from("product_tags").upsert(tagRows, { onConflict: "product_id,tag" });
    }

    // Calculate sustainability score
    const sustainabilityTags = ["vegan", "doğal", "organik", "plastik içermez", "el yapımı"];
    const score = tagsArray.filter((t: string) => sustainabilityTags.includes(t.toLowerCase())).length * 20;
    await supabase.from("products").update({ sustainability_score: Math.min(score, 100) }).eq("id", product_id);

    return new Response(JSON.stringify({ tags: tagsArray, sustainability_score: Math.min(score, 100) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("auto-tag error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
