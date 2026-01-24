import { Link } from "react-router-dom";
import { ArrowRight, Leaf, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-secondary/30">
      <div className="container-main py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
              <Leaf className="h-4 w-4" />
              <span>%100 Doğal İçerikler</span>
            </div>
            
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium leading-tight text-foreground">
              Doğanın Gücünü
              <br />
              <span className="text-primary">Cildinize Taşıyın</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              El yapımı, vegan ve sürdürülebilir kozmetik ürünleriyle cildinize 
              hak ettiği doğal bakımı sunun. Hiçbir zararlı kimyasal içermez.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="gap-2" asChild>
                <Link to="/urunler">
                  Ürünleri Keşfet
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/hakkimizda">Hikayemiz</Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="h-5 w-5 text-terracotta" />
                <span>Vegan & Cruelty-Free</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-5 w-5 text-terracotta" />
                <span>El Yapımı</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Leaf className="h-5 w-5 text-terracotta" />
                <span>Sürdürülebilir</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative animate-fade-in">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-secondary shadow-product">
              <img
                src={heroImage}
                alt="MEDEA Kozmetik Ürünleri"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 sm:bottom-8 sm:-left-8 bg-card p-4 sm:p-6 rounded-xl shadow-medium">
              <div className="text-center">
                <p className="font-serif text-3xl sm:text-4xl font-semibold text-primary">500+</p>
                <p className="text-sm text-muted-foreground mt-1">Mutlu Müşteri</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
