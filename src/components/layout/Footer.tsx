import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-main py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <h2 className="font-serif text-2xl font-semibold mb-4">MEDEA</h2>
            <p className="text-primary-foreground/80 text-sm leading-relaxed mb-6">
              Doğanın gücünü cildinize taşıyoruz. El yapımı, doğal ve sürdürülebilir kozmetik ürünleri.
            </p>
            <div className="flex gap-4">
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
                <Link to="/blog" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Blog
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
                <Link to="/gizlilik" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link to="/mesafeli-satis" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Mesafeli Satış Sözleşmesi
                </Link>
              </li>
              <li>
                <Link to="/iade" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  İade ve İptal
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
                  Kadıköy, İstanbul, Türkiye
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 flex-shrink-0 text-primary-foreground/60" />
                <a href="tel:+902121234567" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  +90 212 123 45 67
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 flex-shrink-0 text-primary-foreground/60" />
                <a href="mailto:info@medea.com.tr" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  info@medea.com.tr
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/20">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-primary-foreground/60">
              © 2024 MEDEA. Tüm hakları saklıdır.
            </p>
            <div className="flex items-center gap-4">
              <img src="/placeholder.svg" alt="Visa" className="h-6 opacity-60" />
              <img src="/placeholder.svg" alt="Mastercard" className="h-6 opacity-60" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
