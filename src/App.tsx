import { useEffect, lazy, Suspense } from "react";
import { initGA4 } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import "@/i18n";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

// Eagerly loaded (critical path)
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";

// Lazy loaded pages
const Category = lazy(() => import("./pages/Category"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const Auth = lazy(() => import("./pages/Auth"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));

// Account Pages (lazy)
const Account = lazy(() => import("./pages/Account"));
const Profile = lazy(() => import("./pages/account/Profile"));
const Orders = lazy(() => import("./pages/account/Orders"));
const OrderDetail = lazy(() => import("./pages/account/OrderDetail"));
const Favorites = lazy(() => import("./pages/account/Favorites"));
const Addresses = lazy(() => import("./pages/account/Addresses"));
const Affiliate = lazy(() => import("./pages/account/Affiliate"));
const AccountSettings = lazy(() => import("./pages/account/AccountSettings"));
const Loyalty = lazy(() => import("./pages/account/Loyalty"));

// Legal Pages (lazy)
const KVKK = lazy(() => import("./pages/legal/KVKK"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const SalesAgreement = lazy(() => import("./pages/legal/SalesAgreement"));
const ReturnPolicy = lazy(() => import("./pages/legal/ReturnPolicy"));
const CookiePolicy = lazy(() => import("./pages/legal/CookiePolicy"));
const FAQ = lazy(() => import("./pages/FAQ"));
const SellerRules = lazy(() => import("./pages/legal/SellerRules"));
const Compare = lazy(() => import("./pages/Compare"));


const AdminGuard = lazy(() => import("./components/admin/AdminGuard"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminShipping = lazy(() => import("./pages/admin/AdminShipping"));

const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const AdminNewsletter = lazy(() => import("./pages/admin/AdminNewsletter"));
const AdminContactMessages = lazy(() => import("./pages/admin/AdminContactMessages"));
const AdminCampaigns = lazy(() => import("./pages/admin/AdminCampaigns"));
const AdminFAQ = lazy(() => import("./pages/admin/AdminFAQ"));
const AdminSocialMedia = lazy(() => import("./pages/admin/AdminSocialMedia"));
const AdminTheme = lazy(() => import("./pages/admin/AdminTheme"));
const AdminSEO = lazy(() => import("./pages/admin/AdminSEO"));
const AdminHero = lazy(() => import("./pages/admin/AdminHero"));
const AdminSellerApplications = lazy(() => import("./pages/admin/AdminSellerApplications"));
const AdminSellers = lazy(() => import("./pages/admin/AdminSellers"));
const AdminSellerSettings = lazy(() => import("./pages/admin/AdminSellerSettings"));
const AdminPayouts = lazy(() => import("./pages/admin/AdminPayouts"));
const AdminInvoices = lazy(() => import("./pages/admin/AdminInvoices"));
const AdminUserCarts = lazy(() => import("./pages/admin/AdminUserCarts"));
const AdminActivityLogs = lazy(() => import("./pages/admin/AdminActivityLogs"));
const AdminSMS = lazy(() => import("./pages/admin/AdminSMS"));
const AdminConversionFunnel = lazy(() => import("./pages/admin/AdminConversionFunnel"));
const AdminPushNotifications = lazy(() => import("./pages/admin/AdminPushNotifications"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminCertificates = lazy(() => import("./pages/admin/AdminCertificates"));
const AdminCohort = lazy(() => import("./pages/admin/AdminCohort"));
const AdminSpinWheel = lazy(() => import("./pages/admin/AdminSpinWheel"));
const AdminRSS = lazy(() => import("./pages/admin/AdminRSS"));
const AdminMaintenance = lazy(() => import("./pages/admin/AdminMaintenance"));
const AdminSegments = lazy(() => import("./pages/admin/AdminSegments"));
const AdminEmailAutomation = lazy(() => import("./pages/admin/AdminEmailAutomation"));
const AdminCampaignCalendar = lazy(() => import("./pages/admin/AdminCampaignCalendar"));
const AdminAbout = lazy(() => import("./pages/admin/AdminAbout"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminWarehouses = lazy(() => import("./pages/admin/AdminWarehouses"));
const AdminPricingRules = lazy(() => import("./pages/admin/AdminPricingRules"));
const AdminWhatsApp = lazy(() => import("./pages/admin/AdminWhatsApp"));
const SellerScorecard = lazy(() => import("./pages/seller/SellerScorecard"));


// Seller Pages (lazy)
const SellerGuard = lazy(() => import("./components/seller/SellerGuard"));
const SellerLayout = lazy(() => import("./components/seller/SellerLayout"));
const SellerDashboard = lazy(() => import("./pages/seller/SellerDashboard"));
const SellerProducts = lazy(() => import("./pages/seller/SellerProducts"));
const SellerOrders = lazy(() => import("./pages/seller/SellerOrders"));
const SellerEarnings = lazy(() => import("./pages/seller/SellerEarnings"));
const SellerPoints = lazy(() => import("./pages/seller/SellerPoints"));
const SellerFeature = lazy(() => import("./pages/seller/SellerFeature"));
const SellerNotifications = lazy(() => import("./pages/seller/SellerNotifications"));
const SellerMessages = lazy(() => import("./pages/seller/SellerMessages"));
const SellerCargo = lazy(() => import("./pages/seller/SellerCargo"));
const SellerSettings = lazy(() => import("./pages/seller/SellerSettings"));
const SellerInvoices = lazy(() => import("./pages/seller/SellerInvoices"));
const SellerAnalytics = lazy(() => import("./pages/seller/SellerAnalytics"));
const SellerQuestions = lazy(() => import("./pages/seller/SellerQuestions"));
const SellerBuyPoints = lazy(() => import("./pages/seller/SellerBuyPoints"));
const SellerStockForecast = lazy(() => import("./pages/seller/SellerStockForecast"));

const SellerStore = lazy(() => import("./pages/SellerStore"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const GiftPackage = lazy(() => import("./pages/GiftPackage"));
const GiftReceive = lazy(() => import("./pages/GiftReceive"));
const Badges = lazy(() => import("./pages/Badges"));
const Community = lazy(() => import("./pages/Community"));
const BirthdayReminders = lazy(() => import("./pages/BirthdayReminders"));
const CustomProductOrder = lazy(() => import("./pages/CustomProductOrder"));
const SharedWishlist = lazy(() => import("./pages/SharedWishlist"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const ReferralTracker = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      sessionStorage.setItem("referral_code", ref);
    }
  }, []);
  return null;
};

const GA4Init = () => {
  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "ga4_measurement_id").maybeSingle().then(({ data }) => {
      if (data?.value) {
        initGA4(typeof data.value === "string" ? data.value : String(data.value));
      }
    });
  }, []);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ReferralTracker />
            <GA4Init />
            <PWAInstallPrompt />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/urunler" element={<Products />} />
                <Route path="/urun/:slug" element={<ProductDetail />} />
                <Route path="/kategori/:slug" element={<Category />} />
                <Route path="/odeme" element={<Checkout />} />
                <Route path="/odeme/paytr" element={<PayTRPayment />} />
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
                  <Route path="sadakat" element={<Loyalty />} />
                  <Route path="ayarlar" element={<AccountSettings />} />
                </Route>

                {/* Legal Routes */}
                <Route path="/kvkk" element={<KVKK />} />
                <Route path="/gizlilik-politikasi" element={<PrivacyPolicy />} />
                <Route path="/mesafeli-satis-sozlesmesi" element={<SalesAgreement />} />
                <Route path="/iade-ve-iptal" element={<ReturnPolicy />} />
                <Route path="/cerez-politikasi" element={<CookiePolicy />} />
                <Route path="/sss" element={<FAQ />} />
                <Route path="/satici-kurallari" element={<SellerRules />} />
                <Route path="/karsilastir" element={<Compare />} />
                <Route path="/magaza/:slug" element={<SellerStore />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogDetail />} />
                <Route path="/hediye-paketi" element={<GiftPackage />} />
                <Route path="/hediye/:token" element={<GiftReceive />} />
                <Route path="/rozetler" element={<Badges />} />
                <Route path="/topluluk" element={<Community />} />
                <Route path="/dogum-gunu" element={<BirthdayReminders />} />
                <Route path="/ozel-urun" element={<CustomProductOrder />} />
                <Route path="/favoriler/:token" element={<SharedWishlist />} />

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
                  <Route path="iletisim-mesajlari" element={<AdminContactMessages />} />
                  <Route path="sss" element={<AdminFAQ />} />
                  <Route path="sosyal-medya" element={<AdminSocialMedia />} />
                  <Route path="kargo" element={<AdminShipping />} />
                  <Route path="faturalar" element={<AdminInvoices />} />
                  <Route path="odemeler" element={<AdminPayouts />} />
                  <Route path="odeme" element={<AdminPayment />} />
                  <Route path="hero" element={<AdminHero />} />
                  <Route path="tema" element={<AdminTheme />} />
                  <Route path="seo" element={<AdminSEO />} />
                  <Route path="satici-basvurulari" element={<AdminSellerApplications />} />
                  <Route path="saticilar" element={<AdminSellers />} />
                  <Route path="satici-ayarlari" element={<AdminSellerSettings />} />
                  <Route path="ayarlar" element={<AdminSettings />} />
                  <Route path="sepetler" element={<AdminUserCarts />} />
                  <Route path="aktivite" element={<AdminActivityLogs />} />
                  <Route path="sms" element={<AdminSMS />} />
                  <Route path="donusum-hunisi" element={<AdminConversionFunnel />} />
                  <Route path="push-bildirimler" element={<AdminPushNotifications />} />
                  <Route path="blog" element={<AdminBlog />} />
                  <Route path="sertifikalar" element={<AdminCertificates />} />
                  <Route path="cohort" element={<AdminCohort />} />
                  <Route path="cark" element={<AdminSpinWheel />} />
                  <Route path="rss" element={<AdminRSS />} />
                  <Route path="bakim" element={<AdminMaintenance />} />
                  <Route path="segmentler" element={<AdminSegments />} />
                  <Route path="email-otomasyon" element={<AdminEmailAutomation />} />
                  <Route path="kampanya-takvimi" element={<AdminCampaignCalendar />} />
                  <Route path="hakkimizda" element={<AdminAbout />} />
                  <Route path="analitik" element={<AdminAnalytics />} />
                  <Route path="depolar" element={<AdminWarehouses />} />
                  <Route path="fiyatlandirma" element={<AdminPricingRules />} />
                  <Route path="whatsapp" element={<AdminWhatsApp />} />
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
                  <Route path="puan-satin-al" element={<SellerBuyPoints />} />
                  <Route path="one-cikar" element={<SellerFeature />} />
                  <Route path="bildirimler" element={<SellerNotifications />} />
                  <Route path="mesajlar" element={<SellerMessages />} />
                  <Route path="sorular" element={<SellerQuestions />} />
                  <Route path="kargo" element={<SellerCargo />} />
                  <Route path="stok-tahmini" element={<SellerStockForecast />} />
                  <Route path="performans" element={<SellerScorecard />} />
                  <Route path="ayarlar" element={<SellerSettings />} />
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
