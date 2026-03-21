import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Leaf, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";
import TranslatedText from "@/components/TranslatedText";

interface HeroSettings {
  type: "image" | "video";
  image_url: string;
  video_url: string;
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
}

const defaultHero: HeroSettings = {
  type: "image",
  image_url: "",
  video_url: "",
  title: "Doğanın Gücünü Cildinize Taşıyın",
  subtitle: "El yapımı, vegan ve sürdürülebilir kozmetik ürünleriyle cildinize hak ettiği doğal bakımı sunun. Hiçbir zararlı kimyasal içermez.",
  cta_text: "Ürünleri Keşfet",
  cta_link: "/urunler",
};

const Hero = () => {
  const { data: heroSettings } = useQuery({
    queryKey: ["site-settings", "hero"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "hero")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data?.value as unknown as HeroSettings | undefined;
    },
  });

  const hero = heroSettings || defaultHero;
  const displayImage = hero.image_url || heroImage;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-secondary/30">
      <div className="container-main py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
              <Leaf className="h-4 w-4" />
              <TranslatedText textKey="hero.badge" originalText="%100 Doğal İçerikler" />
            </div>
            
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium leading-tight text-foreground">
              Doğal & El Yapımı Sabunlar – MEDEA Kozmetik
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              <TranslatedText textKey="hero.subtitle" originalText={hero.subtitle} as="span" />
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="gap-2" asChild>
                <Link to={hero.cta_link}>
                  <TranslatedText textKey="hero.cta" originalText={hero.cta_text} />
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/hakkimizda">
                  <TranslatedText textKey="hero.story" originalText="Hikayemiz" />
                </Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="h-5 w-5 text-terracotta" />
                <TranslatedText textKey="hero.vegan" originalText="Vegan & Cruelty-Free" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-5 w-5 text-terracotta" />
                <TranslatedText textKey="hero.handmade" originalText="El Yapımı" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Leaf className="h-5 w-5 text-terracotta" />
                <TranslatedText textKey="hero.sustainable" originalText="Sürdürülebilir" />
              </div>
            </div>
          </div>

          {/* Hero Image/Video */}
          <div className="relative animate-fade-in">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-secondary shadow-product">
              {hero.type === "video" && hero.video_url ? (
                hero.video_url.includes("youtube") || hero.video_url.includes("youtu.be") ? (
                  <iframe
                    src={hero.video_url}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={hero.video_url}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                )
              ) : (
                <img
                  src={displayImage}
                  alt="MEDEA Kozmetik Ürünleri"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 sm:bottom-8 sm:-left-8 bg-card p-4 sm:p-6 rounded-xl shadow-medium">
              <div className="text-center">
                <p className="font-serif text-3xl sm:text-4xl font-semibold text-primary">500+</p>
                <p className="text-sm text-muted-foreground mt-1">
                  <TranslatedText textKey="hero.happy_customers" originalText="Mutlu Müşteri" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
