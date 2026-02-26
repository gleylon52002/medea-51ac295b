import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { useSellerTransactions, useSellerProfile } from "@/hooks/useSeller";
import { useEscrow, usePayoutRequests, useCreatePayoutRequest } from "@/hooks/useEscrow";
import { generateProfessionalInvoice } from "@/lib/professionalInvoiceGenerator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, Clock, CheckCircle, CalendarDays, ArrowRightLeft, Loader2, Send, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const SellerEarnings = () => {
  const { data: seller, isLoading: sellerLoading } = useSellerProfile();
  const { data: transactions, isLoading: transactionsLoading } = useSellerTransactions();
  const { data: escrow, isLoading: escrowLoading } = useEscrow();
  const { data: payoutRequests } = usePayoutRequests();
  const createPayoutRequest = useCreatePayoutRequest();

  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState("");

  if (sellerLoading || transactionsLoading || escrowLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const handleRequestPayout = async () => {
    const amount = parseFloat(requestAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Geçerli bir tutar giriniz.");
      return;
    }

    if (amount > (escrow?.available_balance || 0)) {
      toast.error("Yetersiz kullanılabilir bakiye.");
      return;
    }

    if (!seller?.iban) {
      toast.error("Lütfen önce ayarlar sayfasından IBAN bilginizi giriniz.");
      return;
    }

    try {
      await createPayoutRequest.mutateAsync({
        amount,
        bankInfo: {
          bank_name: seller.bank_name,
          iban: seller.iban,
          account_holder: seller.account_holder
        }
      });
      setIsRequestOpen(false);
      setRequestAmount("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const totalCommission = transactions?.reduce((sum, t) => sum + t.commission_amount, 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kazanç Yönetimi</h1>
          <p className="text-muted-foreground">Ödeme havuzu ve finansal hareketlerinizi takip edin</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-primary border-primary">
            <CalendarDays className="h-3 w-3 mr-1" />
            Ödeme Planı: {escrow?.payout_frequency === 'weekly' ? 'Haftalık' : 'Aylık'}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Kullanılabilir Bakiye
              </CardTitle>
              <CardDescription className="text-[10px]">Hemen çekilebilir tutar</CardDescription>
            </div>
            <Wallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-green-600">
                {formatPrice(escrow?.available_balance || 0)}
              </div>
              <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 gap-2" disabled={!escrow?.available_balance || escrow.available_balance <= 0}>
                    <Send className="h-3 w-3" />
                    Para Çek
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Para Çekme Talebi</DialogTitle>
                    <DialogDescription>
                      Kullanılabilir bakiyenizi kayıtlı banka hesabınıza aktarabilirsiniz.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Çekilecek Tutar (TL)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={requestAmount}
                        onChange={(e) => setRequestAmount(e.target.value)}
                      />
                      <p className="text-[10px] text-muted-foreground italic">
                        Maksimum: {formatPrice(escrow?.available_balance || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Aktarılacak Hesap</p>
                      <p className="text-sm font-medium">{seller?.bank_name}</p>
                      <p className="text-xs font-mono">{seller?.iban}</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRequestOpen(false)}>İptal</Button>
                    <Button onClick={handleRequestPayout} disabled={createPayoutRequest.isPending}>
                      {createPayoutRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Talebi Gönder
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Havuzdaki Bakiye (Escrow)
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatPrice(escrow?.pending_balance || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">İade süreci bekleyen tutar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gelecek Ödeme Tarihi
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {escrow?.next_payout_date ? new Date(escrow.next_payout_date).toLocaleDateString('tr-TR') : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Planlanan transfer tarihi</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions & Payouts */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="transactions">
            <TabsList>
              <TabsTrigger value="transactions">İşlem Geçmişi</TabsTrigger>
              <TabsTrigger value="payouts">Ödeme Talepleri</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {transactions?.length === 0 ? (
                    <div className="text-center py-8">
                      <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Henüz işlem yok</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions?.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-transparent hover:border-primary/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {transaction.status === "completed" ? (
                              <div className="p-2 rounded-lg bg-green-100">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </div>
                            ) : (
                              <div className="p-2 rounded-lg bg-yellow-100">
                                <Clock className="h-4 w-4 text-yellow-600" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">
                                Hakediş: {formatPrice(transaction.net_amount)}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Tarih: {new Date(transaction.created_at).toLocaleString("tr-TR")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={transaction.status === "completed" ? "outline" : "secondary"}
                              className={transaction.status === "completed" ? "text-green-600 border-green-200" : ""}
                            >
                              {transaction.status === "completed" ? "Hesaba Geçti" :
                                transaction.status === "pending" ? "Havuzda" :
                                  transaction.status === "refunded" ? "İade Edildi" : "İptal"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payouts" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {payoutRequests?.length === 0 ? (
                    <div className="text-center py-8">
                      <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Henüz ödeme talebi yok</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payoutRequests?.map((request: any) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-transparent hover:border-primary/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${request.status === 'paid' ? 'bg-green-100' :
                              request.status === 'rejected' ? 'bg-red-100' : 'bg-blue-100'
                              }`}>
                              <ArrowRightLeft className={`h-4 w-4 ${request.status === 'paid' ? 'text-green-600' :
                                request.status === 'rejected' ? 'text-red-600' : 'text-blue-600'
                                }`} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                Ödeme: {formatPrice(request.amount)}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Talep: {new Date(request.created_at).toLocaleString("tr-TR")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant="outline"
                              className={`${request.status === 'paid' ? 'text-green-600 border-green-200' :
                                request.status === 'pending' ? 'text-blue-600 border-blue-200' :
                                  request.status === 'rejected' ? 'text-red-600 border-red-200' : ''
                                }`}
                            >
                              {request.status === 'paid' ? 'Ödendi' :
                                request.status === 'pending' ? 'Bekliyor' :
                                  request.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Bank & Payout Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Ödeme Hesabı</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Banka</p>
                    <p className="font-medium text-sm">{seller?.bank_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">IBAN</p>
                    <p className="font-medium font-mono text-xs break-all">{seller?.iban || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Hesap Sahibi</p>
                    <p className="font-medium text-sm">{seller?.account_holder || '-'}</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full text-xs h-8" asChild>
                <Link to="/satici/ayarlar">Bilgileri Güncelle</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-sm">Kesinti Raporu</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Toplam Komisyon: {formatPrice(totalCommission)} (%{seller?.commission_rate || 0})
                  </p>
                  <Button variant="link" className="p-0 h-auto text-xs mt-2" onClick={() => {
                    // Generate commission report PDF using jsPDF
                    import('jspdf').then(({ default: jsPDF }) => {
                      import('jspdf-autotable').then(({ default: autoTable }) => {
                        const doc = new jsPDF();
                        doc.setFontSize(18);
                        doc.text("Komisyon Kesinti Raporu", 14, 22);
                        doc.setFontSize(10);
                        doc.text(`Magaza: ${seller?.company_name || '-'}`, 14, 32);
                        doc.text(`Komisyon Orani: %${seller?.commission_rate || 0}`, 14, 38);
                        doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 14, 44);

                        const tableData = transactions?.map(t => [
                          new Date(t.created_at).toLocaleDateString('tr-TR'),
                          t.product?.name || '-',
                          formatPrice(t.sale_amount),
                          `%${t.commission_rate}`,
                          formatPrice(t.commission_amount),
                          formatPrice(t.net_amount)
                        ]) || [];

                        autoTable(doc, {
                          startY: 52,
                          head: [['Tarih', 'Urun', 'Satis', 'Oran', 'Komisyon', 'Net']],
                          body: tableData,
                        });

                        doc.save(`Komisyon-Raporu-${new Date().toISOString().split('T')[0]}.pdf`);
                        toast.success("Rapor indirildi");
                      });
                    });
                  }}>
                    <Download className="h-3 w-3 mr-1" />
                    Detayli Fatura indir (PDF)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SellerEarnings;
