import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const BlogPreview = () => {
  const { data: posts } = useQuery({
    queryKey: ["blog-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, cover_image, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  if (!posts || posts.length === 0) return null;

  return (
    <section className="container-main py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-2xl lg:text-3xl font-semibold">Blog</h2>
          <p className="text-muted-foreground mt-1">Doğal bakım hakkında bilgi edinin</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/blog" className="gap-2">
            Tümünü Gör <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            key={post.id}
            to={`/blog/${post.slug}`}
            className="group bg-card rounded-xl overflow-hidden border hover:shadow-medium transition-all"
          >
            {post.cover_image ? (
              <img src={post.cover_image} alt={post.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-48 bg-muted flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-2">
                {new Date(post.created_at).toLocaleDateString("tr-TR")}
              </p>
              <h3 className="font-serif text-lg font-medium line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{post.excerpt}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default BlogPreview;
