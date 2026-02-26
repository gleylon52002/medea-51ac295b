import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import ComparisonFloat from "@/components/products/ComparisonFloat";
import { useTheme } from "@/hooks/useTheme";
import { useCartSync } from "@/hooks/useUserCart";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  useTheme();
  useCartSync();
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <ComparisonFloat />
    </div>
  );
};

export default Layout;
