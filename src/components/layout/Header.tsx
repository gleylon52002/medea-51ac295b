import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Menu, X, Search, User, LogOut, Settings, Store, BookOpen } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories } from "@/hooks/useCategories";
import { useGeneralSettings } from "@/hooks/useSiteSettings";
import { useSellerStatus } from "@/hooks/useSeller";
import { toast } from "sonner";
import SearchDialog from "@/components/search/SearchDialog";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { cart, setIsCartOpen } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const { data: categories } = useCategories();
  const { data: generalSettings } = useGeneralSettings();
  const { data: sellerStatus } = useSellerStatus();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Başarıyla çıkış yapıldı");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container-main">
        <div className="flex h-16 items-center justify-between lg:h-20">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 -ml-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menü"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            {generalSettings?.logo_url ? (
              <img
                src={generalSettings.logo_url}
                alt={generalSettings?.site_name || "Logo"}
                className="h-8 lg:h-10 max-w-[150px] object-contain"
              />
            ) : (
              <h1 className="font-serif text-2xl lg:text-3xl font-semibold tracking-wide text-primary">
                {generalSettings?.site_name || "MEDEA"}
              </h1>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/urunler" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Tüm Ürünler
            </Link>
            {categories?.slice(0, 4).map((category) => (
              <Link
                key={category.id}
                to={`/kategori/${category.slug}`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {category.name}
              </Link>
            ))}
            <Link to="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Blog
            </Link>
          </nav>

          {/* Right side icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-5 w-5" />
            </Button>
            <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/hesabim" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Hesabım
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Paneli
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {sellerStatus?.type === "seller" ? (
                    <DropdownMenuItem asChild>
                      <Link to="/satici" className="cursor-pointer">
                        <Store className="mr-2 h-4 w-4" />
                        Satıcı Paneli
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link to="/giris?tab=seller" className="cursor-pointer">
                        <Store className="mr-2 h-4 w-4" />
                        Satıcı Ol
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" asChild>
                <Link to="/giris">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="h-5 w-5" />
              {cart.itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                  {cart.itemCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background animate-fade-in">
          <nav className="container-main py-4 space-y-1">
            <Link to="/urunler" className="block py-3 text-base font-medium text-foreground" onClick={() => setIsMenuOpen(false)}>
              Tüm Ürünler
            </Link>
            {categories?.map((category) => (
              <Link
                key={category.id}
                to={`/kategori/${category.slug}`}
                className="block py-3 text-base text-muted-foreground hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                {category.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-border">
              <Link to="/blog" className="block py-3 text-base text-muted-foreground hover:text-foreground" onClick={() => setIsMenuOpen(false)}>
                Blog
              </Link>
              <Link to="/hakkimizda" className="block py-3 text-base text-muted-foreground hover:text-foreground" onClick={() => setIsMenuOpen(false)}>
                Hakkımızda
              </Link>
              <Link to="/iletisim" className="block py-3 text-base text-muted-foreground hover:text-foreground" onClick={() => setIsMenuOpen(false)}>
                İletişim
              </Link>
              {isAdmin && (
                <Link to="/admin" className="block py-3 text-base text-primary font-medium" onClick={() => setIsMenuOpen(false)}>
                  Admin Paneli
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
