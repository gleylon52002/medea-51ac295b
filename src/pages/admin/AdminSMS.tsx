import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, MessageSquare, Settings, History, Eye, Send } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  useSmsTemplates,
  useSmsSettings,
  useSmsLogs,
  useCreateSmsTemplate,
  useUpdateSmsTemplate,
  useDeleteSmsTemplate,
  useUpdateSmsSettings,
  SmsTemplate,
} from "@/hooks/useSmsTemplates";

const templateTypeLabels: Record<string, string> = {
  order_confirmed: "Sipariş Onayı",
  order_shipped: "Kargo Bildirimi",
  order_delivered: "Teslim Bildirimi",
  cart_reminder: "Sepet Hatırlatma",
  welcome: "Hoş Geldiniz",
  stock_alert: "Stok Bildirimi",
  campaign: "Kampanya",
  refund: "İade",
  custom: "Özel",
};

const providerLabels: Record<string, string> = {
  netgsm: "NetGSM",
  ileti_merkezi: "İleti Merkezi",
  twilio: "Twilio",
};

const TemplateForm = ({
  template,
  onSave,
  onClose,
}: {
  template?: SmsTemplate;
  onSave: (data: any) => void;
  onClose: () => void;
}) => {
  const [name, setName] = useState(template?.name || "");
  const [content, setContent] = useState(template?.content || "");
  const [templateType, setTemplateType] = useState(template?.template_type || "custom");
  const [variables, setVariables] = useState(template?.variables?.join(", ") || "");
  const [isActive, setIsActive] = useState(template?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(template?.id ? { id: template.id } : {}),
      name,
      content,
      template_type: templateType,
      variables: variables.split(",").map((v) => v.trim()).filter(Boolean),
      is_active: isActive,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Şablon Adı</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Şablon Tipi</Label>
        <Select value={templateType} onValueChange={setTemplateType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(templateTypeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Mesaj İçeriği</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          required
          placeholder="Sayın {musteri_adi}, siparişiniz..."
        />
        <p className="text-xs text-muted-foreground">
          Değişkenler: {"{musteri_adi}"}, {"{siparis_no}"}, {"{toplam}"}, {"{takip_no}"} vb.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Değişkenler (virgülle ayırın)</Label>
        <Input
          value={variables}
          onChange={(e) => setVariables(e.target.value)}
          placeholder="musteri_adi, siparis_no, toplam"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isActive} onCheckedChange={setIsActive} />
        <Label>Aktif</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
        <Button type="submit">{template ? "Güncelle" : "Oluştur"}</Button>
      </div>
    </form>
  );
};

const TemplatePreview = ({ template }: { template: SmsTemplate }) => {
  const sampleVars: Record<string, string> = {
    musteri_adi: "Ahmet Yılmaz",
    siparis_no: "MDA-A1B2C3-D4E5",
    toplam: "299.90",
    takip_no: "1234567890",
    kargo_firmasi: "Yurtiçi Kargo",
    urun_sayisi: "3",
    urun_adi: "Argan Yağı Serumu",
    link: "https://medea.com",
    kampanya_adi: "Yaz İndirimi",
    kampanya_detay: "%30'a varan indirimler",
    tutar: "149.90",
  };

  let preview = template.content;
  Object.entries(sampleVars).forEach(([key, val]) => {
    preview = preview.replace(new RegExp(`\\{${key}\\}`, "g"), val);
  });

  return (
    <div className="p-4 bg-muted rounded-lg border">
      <p className="text-sm font-medium mb-2">Önizleme:</p>
      <p className="text-sm">{preview}</p>
      <p className="text-xs text-muted-foreground mt-2">
        Karakter: {preview.length} | SMS: {Math.ceil(preview.length / 160)}
      </p>
    </div>
  );
};

const AdminSMS = () => {
  const { data: templates, isLoading: templatesLoading } = useSmsTemplates();
  const { data: settings, isLoading: settingsLoading } = useSmsSettings();
  const { data: logs, isLoading: logsLoading } = useSmsLogs();

  const createTemplate = useCreateSmsTemplate();
  const updateTemplate = useUpdateSmsTemplate();
  const deleteTemplate = useDeleteSmsTemplate();
  const updateSettings = useUpdateSmsSettings();

  const [templateDialog, setTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | undefined>();
  const [previewTemplate, setPreviewTemplate] = useState<SmsTemplate | null>(null);

  const handleSaveTemplate = (data: any) => {
    if (data.id) {
      updateTemplate.mutate(data);
    } else {
      createTemplate.mutate(data);
    }
  };

  const handleEditTemplate = (template: SmsTemplate) => {
    setEditingTemplate(template);
    setTemplateDialog(true);
  };

  const handleCloseDialog = () => {
    setTemplateDialog(false);
    setEditingTemplate(undefined);
  };

  const handleProviderConfigChange = (settingId: string, currentConfig: Record<string, string>, key: string, value: string) => {
    updateSettings.mutate({
      id: settingId,
      config: { ...currentConfig, [key]: value } as any,
    });
  };

  if (templatesLoading || settingsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SMS Yönetimi</h1>
        <p className="text-muted-foreground">SMS şablonları, sağlayıcı ayarları ve gönderim geçmişi</p>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Şablonlar
          </TabsTrigger>
          <TabsTrigger value="test" className="gap-2">
            <Send className="h-4 w-4" />
            Test Gönder
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Sağlayıcılar
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <History className="h-4 w-4" />
            Gönderim Geçmişi
          </TabsTrigger>
        </TabsList>

        {/* Test SMS Tab */}
        <TabsContent value="test" className="space-y-4">
          <TestSendPanel />
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {templates?.length || 0} şablon tanımlı
            </p>
            <Dialog open={templateDialog} onOpenChange={(open) => {
              if (!open) handleCloseDialog();
              else setTemplateDialog(true);
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingTemplate(undefined)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Şablon
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingTemplate ? "Şablonu Düzenle" : "Yeni SMS Şablonu"}</DialogTitle>
                </DialogHeader>
                <TemplateForm
                  template={editingTemplate}
                  onSave={handleSaveTemplate}
                  onClose={handleCloseDialog}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {templates?.map((template) => (
              <Card key={template.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "Aktif" : "Pasif"}
                      </Badge>
                      <Badge variant="outline">
                        {templateTypeLabels[template.template_type] || template.template_type}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setPreviewTemplate(previewTemplate?.id === template.id ? null : template)
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditTemplate(template)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteTemplate.mutate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{template.content}</p>
                  {template.variables?.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {template.variables.map((v) => (
                        <Badge key={v} variant="outline" className="text-xs">
                          {"{" + v + "}"}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {previewTemplate?.id === template.id && (
                    <TemplatePreview template={template} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          {settings?.map((setting) => (
            <Card key={setting.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{providerLabels[setting.provider] || setting.provider}</CardTitle>
                    <CardDescription>
                      {setting.provider === "netgsm" && "Türkiye'nin lider SMS altyapı sağlayıcısı"}
                      {setting.provider === "ileti_merkezi" && "Toplu SMS ve bildirim platformu"}
                      {setting.provider === "twilio" && "Global iletişim API platformu"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Aktif</Label>
                    <Switch
                      checked={setting.is_active}
                      onCheckedChange={(checked) =>
                        updateSettings.mutate({ id: setting.id, is_active: checked })
                      }
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {setting.provider === "netgsm" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Kullanıcı Adı</Label>
                        <Input
                          value={(setting.config as any)?.username || ""}
                          onChange={(e) =>
                            handleProviderConfigChange(setting.id, setting.config, "username", e.target.value)
                          }
                          placeholder="NetGSM kullanıcı adı"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Şifre</Label>
                        <Input
                          type="password"
                          value={(setting.config as any)?.password || ""}
                          onChange={(e) =>
                            handleProviderConfigChange(setting.id, setting.config, "password", e.target.value)
                          }
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Gönderici Adı (Başlık)</Label>
                      <Input
                        value={(setting.config as any)?.sender || ""}
                        onChange={(e) =>
                          handleProviderConfigChange(setting.id, setting.config, "sender", e.target.value)
                        }
                        placeholder="MEDEA"
                      />
                    </div>
                  </>
                )}

                {setting.provider === "ileti_merkezi" && (
                  <>
                    <div className="space-y-2">
                      <Label>API Anahtarı</Label>
                      <Input
                        type="password"
                        value={(setting.config as any)?.api_key || ""}
                        onChange={(e) =>
                          handleProviderConfigChange(setting.id, setting.config, "api_key", e.target.value)
                        }
                        placeholder="API anahtarınız"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gönderici Adı</Label>
                      <Input
                        value={(setting.config as any)?.sender || ""}
                        onChange={(e) =>
                          handleProviderConfigChange(setting.id, setting.config, "sender", e.target.value)
                        }
                        placeholder="MEDEA"
                      />
                    </div>
                  </>
                )}

                {setting.provider === "twilio" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Account SID</Label>
                        <Input
                          value={(setting.config as any)?.account_sid || ""}
                          onChange={(e) =>
                            handleProviderConfigChange(setting.id, setting.config, "account_sid", e.target.value)
                          }
                          placeholder="AC..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Auth Token</Label>
                        <Input
                          type="password"
                          value={(setting.config as any)?.auth_token || ""}
                          onChange={(e) =>
                            handleProviderConfigChange(setting.id, setting.config, "auth_token", e.target.value)
                          }
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Gönderici Numara</Label>
                      <Input
                        value={(setting.config as any)?.from_number || ""}
                        onChange={(e) =>
                          handleProviderConfigChange(setting.id, setting.config, "from_number", e.target.value)
                        }
                        placeholder="+905..."
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Gönderim Geçmişi</CardTitle>
              <CardDescription>Son gönderilen SMS'ler</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <Skeleton className="h-48" />
              ) : !logs?.length ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Henüz SMS gönderilmemiş</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>İçerik</TableHead>
                      <TableHead>Sağlayıcı</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(log.created_at), "dd.MM.yyyy HH:mm", { locale: tr })}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.phone}</TableCell>
                        <TableCell className="max-w-xs truncate text-sm">{log.content}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {providerLabels[log.provider] || log.provider}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={log.status === "sent" ? "default" : log.status === "failed" ? "destructive" : "secondary"}
                          >
                            {log.status === "sent" ? "Gönderildi" : log.status === "failed" ? "Başarısız" : "Beklemede"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSMS;
