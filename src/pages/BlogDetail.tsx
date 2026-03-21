import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Calendar, Eye, ArrowLeft, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

const BlogDetail = () => {
  const { slug } = useParams();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        supabase.from("blog_posts").update({ views_count: (data.views_count || 0) + 1 }).eq("id", data.id).then();
      }
      return data;
    },
    enabled: !!slug,
  });

  const { data: taggedProducts } = useQuery({
    queryKey: ["blog-products", post?.product_ids],
    queryFn: async () => {
      if (!post?.product_ids?.length) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, sale_price, images")
        .in("id", post.product_ids);
      if (error) throw error;
      return data;
    },
    enabled: !!post?.product_ids?.length,
  });

  // Article JSON-LD
  useEffect(() => {
    if (!post) return;
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.meta_description || post.excerpt || "",
      image: post.cover_image || "",
      url: `https://medea.tr/blog/${post.slug}`,
      datePublished: post.created_at,
      dateModified: post.updated_at,
      author: { "@type": "Organization", name: "MEDEA Kozmetik" },
      publisher: {
        "@type": "Organization",
        name: "MEDEA Kozmetik",
        logo: { "@type": "ImageObject", url: "https://medea.tr/logo.png" },
      },
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "blog-article-schema";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => { document.getElementById("blog-article-schema")?.remove(); };
  }, [post]);

  if (isLoading) {
    return <Layout><div className="container-main py-12"><div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-1/2" /><div className="h-4 bg-muted rounded w-full" /><div className="h-4 bg-muted rounded w-3/4" /></div></div></Layout>;
  }

  if (!post) {
    return <Layout><div className="container-main py-12 text-center"><h1 className="text-2xl font-bold">Yazı bulunamadı</h1></div></Layout>;
  }

  return (
    <Layout>
      <SEOHead
        title={`${post.meta_title || post.title} | MEDEA Kozmetik Blog`}
        description={post.meta_description || post.excerpt || ""}
        canonical={`https://medea.tr/blog/${post.slug}`}
        ogImage={post.cover_image || undefined}
        ogType="article"
      />
      <div className="container-main py-8 max-w-3xl mx-auto">
        <Link to="/blog" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Blog'a dön
        </Link>

        {post.cover_image && (
          <img src={post.cover_image} alt={post.title} className="w-full rounded-lg mb-6 aspect-video object-cover" loading="lazy" />
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          {(post.tags || []).map((tag: string) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>

        <h1 className="text-3xl font-serif font-bold mb-2">{post.title}</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(post.created_at).toLocaleDateString('tr-TR')}</span>
          <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{post.views_count} görüntüleme</span>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        {/* Tagged Products */}
        {taggedProducts && taggedProducts.length > 0 && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> İlgili Ürünler</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {taggedProducts.map(p => (
                <Link key={p.id} to={`/urun/${p.slug}`} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <img src={p.images?.[0] || "/placeholder.svg"} alt={`MEDEA ${p.name}`} className="w-12 h-12 rounded object-cover" loading="lazy" />
                  <div>
                    <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                    <p className="text-sm text-primary font-semibold">{Number(p.sale_price || p.price).toFixed(2)}₺</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BlogDetail;
