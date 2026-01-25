import { Link, Outlet, useLocation } from "react-router-dom";
import { User, Package, Heart, MapPin, Settings, LogOut } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const Account = () => {
  const location = useLocation();

  const menuItems = [
    { path: "/hesabim", label: "Hesap Bilgileri", icon: User },
    { path: "/hesabim/siparisler", label: "Siparişlerim", icon: Package },
    { path: "/hesabim/favoriler", label: "Favorilerim", icon: Heart },
    { path: "/hesabim/adresler", label: "Adreslerim", icon: MapPin },
    { path: "/hesabim/ayarlar", label: "Ayarlar", icon: Settings },
  ];

  return (
    <Layout>
      <div className="container-main py-8 lg:py-12">
        <h1 className="font-serif text-2xl lg:text-3xl font-medium text-foreground mb-8">
          Hesabım
        </h1>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <button className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-muted w-full text-left text-destructive">
                <LogOut className="h-5 w-5" />
                <span>Çıkış Yap</span>
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <Outlet />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Account;
