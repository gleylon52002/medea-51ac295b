import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/layout/Layout";

const PayTRPayment = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    // Load PayTR iframe resizer script
    const script = document.createElement("script");
    script.src = "https://www.paytr.com/js/iframeResizer.min.js";
    script.onload = () => {
      if ((window as any).iFrameResize) {
        (window as any).iFrameResize({}, "#paytriframe");
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

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
        <div className="max-w-2xl mx-auto">
          <iframe
            id="paytriframe"
            src={`https://www.paytr.com/odeme/guvenli/${token}`}
            frameBorder="0"
            scrolling="no"
            style={{ width: "100%", minHeight: "600px" }}
          />
        </div>
      </div>
    </Layout>
  );
};

export default PayTRPayment;
