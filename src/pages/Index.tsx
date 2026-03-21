import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import Categories from "@/components/home/Categories";
import Newsletter from "@/components/home/Newsletter";
import TrustBadges from "@/components/products/TrustBadges";
import RecentPurchaseToast from "@/components/products/RecentPurchaseToast";
import RecentlyViewed from "@/components/products/RecentlyViewed";
import Campaigns from "@/components/home/Campaigns";
import CampaignPopup from "@/components/home/CampaignPopup";
import FirstOrderBanner from "@/components/home/FirstOrderBanner";
import AIRecommendations from "@/components/products/AIRecommendations";
import SEOHead from "@/components/SEOHead";
import BlogPreview from "@/components/home/BlogPreview";
import { Link } from "react-router-dom";
import { Leaf, Hand, ShieldCheck, Heart, HelpCircle } from "lucide-react";

const whyMedeaItems = [
  { icon: Leaf, title: "Doğal İçerikler", desc: "Tüm ürünlerimiz doğadan özenle seçilmiş ham maddelerle üretilir. Zararlı kimyasal içermez." },
  { icon: Hand, title: "El Yapımı Üretim", desc: "Her sabun tek tek el emeğiyle, küçük partiler halinde özenle üretilir." },
  { icon: ShieldCheck, title: "Kimyasal Katkısız", desc: "Paraben, SLS, silikon ve yapay koku içermez. Cildinize sadece doğallık sunar." },
  { icon: Heart, title: "Cilde Dost Formül", desc: "Hassas ciltler dahil tüm cilt tipleri için uygundur. Vegan ve cruelty-free." },
];

const faqItems = [
  { q: "Doğal sabun ne işe yarar?", a: "Doğal sabunlar, cildinizi kimyasal katkı maddeleri olmadan nazikçe temizler. İçerdiği bitkisel yağlar ve doğal özler sayesinde cildi besler, nemlendirir ve korur. Hassas ciltler için idealdir." },
  { q: "El yapımı sabun normal sabundan farkı nedir?", a: "El yapımı sabunlar, endüstriyel sabunların aksine gliserin içeriklerini korur. Soğuk presleme yöntemiyle üretilir, doğal nemlendirici özellikleri sayesinde cildi kurutmaz. Kimyasal koruyucu ve yapay koku barındırmaz." },
  { q: "MEDEA sabunları hangi içeriklerden yapılır?", a: "MEDEA sabunları zeytinyağı, hindistancevizi yağı, shea yağı gibi doğal bitkisel yağlar ve her ürüne özel doğal esanslar, bitkisel özler kullanılarak üretilir. Tüm içerikler %100 doğaldır." },
  { q: "Doğal sabun sivilceye iyi gelir mi?", a: "Evet, özellikle aktif karbonlu ve çay ağacı yağlı doğal sabunlar sivilce ve siyah nokta oluşumunu azaltmaya yardımcı olur. Gözenekleri derinlemesine temizler ve cildi doğal yollarla arındırır." },
];

const Index = () => {
  // FAQ Schema JSON-LD
  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map(item => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "homepage-faq-schema";
    script.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(script);
    return () => { document.getElementById("homepage-faq-schema")?.remove(); };
  }, []);

  return (
    <Layout>
      <SEOHead
        title="Doğal El Yapımı Sabun & Kozmetik | MEDEA Kozmetik"
        description="MEDEA Kozmetik – El yapımı doğal katı sabun, yüz maskesi ve mum. Kimyasal katkısız, vegan, cilde dost formüller. Ücretsiz kargo fırsatıyla hemen keşfedin!"
        canonical="https://medea.tr"
        keywords={["doğal sabun", "el yapımı sabun", "doğal katı sabun", "doğal kozmetik", "MEDEA sabun", "organik sabun Türkiye", "şeffaf banyo sabunu"]}
      />
      <Hero />
      <FeaturedProducts />
      <FirstOrderBanner />
      <Campaigns />

      {/* Neden MEDEA Section */}
      <section className="bg-secondary/30 py-16">
        <div className="container-main">
          <h2 className="font-serif text-3xl lg:text-4xl font-medium text-center mb-12">Neden MEDEA?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyMedeaItems.map((item) => (
              <div key={item.title} className="text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Features />
      <div className="container-main py-12">
        <TrustBadges variant="horizontal" />
      </div>
      <Categories />
      <div className="container-main">
        <AIRecommendations title="Size Özel Öneriler" />
      </div>
      <BlogPreview />
      <div className="container-main">
        <RecentlyViewed />
      </div>

      {/* FAQ Section */}
      <section className="bg-secondary/20 py-16">
        <div className="container-main max-w-3xl">
          <h2 className="font-serif text-3xl font-medium text-center mb-8">Sıkça Sorulan Sorular</h2>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <details key={i} className="bg-card rounded-lg border p-4 group">
                <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                  {item.q}
                  <HelpCircle className="h-5 w-5 text-muted-foreground group-open:text-primary transition-colors flex-shrink-0 ml-2" />
                </summary>
                <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link to="/sss" className="text-primary hover:underline text-sm font-medium">
              Tüm soruları görüntüle →
            </Link>
          </div>
        </div>
      </section>

      <Newsletter />
      <RecentPurchaseToast />
      <CampaignPopup />
    </Layout>
  );
};

export default Index;
