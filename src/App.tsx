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
import Affiliate from "./pages/account/Affiliate";
import AccountSettings from "./pages/account/AccountSettings";

// Legal Pages
import KVKK from "./pages/legal/KVKK";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import SalesAgreement from "./pages/legal/SalesAgreement";
import ReturnPolicy from "./pages/legal/ReturnPolicy";
import CookiePolicy from "./pages/legal/CookiePolicy";
import FAQ from "./pages/FAQ";
import Compare from "./pages/Compare";

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
import AdminCampaigns from "./pages/admin/AdminCampaigns";
import AdminFAQ from "./pages/admin/AdminFAQ";
import AdminSocialMedia from "./pages/admin/AdminSocialMedia";
import AdminTheme from "./pages/admin/AdminTheme";
import AdminSEO from "./pages/admin/AdminSEO";
import AdminHero from "./pages/admin/AdminHero";
import AdminSellerApplications from "./pages/admin/AdminSellerApplications";
import AdminSellers from "./pages/admin/AdminSellers";
import AdminSellerSettings from "./pages/admin/AdminSellerSettings";
import AdminInvoices from "./pages/admin/AdminInvoices";

// Seller Pages
import SellerGuard from "./components/seller/SellerGuard";
import SellerLayout from "./components/seller/SellerLayout";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerProducts from "./pages/seller/SellerProducts";
import SellerOrders from "./pages/seller/SellerOrders";
import SellerEarnings from "./pages/seller/SellerEarnings";
import SellerPoints from "./pages/seller/SellerPoints";
import SellerFeature from "./pages/seller/SellerFeature";
import SellerNotifications from "./pages/seller/SellerNotifications";
import SellerMessages from "./pages/seller/SellerMessages";
import SellerCargo from "./pages/seller/SellerCargo";
import SellerSettings from "./pages/seller/SellerSettings";
import SellerInvoices from "./pages/seller/SellerInvoices";
import SellerAnalytics from "./pages/seller/SellerAnalytics";

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
                <Route path="referans" element={<Affiliate />} />
                <Route path="ayarlar" element={<AccountSettings />} />
              </Route>

              {/* Legal Routes */}
              <Route path="/kvkk" element={<KVKK />} />
              <Route path="/gizlilik-politikasi" element={<PrivacyPolicy />} />
              <Route path="/mesafeli-satis-sozlesmesi" element={<SalesAgreement />} />
              <Route path="/iade-ve-iptal" element={<ReturnPolicy />} />
              <Route path="/cerez-politikasi" element={<CookiePolicy />} />
              <Route path="/sss" element={<FAQ />} />
              <Route path="/karsilastir" element={<Compare />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
                <Route index element={<AdminDashboard />} />
                <Route path="urunler" element={<AdminProducts />} />
                <Route path="kategoriler" element={<AdminCategories />} />
                <Route path="siparisler" element={<AdminOrders />} />
                <Route path="kullanicilar" element={<AdminUsers />} />
                <Route path="yorumlar" element={<AdminReviews />} />
                <Route path="kuponlar" element={<AdminCoupons />} />
                <Route path="kampanyalar" element={<AdminCampaigns />} />
                <Route path="mesajlar" element={<AdminMessages />} />
                <Route path="bulten" element={<AdminNewsletter />} />
                <Route path="sss" element={<AdminFAQ />} />
                <Route path="sosyal-medya" element={<AdminSocialMedia />} />
                <Route path="kargo" element={<AdminShipping />} />
                <Route path="faturalar" element={<AdminInvoices />} />
                <Route path="odeme" element={<AdminPayment />} />
                <Route path="hero" element={<AdminHero />} />
                <Route path="tema" element={<AdminTheme />} />
                <Route path="seo" element={<AdminSEO />} />
                <Route path="satici-basvurulari" element={<AdminSellerApplications />} />
                <Route path="saticilar" element={<AdminSellers />} />
                <Route path="satici-ayarlari" element={<AdminSellerSettings />} />
                <Route path="ayarlar" element={<AdminSettings />} />
              </Route>

              {/* Seller Routes */}
              <Route path="/satici" element={<SellerGuard><SellerLayout /></SellerGuard>}>
                <Route index element={<SellerDashboard />} />
                <Route path="urunler" element={<SellerProducts />} />
                <Route path="siparisler" element={<SellerOrders />} />
                <Route path="kazanclar" element={<SellerEarnings />} />
                <Route path="analiz" element={<SellerAnalytics />} />
                <Route path="faturalar" element={<SellerInvoices />} />
                <Route path="puanlar" element={<SellerPoints />} />
                <Route path="one-cikar" element={<SellerFeature />} />
                <Route path="bildirimler" element={<SellerNotifications />} />
                <Route path="mesajlar" element={<SellerMessages />} />
                <Route path="sorular" element={<SellerQuestions />} />
                <Route path="kargo" element={<SellerCargo />} />
                <Route path="ayarlar" element={<SellerSettings />} />
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
