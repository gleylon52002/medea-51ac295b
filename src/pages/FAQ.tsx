import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

const FAQ = () => {
  const { data: faqs, isLoading } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as FAQ[];
    },
  });

  return (
    <Layout>
      <div className="container-main py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Sık Sorulan Sorular</span>
        </nav>

        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-foreground mb-4 text-center">
            Sık Sorulan Sorular
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Merak ettiklerinize hızlıca cevap bulun
          </p>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : faqs?.length ? (
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Henüz soru eklenmemiş.</p>
            </div>
          )}

          <div className="mt-12 p-6 bg-muted/50 rounded-lg text-center">
            <h3 className="font-serif text-xl font-medium mb-2">
              Sorunuzu bulamadınız mı?
            </h3>
            <p className="text-muted-foreground mb-4">
              Bize doğrudan ulaşabilirsiniz.
            </p>
            <Link
              to="/iletisim"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              İletişime Geçin
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FAQ;
