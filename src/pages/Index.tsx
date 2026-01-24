import Layout from "@/components/layout/Layout";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import Categories from "@/components/home/Categories";
import Newsletter from "@/components/home/Newsletter";

const Index = () => {
  return (
    <Layout>
      <Hero />
      <Features />
      <FeaturedProducts />
      <Categories />
      <Newsletter />
    </Layout>
  );
};

export default Index;
