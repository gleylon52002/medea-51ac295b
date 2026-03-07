import { useState } from "react";
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
  Image,
  Menu,
  X,
  Store,
  UserCheck,
  Sliders,
  FileText,
  Star,
  Ticket,
  Activity,
  Smartphone,
  TrendingDown,
  Rss,
  Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Package, label: "Ürünler", path: "/admin/urunler" },
  { icon: FolderTree, label: "Kategoriler", path: "/admin/kategoriler" },
  { icon: ShoppingCart, label: "Siparişler", path: "/admin/siparisler" },
  { icon: Users, label: "Kullanıcılar", path: "/admin/kullanicilar" },
  { icon: Star, label: "Yorumlar", path: "/admin/yorumlar" },
  { icon: MessageSquare, label: "Mesajlar", path: "/admin/mesajlar" },
  { icon: Mail, label: "İletişim Mesajları", path: "/admin/bulten-mesajlari" },
  { icon: Ticket, label: "Kuponlar", path: "/admin/kuponlar" },
  { icon: Percent, label: "Kampanyalar", path: "/admin/kampanyalar" },
  { icon: Newspaper, label: "Bülten Aboneleri", path: "/admin/bulten" },
  { icon: HelpCircle, label: "SSS", path: "/admin/sss" },
  { icon: Share2, label: "Sosyal Medya", path: "/admin/sosyal-medya" },
  { icon: Store, label: "Satıcı Başvuruları", path: "/admin/satici-basvurulari" },
  { icon: UserCheck, label: "Satıcılar", path: "/admin/saticilar" },
  { icon: Sliders, label: "Satıcı Ayarları", path: "/admin/satici-ayarlari" },
  { icon: Truck, label: "Kargo", path: "/admin/kargo" },
  { icon: FileText, label: "Faturalar", path: "/admin/faturalar" },
  { icon: CreditCard, label: "Ödeme Yöntemleri", path: "/admin/odeme" },
  { icon: Tag, label: "Satıcı Ödemeleri", path: "/admin/odemeler" },
  { icon: Tag, label: "Kullanıcı Sepetleri", path: "/admin/sepetler" },
  { icon: Image, label: "Hero", path: "/admin/hero" },
  { icon: Palette, label: "Tema", path: "/admin/tema" },
  { icon: Search, label: "SEO", path: "/admin/seo" },
  { icon: Settings, label: "Ayarlar", path: "/admin/ayarlar" },
  { icon: Activity, label: "Aktivite Logları", path: "/admin/aktivite" },
  { icon: Smartphone, label: "SMS Yönetimi", path: "/admin/sms" },
  
  { icon: TrendingDown, label: "Dönüşüm Hunisi", path: "/admin/donusum-hunisi" },
  { icon: Bell, label: "Push Bildirimler", path: "/admin/push-bildirimler" },
  { icon: Newspaper, label: "Blog", path: "/admin/blog" },
  { icon: UserCheck, label: "Sertifikalar", path: "/admin/sertifikalar" },
  { icon: Users, label: "Cohort Analizi", path: "/admin/cohort" },
  { icon: Settings, label: "Çark Yönetimi", path: "/admin/cark" },
];

const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <>
      <div className="p-4 lg:p-6 border-b border-border">
        <Link to="/admin" className="flex items-center gap-2" onClick={onItemClick}>
          <span className="font-serif text-xl lg:text-2xl font-bold text-primary">MEDEA</span>
          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">Admin</span>
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2 lg:p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/admin" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onItemClick}
                className={cn(
                  "flex items-center gap-3 px-3 lg:px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-2 lg:p-4 border-t border-border space-y-1 lg:space-y-2">
        <Link
          to="/"
          onClick={onItemClick}
          className="flex items-center gap-3 px-3 lg:px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <span className="truncate">Siteye Dön</span>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 lg:px-4 text-muted-foreground hover:text-foreground"
          onClick={() => {
            signOut();
            onItemClick?.();
          }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="truncate">Çıkış Yap</span>
        </Button>
      </div>
    </>
  );
};

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="-ml-2">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 flex flex-col">
            <SidebarContent onItemClick={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <Link to="/admin" className="flex items-center gap-2 ml-2">
          <span className="font-serif text-lg font-bold text-primary">MEDEA</span>
          <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">Admin</span>
        </Link>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border flex-col fixed inset-y-0 left-0">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 overflow-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;