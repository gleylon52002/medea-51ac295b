import Layout from "@/components/layout/Layout";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import Categories from "@/components/home/Categories";
import Newsletter from "@/components/home/Newsletter";
import TrustBadges from "@/components/products/TrustBadges";
import RecentPurchaseToast from "@/components/products/RecentPurchaseToast";
import RecentlyViewed from "@/components/products/RecentlyViewed";

const Index = () => {
  return (
    <Layout>
      <Hero />
      <Features />
      <FeaturedProducts />
      <div className="container-main py-12">
        <TrustBadges variant="horizontal" />
      </div>
      <Categories />
      <div className="container-main">
        <RecentlyViewed />
      </div>
      <Newsletter />
      <RecentPurchaseToast />
    </Layout>
  );
};

export default Index;
