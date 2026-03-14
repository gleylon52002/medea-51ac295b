import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Zap, UserPlus, ShoppingCart, Truck, PackageCheck, Star, Tag, ShoppingBag, LogIn } from "lucide-react";
import { toast } from "sonner";

interface AutomationSetting {
  id: string;
  trigger_type: string;
  trigger_label: string;
  message_template: string;
  is_enabled: boolean;
  variables: string[];
  sort_order: number;
}

const triggerIcons: Record<string, React.ReactNode> = {
  welcome: <UserPlus className="h-5 w-5 text-green-500" />,
  order_confirmed: <ShoppingCart className="h-5 w-5 text-blue-500" />,
  order_shipped: <Truck className="h-5 w-5 text-orange-500" />,
  order_delivered: <PackageCheck className="h-5 w-5 text-emerald-500" />,
  review_request: <Star className="h-5 w-5 text-yellow-500" />,
  promotion: <Tag className="h-5 w-5 text-purple-500" />,
  abandoned_cart: <ShoppingBag className="h-5 w-5 text-red-500" />,
  login_welcome: <LogIn className="h-5 w-5 text-cyan-500" />,
};

const SmsAutomation = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTemplate, setEditTemplate] = useState("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["sms-automation-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_automation_settings" as any)
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as unknown as AutomationSetting[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from("sms_automation_settings" as any)
        .update({ is_enabled, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sms-automation-settings"] });
      toast.success("Otomasyon ayarı güncellendi");
    },
    onError: () => toast.error("Güncelleme başarısız"),
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, message_template }: { id: string; message_template: string }) => {
      const { error } = await supabase
        .from("sms_automation_settings" as any)
        .update({ message_template, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sms-automation-settings"] });
      setEditingId(null);
      toast.success("Mesaj şablonu güncellendi");
    },
    onError: () => toast.error("Şablon güncellenemedi"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Otomatik SMS Tetikleyicileri
          </CardTitle>
          <CardDescription>
            Kullanıcı aksiyonlarına göre otomatik SMS gönderimini açıp kapatın. Mesaj şablonlarını düzenleyebilirsiniz.
          </CardDescription>
        </CardHeader>
      </Card>

      {settings?.map((setting) => (
        <Card key={setting.id} className={`transition-all ${setting.is_enabled ? "border-primary/30 bg-primary/5" : ""}`}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5">
                  {triggerIcons[setting.trigger_type] || <Zap className="h-5 w-5" />}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{setting.trigger_label}</h3>
                    <Badge variant={setting.is_enabled ? "default" : "secondary"} className="text-xs">
                      {setting.is_enabled ? "Aktif" : "Pasif"}
                    </Badge>
                  </div>

                  {editingId === setting.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editTemplate}
                        onChange={(e) => setEditTemplate(e.target.value)}
                        rows={3}
                        className="text-sm"
                      />
                      {setting.variables.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <Label className="text-xs text-muted-foreground mr-1">Değişkenler:</Label>
                          {setting.variables.map((v) => (
                            <Badge key={v} variant="outline" className="text-xs font-mono cursor-pointer"
                              onClick={() => setEditTemplate(prev => prev + `{${v}}`)}>
                              {`{${v}}`}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateTemplateMutation.mutate({ id: setting.id, message_template: editTemplate })}
                          disabled={updateTemplateMutation.isPending}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Kaydet
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          İptal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p
                      className="text-xs text-muted-foreground bg-muted/50 p-2 rounded cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => {
                        setEditingId(setting.id);
                        setEditTemplate(setting.message_template);
                      }}
                      title="Düzenlemek için tıklayın"
                    >
                      {setting.message_template}
                    </p>
                  )}
                </div>
              </div>
              <Switch
                checked={setting.is_enabled}
                onCheckedChange={(checked) => toggleMutation.mutate({ id: setting.id, is_enabled: checked })}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SmsAutomation;
