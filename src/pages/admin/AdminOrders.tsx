import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Search, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  preparing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-purple-100 text-purple-700",
  shipped: "bg-cyan-100 text-cyan-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const paymentLabels: Record<string, string> = {
  credit_card: "Kredi Kartı",
  bank_transfer: "Havale/EFT",
  cash_on_delivery: "Kapıda Ödeme",
};

const AdminOrders = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: shippingCompanies } = useQuery({
    queryKey: ["shipping-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_companies")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: status as Order["status"] })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Sipariş durumu güncellendi");
    },
    onError: () => {
      toast.error("Güncelleme başarısız");
    },
  });

  const updateShippingMutation = useMutation({
    mutationFn: async ({ id, tracking_number, shipping_company }: {
      id: string;
      tracking_number: string;
      shipping_company: string;
    }) => {
      const { error } = await supabase
        .from("orders")
        .update({
          tracking_number,
          shipping_company,
          status: "shipped" as Order["status"]
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Kargo bilgileri eklendi");
      setIsShippingOpen(false);
    },
    onError: () => {
      toast.error("Güncelleme başarısız");
    },
  });

  const filteredOrders = orders?.filter((o) => {
    const matchesSearch = o.order_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleShippingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const formData = new FormData(e.currentTarget);
    updateShippingMutation.mutate({
      id: selectedOrder.id,
      tracking_number: formData.get("tracking_number") as string,
      shipping_company: formData.get("shipping_company") as string,
    });
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-foreground">Siparişler</h1>
        <p className="text-muted-foreground mt-1">Siparişlerinizi yönetin ve takip edin</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sipariş no ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Durum filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sipariş No</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Tutar</TableHead>
              <TableHead>Ödeme</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="w-32">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Yükleniyor...
                </TableCell>
              </TableRow>
            ) : filteredOrders && filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.order_number}</TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString("tr-TR")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(Number(order.total))}
                  </TableCell>
                  <TableCell>{paymentLabels[order.payment_method]}</TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value) => updateStatusMutation.mutate({ id: order.id, status: value })}
                    >
                      <SelectTrigger className={`w-36 ${statusColors[order.status]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setSelectedOrder(order); setIsShippingOpen(true); }}
                      >
                        <Truck className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Sipariş bulunamadı
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sipariş Detayı - #{selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tarih</p>
                  <p className="font-medium">
                    {new Date(selectedOrder.created_at).toLocaleString("tr-TR")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Durum</p>
                  <span className={`px-2 py-1 rounded text-xs ${statusColors[selectedOrder.status]}`}>
                    {statusLabels[selectedOrder.status]}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ödeme Yöntemi</p>
                  <p className="font-medium">{paymentLabels[selectedOrder.payment_method]}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Toplam</p>
                  <p className="font-medium">{formatPrice(Number(selectedOrder.total))}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Teslimat Adresi</p>
                <div className="bg-muted p-3 rounded-lg text-sm">
                  {selectedOrder.shipping_address && typeof selectedOrder.shipping_address === 'object' ? (
                    <>
                      <p className="font-medium">{(selectedOrder.shipping_address as any).full_name || 'İsimsiz'}</p>
                      <p>{(selectedOrder.shipping_address as any).address || 'Adres bilgisi yok'}</p>
                      <p>
                        {(selectedOrder.shipping_address as any).district || ''}
                        {(selectedOrder.shipping_address as any).city ? `, ${(selectedOrder.shipping_address as any).city}` : ''}
                      </p>
                      <p>{(selectedOrder.shipping_address as any).phone || ''}</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground italic">Adres bilgisi mevcut değil</p>
                  )}
                </div>
              </div>

              {selectedOrder.tracking_number && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Kargo Bilgileri</p>
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <p><span className="text-muted-foreground">Firma:</span> {selectedOrder.shipping_company}</p>
                    <p><span className="text-muted-foreground">Takip No:</span> {selectedOrder.tracking_number}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">Ürünler</p>
                <div className="border rounded-lg divide-y">
                  {(selectedOrder as any).order_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 p-3">
                      <div className="w-12 h-12 bg-muted rounded overflow-hidden">
                        {item.product_image && (
                          <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">{item.quantity} adet</p>
                      </div>
                      <p className="font-medium">{formatPrice(Number(item.total_price))}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Shipping Dialog */}
      <Dialog open={isShippingOpen} onOpenChange={setIsShippingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kargo Bilgileri Ekle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleShippingSubmit} className="space-y-4">
            <div>
              <Label htmlFor="shipping_company">Kargo Firması</Label>
              <Select name="shipping_company" defaultValue={selectedOrder?.shipping_company || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Kargo firması seçin" />
                </SelectTrigger>
                <SelectContent>
                  {shippingCompanies?.map((company) => (
                    <SelectItem key={company.id} value={company.name}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tracking_number">Takip Numarası</Label>
              <Input
                id="tracking_number"
                name="tracking_number"
                defaultValue={selectedOrder?.tracking_number || ""}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsShippingOpen(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={updateShippingMutation.isPending}>
                Kaydet ve Kargoya Ver
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
