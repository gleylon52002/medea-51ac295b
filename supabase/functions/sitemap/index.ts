import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const baseUrl = "https://medea.tr";

    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("is_active", true);

    const { data: categories } = await supabase
      .from("categories")
      .select("slug, updated_at")
      .eq("is_active", true);

    const { data: blogPosts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("is_published", true);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${baseUrl}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
<url><loc>${baseUrl}/urunler</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
<url><loc>${baseUrl}/blog</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
<url><loc>${baseUrl}/hakkimizda</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
<url><loc>${baseUrl}/iletisim</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
<url><loc>${baseUrl}/sss</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`;

    for (const p of (products || [])) {
      xml += `\n<url><loc>${baseUrl}/urun/${p.slug}</loc><lastmod>${p.updated_at?.split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    }

    for (const c of (categories || [])) {
      xml += `\n<url><loc>${baseUrl}/kategori/${c.slug}</loc><lastmod>${c.updated_at?.split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
    }

    for (const b of (blogPosts || [])) {
      xml += `\n<url><loc>${baseUrl}/blog/${b.slug}</loc><lastmod>${b.updated_at?.split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
    }

    xml += `\n</urlset>`;

    return new Response(xml, {
      headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" },
    });
  } catch (e) {
    console.error("sitemap error:", e);
    return new Response("Error generating sitemap", {
      status: 500, headers: corsHeaders,
    });
  }
});
