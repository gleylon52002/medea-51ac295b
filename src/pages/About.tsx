import { Link } from "react-router-dom";
import { ChevronRight, Leaf, Heart, Shield, Sparkles } from "lucide-react";
import Layout from "@/components/layout/Layout";

const About = () => {
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
            Doğanın Gücü, Cildinizin Güzelliği
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            MEDEA olarak, doğal kozmetik ürünler üretme tutkusuyla yola çıktık. 
            Her ürünümüz, doğadan özenle seçilmiş içeriklerle, el emeğiyle ve 
            sevgiyle üretilmektedir.
          </p>
        </div>

        {/* Story */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <img
              src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600"
              alt="MEDEA Atölyesi"
              className="rounded-2xl w-full h-[400px] object-cover"
            />
          </div>
          <div>
            <h2 className="font-serif text-2xl lg:text-3xl font-medium text-foreground mb-6">
              Hikayemiz
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                2020 yılında İstanbul'da kurulan MEDEA, doğal ve sürdürülebilir kozmetik 
                ürünlere olan ihtiyaçtan doğdu. Kurucumuz, yıllarca kimyasal içerikli 
                ürünlerin cildine verdiği zarardan sonra, tamamen doğal alternatifler 
                aramaya başladı.
              </p>
              <p>
                Bugün, Ege'nin bereketli topraklarından toplanan bitkileri kullanarak, 
                geleneksel yöntemlerle modern kozmetik bilimini birleştiriyoruz. Her 
                ürünümüz, küçük partiler halinde, titizlikle üretilmektedir.
              </p>
              <p>
                Amacımız sadece güzel ürünler üretmek değil, aynı zamanda çevreye ve 
                topluma karşı sorumluluklarımızı yerine getirmektir.
              </p>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="bg-secondary/30 rounded-3xl p-8 lg:p-12 mb-20">
          <h2 className="font-serif text-2xl lg:text-3xl font-medium text-foreground text-center mb-12">
            Değerlerimiz
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-medium text-foreground mb-2">%100 Doğal</h3>
              <p className="text-sm text-muted-foreground">
                Tüm ürünlerimiz doğal ve organik içeriklerden üretilmektedir.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-medium text-foreground mb-2">Cruelty-Free</h3>
              <p className="text-sm text-muted-foreground">
                Hiçbir ürünümüz hayvanlar üzerinde test edilmemektedir.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-medium text-foreground mb-2">Güvenilir</h3>
              <p className="text-sm text-muted-foreground">
                Tüm ürünlerimiz dermatolojik olarak test edilmiştir.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-medium text-foreground mb-2">El Yapımı</h3>
              <p className="text-sm text-muted-foreground">
                Her ürün özenle ve küçük partiler halinde üretilmektedir.
              </p>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl lg:text-3xl font-medium text-foreground mb-6">
            Ekibimiz
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            MEDEA ailesinde, kozmetik biliminden botanik uzmanlığına kadar farklı 
            alanlarda deneyimli bir ekip yer almaktadır. Ortak tutkumuz, en kaliteli 
            doğal ürünleri sizlerle buluşturmak.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <img
              src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200"
              alt="Ekip üyesi"
              className="rounded-xl w-full aspect-square object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"
              alt="Ekip üyesi"
              className="rounded-xl w-full aspect-square object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200"
              alt="Ekip üyesi"
              className="rounded-xl w-full aspect-square object-cover"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
