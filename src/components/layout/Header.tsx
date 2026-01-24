import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Menu, X, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { categories } from "@/data/products";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cart, setIsCartOpen } = useCart();

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
            <h1 className="font-serif text-2xl lg:text-3xl font-semibold tracking-wide text-primary">
              MEDEA
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link
              to="/urunler"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Tüm Ürünler
            </Link>
            {categories.slice(0, 4).map((category) => (
              <Link
                key={category.id}
                to={`/kategori/${category.slug}`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {category.name}
              </Link>
            ))}
          </nav>

          {/* Right side icons */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link to="/hesabim">
                <User className="h-5 w-5" />
              </Link>
            </Button>
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
            <Link
              to="/urunler"
              className="block py-3 text-base font-medium text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              Tüm Ürünler
            </Link>
            {categories.map((category) => (
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
              <Link
                to="/hakkimizda"
                className="block py-3 text-base text-muted-foreground hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Hakkımızda
              </Link>
              <Link
                to="/iletisim"
                className="block py-3 text-base text-muted-foreground hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                İletişim
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
