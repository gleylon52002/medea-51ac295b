import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch active products with categories - NO AUTH REQUIRED (public feed)
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, slug, description, short_description, price, sale_price, images, created_at, updated_at, categories:category_id(name)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const { data: settings } = await supabase
      .from("site_settings")
      .select("key, value")
      .eq("key", "general")
      .single();

    const siteName = (settings?.value as any)?.site_name || "MEDEA";
    const siteUrl = "https://medea.tr";

    const rssItems = (products || []).map((product: any) => {
      const imageUrl = product.images?.[0] || "";
      const productUrl = `${siteUrl}/urun/${product.slug}`;
      const price = product.sale_price || product.price;
      const description = product.short_description || product.description || "";
      const cleanDesc = description.replace(/[<>&'"]/g, (c: string) => {
        const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' };
        return map[c] || c;
      });
      const categoryName = product.categories?.name || "";
      const pubDate = new Date(product.created_at).toUTCString();

      return `    <item>
      <title>${product.name.replace(/&/g, '&amp;')}</title>
      <link>${productUrl}</link>
      <description>${cleanDesc}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${productUrl}</guid>
      ${categoryName ? `<category>${categoryName.replace(/&/g, '&amp;')}</category>` : ""}
      ${imageUrl ? `<enclosure url="${imageUrl}" type="image/jpeg" />` : ""}
      <media:content url="${imageUrl}" medium="image" />
      <media:thumbnail url="${imageUrl}" />
      <price>${price} TL</price>
    </item>`;
    }).join("\n");

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteName} - Ürün Beslemesi</title>
    <link>${siteUrl}</link>
    <description>${siteName} ürün kataloğu RSS beslemesi</description>
    <language>tr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${supabaseUrl}/functions/v1/product-rss-feed" rel="self" type="application/rss+xml" />
    <image>
      <url>${siteUrl}/favicon.ico</url>
      <title>${siteName}</title>
      <link>${siteUrl}</link>
    </image>
${rssItems}
  </channel>
</rss>`;

    return new Response(rssXml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/rss+xml; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("RSS feed error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
