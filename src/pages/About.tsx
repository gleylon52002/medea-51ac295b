import { Link } from "react-router-dom";
import { ChevronRight, Leaf, Heart, Shield, Sparkles, Star, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";

const iconMap: Record<string, React.ElementType> = {
  leaf: Leaf, heart: Heart, shield: Shield, sparkles: Sparkles, star: Star, zap: Zap,
};

interface AboutContent {
  hero_title: string;
  hero_description: string;
  story_title: string;
  story_paragraphs: string[];
  story_image: string;
  values_title: string;
  values: { icon: string; title: string; description: string }[];
  team_title: string;
  team_description: string;
  team_images: string[];
}

const defaults: AboutContent = {
  hero_title: "Doğanın Gücü, Cildinizin Güzelliği",
  hero_description: "MEDEA olarak, doğal kozmetik ürünler üretme tutkusuyla yola çıktık. Her ürünümüz, doğadan özenle seçilmiş içeriklerle, el emeğiyle ve sevgiyle üretilmektedir.",
  story_title: "Hikayemiz",
  story_paragraphs: [
    "2020 yılında İstanbul'da kurulan MEDEA, doğal ve sürdürülebilir kozmetik ürünlere olan ihtiyaçtan doğdu. Kurucumuz, yıllarca kimyasal içerikli ürünlerin cildine verdiği zarardan sonra, tamamen doğal alternatifler aramaya başladı.",
    "Bugün, Ege'nin bereketli topraklarından toplanan bitkileri kullanarak, geleneksel yöntemlerle modern kozmetik bilimini birleştiriyoruz. Her ürünümüz, küçük partiler halinde, titizlikle üretilmektedir.",
    "Amacımız sadece güzel ürünler üretmek değil, aynı zamanda çevreye ve topluma karşı sorumluluklarımızı yerine getirmektir.",
  ],
  story_image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600",
  values_title: "Değerlerimiz",
  values: [
    { icon: "leaf", title: "%100 Doğal", description: "Tüm ürünlerimiz doğal ve organik içeriklerden üretilmektedir." },
    { icon: "heart", title: "Cruelty-Free", description: "Hiçbir ürünümüz hayvanlar üzerinde test edilmemektedir." },
    { icon: "shield", title: "Güvenilir", description: "Tüm ürünlerimiz dermatolojik olarak test edilmiştir." },
    { icon: "sparkles", title: "El Yapımı", description: "Her ürün özenle ve küçük partiler halinde üretilmektedir." },
  ],
  team_title: "Ekibimiz",
  team_description: "MEDEA ailesinde, kozmetik biliminden botanik uzmanlığına kadar farklı alanlarda deneyimli bir ekip yer almaktadır. Ortak tutkumuz, en kaliteli doğal ürünleri sizlerle buluşturmak.",
  team_images: [
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
  ],
};

const About = () => {
  const { data: content } = useQuery({
    queryKey: ["site-settings", "about_page"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "about_page")
        .maybeSingle();
      return (data?.value as unknown as AboutContent) || null;
    },
    staleTime: 1000 * 60 * 5,
  });

  const c = content || defaults;

  return (
    <Layout>
      <div className="container-main py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Hakkımızda</span>
        </nav>

        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="font-serif text-4xl lg:text-5xl font-medium text-foreground mb-6">
            {c.hero_title}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {c.hero_description}
          </p>
        </div>

        {/* Story */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <img
              src={c.story_image}
              alt="MEDEA Atölyesi"
              className="rounded-2xl w-full h-[400px] object-cover"
            />
          </div>
          <div>
            <h2 className="font-serif text-2xl lg:text-3xl font-medium text-foreground mb-6">
              {c.story_title}
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              {c.story_paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="bg-secondary/30 rounded-3xl p-8 lg:p-12 mb-20">
          <h2 className="font-serif text-2xl lg:text-3xl font-medium text-foreground text-center mb-12">
            {c.values_title}
          </h2>
          <div className={`grid sm:grid-cols-2 ${c.values.length <= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-8`}>
            {c.values.map((v, i) => {
              const Icon = iconMap[v.icon] || Sparkles;
              return (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">{v.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team */}
        {c.team_images.length > 0 && (
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="font-serif text-2xl lg:text-3xl font-medium text-foreground mb-6">
              {c.team_title}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              {c.team_description}
            </p>
            <div className={`grid grid-cols-${Math.min(c.team_images.length, 3)} gap-4`}>
              {c.team_images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Ekip üyesi ${i + 1}`}
                  className="rounded-xl w-full aspect-square object-cover"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default About;
