import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreditCard, Building2, Truck } from "lucide-react";
import { useState, useEffect } from "react";

const paymentIcons: Record<string, React.ReactNode> = {
  credit_card: <CreditCard className="h-5 w-5" />,
  bank_transfer: <Building2 className="h-5 w-5" />,
  cash_on_delivery: <Truck className="h-5 w-5" />,
};

const paymentLabels: Record<string, { title: string; description: string }> = {
  credit_card: { 
    title: "Kredi Kartı", 
    description: "Stripe üzerinden güvenli ödeme" 
  },
  bank_transfer: { 
    title: "Havale / EFT", 
    description: "Banka hesabına havale ile ödeme" 
  },
  cash_on_delivery: { 
    title: "Kapıda Ödeme", 
    description: "Teslimat sırasında nakit ödeme" 
  },
};

const AdminPayment = () => {
  const queryClient = useQueryClient();
  const [bankConfig, setBankConfig] = useState({
    iban: "",
    bank_name: "",
    account_holder: "",
  });

  const { data: paymentSettings, isLoading } = useQuery({
    queryKey: ["admin", "payment-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const bankSetting = paymentSettings?.find(p => p.method === "bank_transfer");
    if (bankSetting?.config) {
      const config = bankSetting.config as { iban?: string; bank_name?: string; account_holder?: string };
      setBankConfig({
        iban: config.iban || "",
        bank_name: config.bank_name || "",
        account_holder: config.account_holder || "",
      });
    }
  }, [paymentSettings]);

  const toggleMutation = useMutation({
    mutationFn: async ({ method, is_active }: { method: "credit_card" | "bank_transfer" | "cash_on_delivery"; is_active: boolean }) => {
      const { error } = await supabase
        .from("payment_settings")
        .update({ is_active })
        .eq("method", method);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payment-settings"] });
      toast.success("Ödeme yöntemi güncellendi");
    },
    onError: () => {
      toast.error("Güncelleme başarısız");
    },
  });

  const updateBankConfigMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("payment_settings")
        .update({ config: bankConfig })
        .eq("method", "bank_transfer");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payment-settings"] });
      toast.success("Banka bilgileri kaydedildi");
    },
    onError: () => {
      toast.error("Kaydetme başarısız");
    },
  });

  const getSettingByMethod = (method: string) => {
    return paymentSettings?.find(p => p.method === method);
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-foreground">Ödeme Yönetimi</h1>
        <p className="text-muted-foreground mt-1">Ödeme yöntemlerini açın veya kapatın</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {Object.entries(paymentLabels).map(([method, { title, description }]) => {
          const setting = getSettingByMethod(method);
          return (
            <Card key={method}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-lg">
                    {paymentIcons[method]}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={setting?.is_active ?? false}
                  onCheckedChange={(checked) => 
                    toggleMutation.mutate({ method: method as "credit_card" | "bank_transfer" | "cash_on_delivery", is_active: checked })
                  }
                />
              </CardHeader>
              
              {method === "bank_transfer" && setting?.is_active && (
                <CardContent className="pt-4 border-t">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bank_name">Banka Adı</Label>
                      <Input
                        id="bank_name"
                        value={bankConfig.bank_name}
                        onChange={(e) => setBankConfig(prev => ({ ...prev, bank_name: e.target.value }))}
                        placeholder="Örn: Ziraat Bankası"
                      />
                    </div>
                    <div>
                      <Label htmlFor="account_holder">Hesap Sahibi</Label>
                      <Input
                        id="account_holder"
                        value={bankConfig.account_holder}
                        onChange={(e) => setBankConfig(prev => ({ ...prev, account_holder: e.target.value }))}
                        placeholder="Hesap sahibinin adı"
                      />
                    </div>
                    <div>
                      <Label htmlFor="iban">IBAN</Label>
                      <Input
                        id="iban"
                        value={bankConfig.iban}
                        onChange={(e) => setBankConfig(prev => ({ ...prev, iban: e.target.value }))}
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                      />
                    </div>
                    <Button 
                      onClick={() => updateBankConfigMutation.mutate()}
                      disabled={updateBankConfigMutation.isPending}
                    >
                      {updateBankConfigMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPayment;
