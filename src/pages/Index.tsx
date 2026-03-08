import Layout from "@/components/layout/Layout";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import Categories from "@/components/home/Categories";
import Newsletter from "@/components/home/Newsletter";
import TrustBadges from "@/components/products/TrustBadges";
import RecentPurchaseToast from "@/components/products/RecentPurchaseToast";
import { useAbandonedCartTracker } from "@/hooks/useAbandonedCart";
import RecentlyViewed from "@/components/products/RecentlyViewed";
import Campaigns from "@/components/home/Campaigns";
import CampaignPopup from "@/components/home/CampaignPopup";
import FirstOrderBanner from "@/components/home/FirstOrderBanner";
import AIRecommendations from "@/components/products/AIRecommendations";
import SEOHead from "@/components/SEOHead";
import BlogPreview from "@/components/home/BlogPreview";

const Index = () => {
  useAbandonedCartTracker();

  return (
    <Layout>
      <SEOHead
        title="Medea - Doğal Güzellik & Bakım Ürünleri"
        description="Medea'da en kaliteli doğal güzellik ve bakım ürünlerini keşfedin. Hızlı kargo, güvenli ödeme ve %100 müşteri memnuniyeti garantisi."
        canonical="https://medea.tr"
      />
      <Hero />
      <FeaturedProducts />
      <FirstOrderBanner />
      <Campaigns />
      <Features />
      <div className="container-main py-12">
        <TrustBadges variant="horizontal" />
      </div>
      <Categories />
      <div className="container-main">
        <AIRecommendations title="Size Özel Öneriler" />
      </div>
      <BlogPreview />
      <div className="container-main">
        <RecentlyViewed />
      </div>
      <Newsletter />
      <RecentPurchaseToast />
      <CampaignPopup />
    </Layout>
  );
};

export default Index;
