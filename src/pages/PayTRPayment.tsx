import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const PayTRPayment = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const paymentUrl = useMemo(
    () => (token ? `https://www.paytr.com/odeme/guvenli/${token}` : ""),
    [token]
  );

  if (!token) {
    return (
      <Layout>
        <div className="container-main py-16 text-center">
          <h1 className="text-2xl font-bold text-destructive">Ödeme Hatası</h1>
          <p className="text-muted-foreground mt-2">Geçersiz ödeme tokeni. Lütfen tekrar deneyin.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-8">
        <h1 className="text-2xl font-serif font-semibold text-center mb-6">Güvenli Ödeme</h1>
        <div className="max-w-3xl mx-auto min-h-[820px] rounded-2xl border border-border bg-card overflow-hidden">
          <iframe
            id="paytriframe"
            title="PayTR Güvenli Ödeme"
            src={paymentUrl}
            frameBorder="0"
            scrolling="auto"
            className="block h-[820px] md:h-[900px] w-full border-0 bg-background"
            allow="payment *"
          />
        </div>
      </div>
    </Layout>
  );
};

export default PayTRPayment;
