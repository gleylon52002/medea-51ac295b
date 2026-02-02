import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Percent, Tag, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  applies_to: string;
  category_id: string | null;
  product_ids: string[] | null;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  banner_image: string | null;
  banner_text: string | null;
}

const AdminCampaigns = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState("campaigns");

  const { data: categories } = useCategories();
  const { data: products } = useProducts();

  const [form, setForm] = useState({
    name: "",
    description: "",
    discount_type: "percentage",
    discount_value: 10,
    applies_to: "all",
    category_id: "",
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: "",
    is_active: true,
    banner_text: "",
  });

  // Bulk price update state
  const [bulkUpdate, setBulkUpdate] = useState({
    type: "percentage",
    value: 0,
    operation: "decrease",
    category_id: "all",
  });

  // Profit margin calculator
  const [marginCalc, setMarginCalc] = useState({
    cost: 0,
    margin: 30,
    result: 0,
  });

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["admin", "campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Campaign>) => {
      if (editingCampaign) {
        const { error } = await supabase
          .from("campaigns")
          .update(data as any)
          .eq("id", editingCampaign.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("campaigns").insert(data as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      toast.success(editingCampaign ? "Kampanya güncellendi" : "Kampanya oluşturuldu");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("İşlem başarısız");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      toast.success("Kampanya silindi");
    },
  });

  const bulkPriceMutation = useMutation({
    mutationFn: async () => {
      let query = supabase.from("products").select("id, price, sale_price");
      
      if (bulkUpdate.category_id !== "all") {
        query = query.eq("category_id", bulkUpdate.category_id);
      }

      const { data: productList, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const updates = productList?.map((p) => {
        const currentPrice = Number(p.sale_price || p.price);
        let newPrice: number;

        if (bulkUpdate.type === "percentage") {
          const multiplier = bulkUpdate.operation === "decrease" 
            ? (1 - bulkUpdate.value / 100) 
            : (1 + bulkUpdate.value / 100);
          newPrice = Math.round(currentPrice * multiplier * 100) / 100;
        } else {
          newPrice = bulkUpdate.operation === "decrease"
            ? currentPrice - bulkUpdate.value
            : currentPrice + bulkUpdate.value;
        }

        return { id: p.id, sale_price: Math.max(0, newPrice) };
      }) || [];

      for (const update of updates) {
        const { error } = await supabase
          .from("products")
          .update({ sale_price: update.sale_price })
          .eq("id", update.id);
        if (error) throw error;
      }

      return updates.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`${count} ürün fiyatı güncellendi`);
    },
    onError: () => {
      toast.error("Fiyat güncellemesi başarısız");
    },
  });

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      discount_type: "percentage",
      discount_value: 10,
      applies_to: "all",
      category_id: "",
      starts_at: new Date().toISOString().slice(0, 16),
      ends_at: "",
      is_active: true,
      banner_text: "",
    });
    setEditingCampaign(null);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setForm({
      name: campaign.name,
      description: campaign.description || "",
      discount_type: campaign.discount_type,
      discount_value: campaign.discount_value,
      applies_to: campaign.applies_to,
      category_id: campaign.category_id || "",
      starts_at: campaign.starts_at.slice(0, 16),
      ends_at: campaign.ends_at ? campaign.ends_at.slice(0, 16) : "",
      is_active: campaign.is_active,
      banner_text: campaign.banner_text || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name) {
      toast.error("Kampanya adı gerekli");
      return;
    }

    saveMutation.mutate({
      name: form.name,
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      applies_to: form.applies_to,
      category_id: form.category_id || null,
      starts_at: form.starts_at,
      ends_at: form.ends_at || null,
      is_active: form.is_active,
      banner_text: form.banner_text || null,
    });
  };

  const calculateMargin = () => {
    const sellingPrice = marginCalc.cost / (1 - marginCalc.margin / 100);
    setMarginCalc({ ...marginCalc, result: Math.round(sellingPrice * 100) / 100 });
  };

  const getCampaignStatus = (campaign: Campaign) => {
    if (!campaign.is_active) return { label: "Pasif", variant: "secondary" as const };
    const now = new Date();
    const start = new Date(campaign.starts_at);
    const end = campaign.ends_at ? new Date(campaign.ends_at) : null;
    
    if (start > now) return { label: "Beklemede", variant: "outline" as const };
    if (end && end < now) return { label: "Sona Erdi", variant: "destructive" as const };
    return { label: "Aktif", variant: "default" as const };
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-foreground">Kampanya & Fiyat Yönetimi</h1>
        <p className="text-muted-foreground mt-1">Kampanyalar oluşturun ve toplu fiyat güncellemeleri yapın</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="campaigns">
            <Tag className="h-4 w-4 mr-2" />
            Kampanyalar
          </TabsTrigger>
          <TabsTrigger value="bulk-price">
            <Percent className="h-4 w-4 mr-2" />
            Toplu Fiyat
          </TabsTrigger>
          <TabsTrigger value="margin">
            <Calendar className="h-4 w-4 mr-2" />
            Kar Marjı
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <div className="flex justify-end mb-4">
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Kampanya
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingCampaign ? "Kampanya Düzenle" : "Yeni Kampanya"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Kampanya Adı</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Black Friday, Yılbaşı İndirimi..."
                    />
                  </div>
                  <div>
                    <Label>Açıklama</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>İndirim Tipi</Label>
                      <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Yüzde (%)</SelectItem>
                          <SelectItem value="fixed">Sabit Tutar (₺)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>İndirim Değeri</Label>
                      <Input
                        type="number"
                        value={form.discount_value}
                        onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Uygulama Alanı</Label>
                    <Select value={form.applies_to} onValueChange={(v) => setForm({ ...form, applies_to: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Ürünler</SelectItem>
                        <SelectItem value="category">Belirli Kategori</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.applies_to === "category" && (
                    <div>
                      <Label>Kategori</Label>
                      <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Kategori seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Başlangıç</Label>
                      <Input
                        type="datetime-local"
                        value={form.starts_at}
                        onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Bitiş (opsiyonel)</Label>
                      <Input
                        type="datetime-local"
                        value={form.ends_at}
                        onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Banner Yazısı</Label>
                    <Input
                      value={form.banner_text}
                      onChange={(e) => setForm({ ...form, banner_text: e.target.value })}
                      placeholder="🔥 Black Friday! %50'ye varan indirimler"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.is_active}
                      onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                    />
                    <Label>Aktif</Label>
                  </div>
                  <Button onClick={handleSubmit} className="w-full" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kampanya</TableHead>
                  <TableHead>İndirim</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns?.map((campaign) => {
                  const status = getCampaignStatus(campaign);
                  return (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          {campaign.banner_text && (
                            <p className="text-sm text-muted-foreground">{campaign.banner_text}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {campaign.discount_type === "percentage" 
                          ? `%${campaign.discount_value}` 
                          : `${campaign.discount_value}₺`}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(campaign.starts_at), "d MMM yyyy", { locale: tr })}</p>
                          {campaign.ends_at && (
                            <p className="text-muted-foreground">
                              → {format(new Date(campaign.ends_at), "d MMM yyyy", { locale: tr })}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(campaign)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(campaign.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!campaigns?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Henüz kampanya yok
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="bulk-price">
          <Card>
            <CardHeader>
              <CardTitle>Toplu Fiyat Güncelleme</CardTitle>
              <CardDescription>
                Tüm ürünlere veya belirli bir kategoriye toplu fiyat değişikliği uygulayın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Kategori</Label>
                  <Select value={bulkUpdate.category_id} onValueChange={(v) => setBulkUpdate({ ...bulkUpdate, category_id: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Ürünler</SelectItem>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>İşlem</Label>
                  <Select value={bulkUpdate.operation} onValueChange={(v) => setBulkUpdate({ ...bulkUpdate, operation: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="decrease">İndirim (Düşür)</SelectItem>
                      <SelectItem value="increase">Zam (Artır)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Değişim Tipi</Label>
                  <Select value={bulkUpdate.type} onValueChange={(v) => setBulkUpdate({ ...bulkUpdate, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Yüzde (%)</SelectItem>
                      <SelectItem value="fixed">Sabit Tutar (₺)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Değer</Label>
                  <Input
                    type="number"
                    value={bulkUpdate.value}
                    onChange={(e) => setBulkUpdate({ ...bulkUpdate, value: Number(e.target.value) })}
                    placeholder={bulkUpdate.type === "percentage" ? "10" : "50"}
                  />
                </div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {bulkUpdate.category_id === "all" ? "Tüm ürünlerin" : "Seçili kategorideki ürünlerin"} fiyatları{" "}
                  {bulkUpdate.type === "percentage" 
                    ? `%${bulkUpdate.value}` 
                    : `${bulkUpdate.value}₺`}{" "}
                  {bulkUpdate.operation === "decrease" ? "düşürülecek" : "artırılacak"}.
                </p>
              </div>
              <Button
                onClick={() => bulkPriceMutation.mutate()}
                disabled={bulkPriceMutation.isPending || bulkUpdate.value <= 0}
                className="w-full"
              >
                {bulkPriceMutation.isPending ? "Güncelleniyor..." : "Fiyatları Güncelle"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="margin">
          <Card>
            <CardHeader>
              <CardTitle>Kar Marjı Hesaplayıcı</CardTitle>
              <CardDescription>
                Maliyet ve hedef kar marjına göre satış fiyatı hesaplayın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Maliyet (₺)</Label>
                  <Input
                    type="number"
                    value={marginCalc.cost || ""}
                    onChange={(e) => setMarginCalc({ ...marginCalc, cost: Number(e.target.value) })}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label>Hedef Kar Marjı (%)</Label>
                  <Input
                    type="number"
                    value={marginCalc.margin || ""}
                    onChange={(e) => setMarginCalc({ ...marginCalc, margin: Number(e.target.value) })}
                    placeholder="30"
                  />
                </div>
              </div>
              <Button onClick={calculateMargin} className="w-full">
                Hesapla
              </Button>
              {marginCalc.result > 0 && (
                <div className="bg-primary/10 p-6 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Önerilen Satış Fiyatı</p>
                  <p className="font-serif text-4xl font-bold text-primary mt-2">
                    {marginCalc.result.toFixed(2)}₺
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Kar: {(marginCalc.result - marginCalc.cost).toFixed(2)}₺
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCampaigns;
