import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FileText, Search, TrendingUp, Filter, Download } from "lucide-react";
import { generateProfessionalInvoice, generateSampleInvoice } from "@/lib/professionalInvoiceGenerator";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const statusLabels: Record<string, string> = {
  pending: "Beklemede", confirmed: "Onaylandı", preparing: "Hazırlanıyor",
  shipped: "Kargoda", delivered: "Teslim Edildi", cancelled: "İptal",
};

const AdminInvoices = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch ALL orders with items for invoicing
  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-invoices-all-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Also fetch invoices table for stored invoices
  const { data: storedInvoices } = useQuery({
    queryKey: ["admin-stored-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const invoiceMap = new Map((storedInvoices || []).map(inv => [inv.order_id, inv]));

  const filteredOrders = (orders || []).filter((order: any) => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = filteredOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0);

  const handleDownloadInvoice = (order: any) => {
    generateProfessionalInvoice(order);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-foreground">Faturalar</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">
            Tüm siparişlere ait faturaları görüntüleyin ve indirin
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Toplam Ciro</p>
                <p className="text-xl font-bold text-primary">{formatPrice(totalRevenue)}</p>
              </div>
            </CardContent>
          </Card>
          <Button variant="outline" onClick={generateSampleInvoice}>
            <Download className="h-4 w-4 mr-2" /> Örnek Fatura
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <CardTitle>Fatura Listesi ({filteredOrders.length} sipariş)</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Sipariş No Ara..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fatura No</TableHead>
                <TableHead>Sipariş No</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>İndir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order: any) => {
                const inv = invoiceMap.get(order.id);
                const shipping = order.shipping_address as any;
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      {inv ? inv.invoice_number : `INV-${order.order_number}`}
                    </TableCell>
                    <TableCell className="font-medium">#{order.order_number}</TableCell>
                    <TableCell>{shipping?.full_name || "—"}</TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString('tr-TR')}</TableCell>
                    <TableCell className="font-semibold">{formatPrice(Number(order.total))}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDownloadInvoice(order)}>
                        <FileText className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Kayıt bulunamadı</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInvoices;
