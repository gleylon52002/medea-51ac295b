import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import ComparisonFloat from "@/components/products/ComparisonFloat";
import FlashSaleBanner from "@/components/home/FlashSaleBanner";
import AppPromotionPopup from "@/components/home/AppPromotionPopup";
import AIChatWidget from "@/components/chat/AIChatWidget";
import SpinWheelTrigger from "@/components/gamification/SpinWheelTrigger";
import { useTheme } from "@/hooks/useTheme";
import { useCartSync } from "@/hooks/useUserCart";
import { useActivityLogger } from "@/hooks/useActivityLog";
import { useHeatmapTracking } from "@/hooks/useHeatmap";
import { trackPageView, initScrollDepthTracker, resetScrollTracker } from "@/lib/analytics";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  useTheme();
  useCartSync();
  useActivityLogger();
  useHeatmapTracking();

  useEffect(() => {
    trackPageView(location.pathname);
    resetScrollTracker();
    initScrollDepthTracker();
  }, [location.pathname]);
  
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
      <SpinWheelTrigger />
    </div>
  );
};

export default Layout;
