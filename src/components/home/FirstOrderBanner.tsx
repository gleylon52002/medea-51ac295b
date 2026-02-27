import { useState, useEffect } from "react";
import { X, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const FirstOrderBanner = () => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkFirstOrder = async () => {
      if (!user) { setShow(false); return; }
      
      // Check if dismissed in this session
      if (sessionStorage.getItem("first_order_dismissed")) { setShow(false); return; }

      // Check if user has any orders
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      setShow(count === 0);
    };
    checkFirstOrder();
  }, [user]);

  if (!show || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("first_order_dismissed", "1");
  };

  return (
    <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/20 rounded-xl p-4 mx-4 my-4">
      <button onClick={handleDismiss} className="absolute top-2 right-2 p-1 hover:bg-background/50 rounded-full">
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-full shrink-0">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">🎉 İlk Siparişinize Özel %10 İndirim!</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <strong>HOSGELDIN</strong> kupon kodunu ödeme sayfasında kullanın.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FirstOrderBanner;
