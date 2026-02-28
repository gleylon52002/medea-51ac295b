import { Link } from "react-router-dom";
import { Shield, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter, Youtube, Music2, Linkedin, MessageCircle, Send } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface SocialMediaLink {
  id: string;
  platform: string;
  url: string;
  icon_name: string | null;
  is_active: boolean;
}

interface ContactSettings {
  email: string;
  phone: string;
  address: string;
}

interface FooterSettings {
  description: string;
  copyright: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Music2,
  Linkedin,
  MessageCircle,
  Send,
};

const Footer = () => {
  const { data: socialLinks } = useQuery({
    queryKey: ["social-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_media_links")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as SocialMediaLink[];
    },
  });

  const { data: contactSettings } = useQuery({
    queryKey: ["site-settings", "contact"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "contact")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data?.value as unknown as ContactSettings | undefined;
    },
  });

  const { data: footerSettings } = useQuery({
    queryKey: ["site-settings", "footer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "footer")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data?.value as unknown as FooterSettings | undefined;
    },
  });

  const contact = contactSettings || {
    email: "info@medea.com.tr",
    phone: "+90 212 123 45 67",
    address: "Kadıköy, İstanbul, Türkiye",
  };

  const footer = footerSettings || {
    description: "Doğanın gücünü cildinize taşıyoruz. El yapımı, doğal ve sürdürülebilir kozmetik ürünleri.",
    copyright: `© ${new Date().getFullYear()} MEDEA. Tüm hakları saklıdır.`,
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName) return null;
    return iconMap[iconName] || null;
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-main py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <h2 className="font-serif text-2xl font-semibold mb-4">MEDEA</h2>
            <p className="text-primary-foreground/80 text-sm leading-relaxed mb-6">
              {footer.description}
            </p>
            <div className="flex flex-wrap gap-3">
              {socialLinks?.map((link) => {
                const IconComponent = getIcon(link.icon_name);
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                    title={link.platform}
                  >
                    {IconComponent ? (
                      <IconComponent className="h-5 w-5" />
                    ) : (
                      <span className="text-xs">{link.platform.charAt(0)}</span>
                    )}
                  </a>
                );
              })}
              {!socialLinks?.length && (
                <>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wider mb-4">
              Hızlı Bağlantılar
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/urunler" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Tüm Ürünler
                </Link>
              </li>
              <li>
                <Link to="/hakkimizda" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link to="/iletisim" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  İletişim
                </Link>
              </li>
              <li>
                <Link to="/sss" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Sık Sorulan Sorular
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wider mb-4">
              Yasal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/kvkk" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  KVKK Aydınlatma Metni
                </Link>
              </li>
              <li>
                <Link to="/gizlilik-politikasi" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link to="/mesafeli-satis-sozlesmesi" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Mesafeli Satış Sözleşmesi
                </Link>
              </li>
              <li>
                <Link to="/iade-ve-iptal" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  İade ve İptal
                </Link>
              </li>
              <li>
                <Link to="/cerez-politikasi" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Çerez Politikası
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wider mb-4">
              İletişim
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5 text-primary-foreground/60" />
                <span className="text-sm text-primary-foreground/80">
                  {contact.address}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 flex-shrink-0 text-primary-foreground/60" />
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  {contact.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 flex-shrink-0 text-primary-foreground/60" />
                <a href={`mailto:${contact.email}`} className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  {contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/20">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-primary-foreground/60">
              {footer.copyright}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-primary-foreground/60">
                <Lock className="h-4 w-4" />
                <span className="text-xs">SSL Güvenli</span>
              </div>
              <div className="flex items-center gap-1.5 text-primary-foreground/60">
                <Shield className="h-4 w-4" />
                <span className="text-xs">256-bit Şifreleme</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
