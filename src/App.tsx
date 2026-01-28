import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Category from "./pages/Category";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Auth from "./pages/Auth";
import About from "./pages/About";
import Contact from "./pages/Contact";

// Account Pages
import Account from "./pages/Account";
import Profile from "./pages/account/Profile";
import Orders from "./pages/account/Orders";
import OrderDetail from "./pages/account/OrderDetail";
import Favorites from "./pages/account/Favorites";
import Addresses from "./pages/account/Addresses";
import AccountSettings from "./pages/account/AccountSettings";

// Legal Pages
import KVKK from "./pages/legal/KVKK";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import SalesAgreement from "./pages/legal/SalesAgreement";
import ReturnPolicy from "./pages/legal/ReturnPolicy";
import CookiePolicy from "./pages/legal/CookiePolicy";

// Admin Pages
import AdminGuard from "./components/admin/AdminGuard";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminShipping from "./pages/admin/AdminShipping";
import AdminPayment from "./pages/admin/AdminPayment";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminNewsletter from "./pages/admin/AdminNewsletter";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/urunler" element={<Products />} />
              <Route path="/urun/:slug" element={<ProductDetail />} />
              <Route path="/kategori/:slug" element={<Category />} />
              <Route path="/odeme" element={<Checkout />} />
              <Route path="/siparis-basarili" element={<OrderSuccess />} />
              <Route path="/giris" element={<Auth />} />
              <Route path="/hakkimizda" element={<About />} />
              <Route path="/iletisim" element={<Contact />} />

              {/* Account Routes */}
              <Route path="/hesabim" element={<Account />}>
                <Route index element={<Profile />} />
                <Route path="siparisler" element={<Orders />} />
                <Route path="siparisler/:orderNumber" element={<OrderDetail />} />
                <Route path="favoriler" element={<Favorites />} />
                <Route path="adresler" element={<Addresses />} />
                <Route path="ayarlar" element={<AccountSettings />} />
              </Route>

              {/* Legal Routes */}
              <Route path="/kvkk" element={<KVKK />} />
              <Route path="/gizlilik-politikasi" element={<PrivacyPolicy />} />
              <Route path="/mesafeli-satis-sozlesmesi" element={<SalesAgreement />} />
              <Route path="/iade-ve-iptal" element={<ReturnPolicy />} />
              <Route path="/cerez-politikasi" element={<CookiePolicy />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
                <Route index element={<AdminDashboard />} />
                <Route path="urunler" element={<AdminProducts />} />
                <Route path="kategoriler" element={<AdminCategories />} />
                <Route path="siparisler" element={<AdminOrders />} />
                <Route path="kullanicilar" element={<AdminUsers />} />
                <Route path="yorumlar" element={<AdminReviews />} />
                <Route path="kuponlar" element={<AdminCoupons />} />
                <Route path="mesajlar" element={<AdminMessages />} />
                <Route path="bulten" element={<AdminNewsletter />} />
                <Route path="kargo" element={<AdminShipping />} />
                <Route path="odeme" element={<AdminPayment />} />
                <Route path="ayarlar" element={<AdminSettings />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
