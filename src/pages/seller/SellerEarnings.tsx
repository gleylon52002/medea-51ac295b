import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSellerTransactions, useSellerProfile } from "@/hooks/useSeller";
import { useEscrow } from "@/hooks/useEscrow";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, Clock, CheckCircle, CalendarDays, ArrowRightLeft } from "lucide-react";

const SellerEarnings = () => {
  const { data: seller, isLoading: sellerLoading } = useSellerProfile();
  const { data: transactions, isLoading: transactionsLoading } = useSellerTransactions();
  const { data: escrow, isLoading: escrowLoading } = useEscrow();

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

  const totalCommission = transactions?.reduce((sum, t) => sum + t.commission_amount, 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kazanç Yönetimi</h1>
          <p className="text-muted-foreground">Ödeme havuzu ve finansal hareketlerinizi takip edin</p>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          <CalendarDays className="h-3 w-3 mr-1" />
          Ödeme Planı: {escrow?.payout_frequency === 'weekly' ? 'Haftalık' : 'Aylık'}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kullanılabilir Bakiye
            </CardTitle>
            <Wallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(escrow?.available_balance || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Hemen çekilebilir / Alacak</p>
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
        {/* Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              İşlem Geçmişi
            </CardTitle>
            <CardDescription>Sipariş bazlı kazanç ve komisyon detayları</CardDescription>
          </CardHeader>
          <CardContent>
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

        {/* Bank & Payout Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ödeme Hesabı</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Banka</p>
                <p className="font-medium">{seller?.bank_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">IBAN</p>
                <p className="font-medium font-mono text-sm">{seller?.iban || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Hesap Sahibi</p>
                <p className="font-medium">{seller?.account_holder || '-'}</p>
              </div>
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
                  <Button variant="link" className="p-0 h-auto text-xs mt-2">Detaylı Fatura indir (PDF)</Button>
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
