import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Star,
  Bell,
  Settings, 
  LogOut,
  ChevronLeft,
  TrendingUp,
  Wallet,
  Menu
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSellerProfile, useSellerNotifications } from "@/hooks/useSeller";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/satici" },
  { icon: Package, label: "Ürünlerim", path: "/satici/urunler" },
  { icon: ShoppingCart, label: "Siparişlerim", path: "/satici/siparisler" },
  { icon: Wallet, label: "Kazançlarım", path: "/satici/kazanclar" },
  { icon: Star, label: "Puanlarım", path: "/satici/puanlar" },
  { icon: TrendingUp, label: "Öne Çıkar", path: "/satici/one-cikar" },
  { icon: Bell, label: "Bildirimler", path: "/satici/bildirimler" },
  { icon: Settings, label: "Ayarlar", path: "/satici/ayarlar" },
];

const SidebarContent = ({ onItemClick, unreadCount }: { onItemClick?: () => void; unreadCount: number }) => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { data: seller } = useSellerProfile();

  return (
    <>
      <div className="p-4 lg:p-6 border-b border-border">
        <Link to="/satici" className="flex items-center gap-2" onClick={onItemClick}>
          <span className="font-serif text-xl lg:text-2xl font-bold text-primary">MEDEA</span>
          <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">Satıcı</span>
        </Link>
        {seller && (
          <div className="mt-4 space-y-1">
            <p className="font-medium text-sm truncate">{seller.company_name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                {seller.reputation_points}
              </span>
              {seller.penalty_points > 0 && (
                <span className="text-destructive">-{seller.penalty_points}</span>
              )}
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2 lg:p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== "/satici" && location.pathname.startsWith(item.path));
            const showBadge = item.path === "/satici/bildirimler" && unreadCount > 0;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onItemClick}
                className={cn(
                  "flex items-center gap-3 px-3 lg:px-4 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {showBadge && (
                  <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] text-xs">
                    {unreadCount}
                  </Badge>
                )}
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

const SellerLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: notifications } = useSellerNotifications();
  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

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
            <SidebarContent onItemClick={() => setMobileOpen(false)} unreadCount={unreadCount} />
          </SheetContent>
        </Sheet>
        <Link to="/satici" className="flex items-center gap-2 ml-2">
          <span className="font-serif text-lg font-bold text-primary">MEDEA</span>
          <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">Satıcı</span>
        </Link>
        {unreadCount > 0 && (
          <Link to="/satici/bildirimler" className="ml-auto">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <Badge variant="destructive" className="absolute -mt-3 ml-3 h-4 min-w-[16px] text-[10px]">
              {unreadCount}
            </Badge>
          </Link>
        )}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border flex-col fixed inset-y-0 left-0">
        <SidebarContent unreadCount={unreadCount} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 overflow-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default SellerLayout;
