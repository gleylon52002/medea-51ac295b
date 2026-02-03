import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreditCard, Building2, Truck, ShoppingBag, Wallet, Banknote } from "lucide-react";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const paymentIcons: Record<string, React.ReactNode> = {
  credit_card: <CreditCard className="h-5 w-5" />,
  bank_transfer: <Building2 className="h-5 w-5" />,
  cash_on_delivery: <Truck className="h-5 w-5" />,
  shopier: <ShoppingBag className="h-5 w-5" />,
  shopinext: <Wallet className="h-5 w-5" />,
  payizone: <Banknote className="h-5 w-5" />,
};

const paymentLabels: Record<string, { title: string; description: string }> = {
  credit_card: { 
    title: "Kredi Kartı", 
    description: "Doğrudan kredi kartı ile ödeme" 
  },
  bank_transfer: { 
    title: "Havale / EFT", 
    description: "Banka hesabına havale ile ödeme" 
  },
  cash_on_delivery: { 
    title: "Kapıda Ödeme", 
    description: "Teslimat sırasında nakit ödeme" 
  },
  shopier: { 
    title: "Shopier", 
    description: "Shopier ödeme altyapısı" 
  },
  shopinext: { 
    title: "ShopiNext", 
    description: "Token bazlı API entegrasyonu" 
  },
  payizone: { 
    title: "Payizone", 
    description: "Güvenli ödeme çözümü" 
  },
};

const AdminPayment = () => {
  const queryClient = useQueryClient();
  
  const [bankConfig, setBankConfig] = useState({
    iban: "",
    bank_name: "",
    account_holder: "",
  });

  const [shopierConfig, setShopierConfig] = useState({
    api_user: "",
    api_key: "",
    secret: "",
  });

  const [shopinextConfig, setShopinextConfig] = useState({
    token: "",
    merchant_id: "",
  });

  const [payizoneConfig, setPayizoneConfig] = useState({
    api_key: "",
    secret_key: "",
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
    if (paymentSettings) {
      paymentSettings.forEach((setting) => {
        const config = setting.config as Record<string, string> | null;
        if (!config) return;

        switch (setting.method) {
          case "bank_transfer":
            setBankConfig({
              iban: config.iban || "",
              bank_name: config.bank_name || "",
              account_holder: config.account_holder || "",
            });
            break;
          case "shopier":
            setShopierConfig({
              api_user: config.api_user || "",
              api_key: config.api_key || "",
              secret: config.secret || "",
            });
            break;
          case "shopinext":
            setShopinextConfig({
              token: config.token || "",
              merchant_id: config.merchant_id || "",
            });
            break;
          case "payizone":
            setPayizoneConfig({
              api_key: config.api_key || "",
              secret_key: config.secret_key || "",
            });
            break;
        }
      });
    }
  }, [paymentSettings]);

  const toggleMutation = useMutation({
    mutationFn: async ({ method, is_active }: { method: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("payment_settings")
        .update({ is_active })
        .eq("method", method as any);
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

  const updateConfigMutation = useMutation({
    mutationFn: async ({ method, config }: { method: string; config: Record<string, string> }) => {
      const { error } = await supabase
        .from("payment_settings")
        .update({ config })
        .eq("method", method as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payment-settings"] });
      toast.success("Ayarlar kaydedildi");
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
      <div className="p-4 lg:p-8">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-foreground">Ödeme Yönetimi</h1>
        <p className="text-muted-foreground mt-1 text-sm lg:text-base">Ödeme yöntemlerini yapılandırın</p>
      </div>

      <Tabs defaultValue="standard" className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="mb-6 inline-flex w-auto">
            <TabsTrigger value="standard">Standart</TabsTrigger>
            <TabsTrigger value="external">Harici Entegrasyonlar</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="standard">
          <div className="grid gap-4 lg:gap-6 max-w-2xl">
            {["credit_card", "bank_transfer", "cash_on_delivery"].map((method) => {
              const setting = getSettingByMethod(method);
              const { title, description } = paymentLabels[method];
              return (
                <Card key={method}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <div className="flex items-center gap-3 lg:gap-4">
                      <div className="p-2 bg-muted rounded-lg shrink-0">
                        {paymentIcons[method]}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base lg:text-lg">{title}</CardTitle>
                        <CardDescription className="text-xs lg:text-sm truncate">{description}</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={setting?.is_active ?? false}
                      onCheckedChange={(checked) => 
                        toggleMutation.mutate({ method, is_active: checked })
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
                          onClick={() => updateConfigMutation.mutate({ method: "bank_transfer", config: bankConfig })}
                          disabled={updateConfigMutation.isPending}
                          className="w-full sm:w-auto"
                        >
                          {updateConfigMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="external">
          <div className="grid gap-4 lg:gap-6 max-w-2xl">
            {/* Shopier */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="p-2 bg-muted rounded-lg shrink-0">
                    {paymentIcons.shopier}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base lg:text-lg">{paymentLabels.shopier.title}</CardTitle>
                    <CardDescription className="text-xs lg:text-sm">{paymentLabels.shopier.description}</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={getSettingByMethod("shopier")?.is_active ?? false}
                  onCheckedChange={(checked) => 
                    toggleMutation.mutate({ method: "shopier", is_active: checked })
                  }
                />
              </CardHeader>
              {getSettingByMethod("shopier")?.is_active && (
                <CardContent className="pt-4 border-t">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="shopier_api_user">API User</Label>
                      <Input
                        id="shopier_api_user"
                        value={shopierConfig.api_user}
                        onChange={(e) => setShopierConfig(prev => ({ ...prev, api_user: e.target.value }))}
                        placeholder="API kullanıcı adı"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shopier_api_key">API Key</Label>
                      <Input
                        id="shopier_api_key"
                        type="password"
                        value={shopierConfig.api_key}
                        onChange={(e) => setShopierConfig(prev => ({ ...prev, api_key: e.target.value }))}
                        placeholder="API anahtarı"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shopier_secret">Secret</Label>
                      <Input
                        id="shopier_secret"
                        type="password"
                        value={shopierConfig.secret}
                        onChange={(e) => setShopierConfig(prev => ({ ...prev, secret: e.target.value }))}
                        placeholder="Gizli anahtar"
                      />
                    </div>
                    <Button 
                      onClick={() => updateConfigMutation.mutate({ method: "shopier", config: shopierConfig })}
                      disabled={updateConfigMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {updateConfigMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* ShopiNext */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="p-2 bg-muted rounded-lg shrink-0">
                    {paymentIcons.shopinext}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base lg:text-lg">{paymentLabels.shopinext.title}</CardTitle>
                    <CardDescription className="text-xs lg:text-sm">{paymentLabels.shopinext.description}</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={getSettingByMethod("shopinext")?.is_active ?? false}
                  onCheckedChange={(checked) => 
                    toggleMutation.mutate({ method: "shopinext", is_active: checked })
                  }
                />
              </CardHeader>
              {getSettingByMethod("shopinext")?.is_active && (
                <CardContent className="pt-4 border-t">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="shopinext_merchant_id">Merchant ID</Label>
                      <Input
                        id="shopinext_merchant_id"
                        value={shopinextConfig.merchant_id}
                        onChange={(e) => setShopinextConfig(prev => ({ ...prev, merchant_id: e.target.value }))}
                        placeholder="Mağaza ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shopinext_token">API Token</Label>
                      <Input
                        id="shopinext_token"
                        type="password"
                        value={shopinextConfig.token}
                        onChange={(e) => setShopinextConfig(prev => ({ ...prev, token: e.target.value }))}
                        placeholder="Token"
                      />
                    </div>
                    <Button 
                      onClick={() => updateConfigMutation.mutate({ method: "shopinext", config: shopinextConfig })}
                      disabled={updateConfigMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {updateConfigMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Payizone */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="p-2 bg-muted rounded-lg shrink-0">
                    {paymentIcons.payizone}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base lg:text-lg">{paymentLabels.payizone.title}</CardTitle>
                    <CardDescription className="text-xs lg:text-sm">{paymentLabels.payizone.description}</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={getSettingByMethod("payizone")?.is_active ?? false}
                  onCheckedChange={(checked) => 
                    toggleMutation.mutate({ method: "payizone", is_active: checked })
                  }
                />
              </CardHeader>
              {getSettingByMethod("payizone")?.is_active && (
                <CardContent className="pt-4 border-t">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="payizone_api_key">API Key</Label>
                      <Input
                        id="payizone_api_key"
                        type="password"
                        value={payizoneConfig.api_key}
                        onChange={(e) => setPayizoneConfig(prev => ({ ...prev, api_key: e.target.value }))}
                        placeholder="API anahtarı"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payizone_secret_key">Secret Key</Label>
                      <Input
                        id="payizone_secret_key"
                        type="password"
                        value={payizoneConfig.secret_key}
                        onChange={(e) => setPayizoneConfig(prev => ({ ...prev, secret_key: e.target.value }))}
                        placeholder="Gizli anahtar"
                      />
                    </div>
                    <Button 
                      onClick={() => updateConfigMutation.mutate({ method: "payizone", config: payizoneConfig })}
                      disabled={updateConfigMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {updateConfigMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPayment;