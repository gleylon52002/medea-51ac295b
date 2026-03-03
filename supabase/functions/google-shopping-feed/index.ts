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

    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, slug, description, price, sale_price, images, stock, categories(name)")
      .eq("is_active", true);

    if (error) throw error;

    const baseUrl = req.headers.get("origin") || "https://medea.lovable.app";

    // Google Shopping XML feed
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
<title>Medea - Doğal Güzellik Ürünleri</title>
<link>${baseUrl}</link>
<description>Medea doğal güzellik ve bakım ürünleri</description>`;

    for (const p of (products || [])) {
      const price = p.sale_price || p.price;
      const imageUrl = p.images?.[0] || `${baseUrl}/placeholder.svg`;
      const category = (p.categories as any)?.name || "Bakım";

      xml += `
<item>
  <g:id>${p.id}</g:id>
  <g:title><![CDATA[${p.name}]]></g:title>
  <g:description><![CDATA[${(p.description || p.name).slice(0, 5000)}]]></g:description>
  <g:link>${baseUrl}/urun/${p.slug}</g:link>
  <g:image_link>${imageUrl}</g:image_link>
  <g:price>${Number(p.price).toFixed(2)} TRY</g:price>
  ${p.sale_price ? `<g:sale_price>${Number(p.sale_price).toFixed(2)} TRY</g:sale_price>` : ""}
  <g:availability>${p.stock > 0 ? "in_stock" : "out_of_stock"}</g:availability>
  <g:condition>new</g:condition>
  <g:brand>Medea</g:brand>
  <g:product_type><![CDATA[${category}]]></g:product_type>
</item>`;
    }

    xml += `
</channel>
</rss>`;

    return new Response(xml, {
      headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" },
    });
  } catch (e) {
    console.error("google-shopping-feed error:", e);
    return new Response(JSON.stringify({ error: "Feed generation failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
