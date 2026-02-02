import { Link, useLocation, Outlet } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  ShoppingCart, 
  Users, 
  MessageSquare, 
  Settings, 
  Truck,
  CreditCard,
  LogOut,
  ChevronLeft,
  Tag,
  Mail,
  Newspaper,
  Percent,
  HelpCircle,
  Share2,
  Palette,
  Search,
  Image
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Package, label: "Ürünler", path: "/admin/urunler" },
  { icon: FolderTree, label: "Kategoriler", path: "/admin/kategoriler" },
  { icon: ShoppingCart, label: "Siparişler", path: "/admin/siparisler" },
  { icon: Users, label: "Kullanıcılar", path: "/admin/kullanicilar" },
  { icon: MessageSquare, label: "Yorumlar", path: "/admin/yorumlar" },
  { icon: Tag, label: "Kuponlar", path: "/admin/kuponlar" },
  { icon: Percent, label: "Kampanyalar", path: "/admin/kampanyalar" },
  { icon: Mail, label: "Mesajlar", path: "/admin/mesajlar" },
  { icon: Newspaper, label: "Bülten", path: "/admin/bulten" },
  { icon: HelpCircle, label: "SSS", path: "/admin/sss" },
  { icon: Share2, label: "Sosyal Medya", path: "/admin/sosyal-medya" },
  { icon: Truck, label: "Kargo", path: "/admin/kargo" },
  { icon: CreditCard, label: "Ödeme", path: "/admin/odeme" },
  { icon: Image, label: "Hero", path: "/admin/hero" },
  { icon: Palette, label: "Tema", path: "/admin/tema" },
  { icon: Search, label: "SEO", path: "/admin/seo" },
  { icon: Settings, label: "Ayarlar", path: "/admin/ayarlar" },
];

const AdminLayout = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <Link to="/admin" className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold text-primary">MEDEA</span>
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">Admin</span>
          </Link>
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== "/admin" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-border space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Siteye Dön
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 text-muted-foreground hover:text-foreground"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
