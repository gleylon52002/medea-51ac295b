import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import ComparisonFloat from "@/components/products/ComparisonFloat";
import FlashSaleBanner from "@/components/home/FlashSaleBanner";
import AppPromotionPopup from "@/components/home/AppPromotionPopup";
import AIChatWidget from "@/components/chat/AIChatWidget";
import { useTheme } from "@/hooks/useTheme";
import { useCartSync } from "@/hooks/useUserCart";
import { useActivityLogger } from "@/hooks/useActivityLog";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  useTheme();
  useCartSync();
  useActivityLogger();
  
  return (
    <div className="flex min-h-screen flex-col">
      <FlashSaleBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <ComparisonFloat />
      <AppPromotionPopup />
      <AIChatWidget />
    </div>
  );
};

export default Layout;
