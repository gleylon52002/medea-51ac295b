import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { texts, target_lang, content_type = "general" } = await req.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0 || !target_lang) {
      return new Response(JSON.stringify({ error: "texts (array) and target_lang required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate content keys from text (md5-like hash using simple approach)
    const contentKeys = texts.map((t: { key: string; text: string }) => t.key);

    // Check cache first
    const { data: cached } = await supabase
      .from("translations")
      .select("content_key, translated_text")
      .eq("target_lang", target_lang)
      .in("content_key", contentKeys);

    const cachedMap = new Map((cached || []).map(c => [c.content_key, c.translated_text]));
    const uncached = texts.filter((t: { key: string; text: string }) => !cachedMap.has(t.key));

    // If all cached, return immediately
    if (uncached.length === 0) {
      const results: Record<string, string> = {};
      texts.forEach((t: { key: string }) => { results[t.key] = cachedMap.get(t.key)!; });
      return new Response(JSON.stringify({ translations: results, from_cache: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Translate uncached texts using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const langNames: Record<string, string> = {
      en: "English", de: "German", fr: "French", es: "Spanish",
      ar: "Arabic", ru: "Russian", ja: "Japanese", zh: "Chinese",
      ko: "Korean", it: "Italian", pt: "Portuguese", nl: "Dutch",
      tr: "Turkish",
    };

    const targetLangName = langNames[target_lang] || target_lang;
    
    // Build translation prompt
    const textsToTranslate = uncached.map((t: { key: string; text: string }, i: number) => 
      `[${i}] ${t.text}`
    ).join("\n");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Translate the following texts from Turkish to ${targetLangName}. 
Keep the same numbering format [0], [1], etc. 
Preserve any HTML tags, markdown, or special formatting.
Keep brand names and technical terms as-is.
Return ONLY the translations, one per line, with the same [index] prefix.
Do not add any explanation.`
          },
          { role: "user", content: textsToTranslate }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const translatedContent = aiData.choices?.[0]?.message?.content || "";

    // Parse translations
    const translatedLines = translatedContent.split("\n").filter((l: string) => l.trim());
    const newTranslations = new Map<string, string>();

    for (const line of translatedLines) {
      const match = line.match(/^\[(\d+)\]\s*(.+)$/);
      if (match) {
        const idx = parseInt(match[1]);
        if (idx < uncached.length) {
          newTranslations.set(uncached[idx].key, match[2].trim());
        }
      }
    }

    // If parsing failed for some, use original text
    uncached.forEach((t: { key: string; text: string }, i: number) => {
      if (!newTranslations.has(t.key)) {
        // Try to get by line index
        if (i < translatedLines.length) {
          const cleaned = translatedLines[i].replace(/^\[\d+\]\s*/, "").trim();
          if (cleaned) newTranslations.set(t.key, cleaned);
        }
      }
    });

    // Save to cache
    const upsertRows = Array.from(newTranslations.entries()).map(([key, translated]) => {
      const original = uncached.find((t: { key: string }) => t.key === key);
      return {
        source_lang: "tr",
        target_lang,
        content_key: key,
        content_type,
        source_text: original?.text || "",
        translated_text: translated,
      };
    });

    if (upsertRows.length > 0) {
      await supabase.from("translations").upsert(upsertRows, {
        onConflict: "source_lang,target_lang,content_key",
      });
    }

    // Build final results
    const results: Record<string, string> = {};
    texts.forEach((t: { key: string; text: string }) => {
      results[t.key] = cachedMap.get(t.key) || newTranslations.get(t.key) || t.text;
    });

    return new Response(JSON.stringify({ translations: results, from_cache: false, translated_count: newTranslations.size }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("translate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
