import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSellerTransactions, useSellerProfile } from "@/hooks/useSeller";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, Clock, CheckCircle } from "lucide-react";

const SellerEarnings = () => {
  const { data: seller, isLoading: sellerLoading } = useSellerProfile();
  const { data: transactions, isLoading: transactionsLoading } = useSellerTransactions();

  if (sellerLoading || transactionsLoading) {
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

  const completedTransactions = transactions?.filter(t => t.status === "completed") || [];
  const pendingTransactions = transactions?.filter(t => t.status === "pending") || [];
  
  const totalEarnings = completedTransactions.reduce((sum, t) => sum + t.net_amount, 0);
  const pendingEarnings = pendingTransactions.reduce((sum, t) => sum + t.net_amount, 0);
  const totalCommission = transactions?.reduce((sum, t) => sum + t.commission_amount, 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kazançlarım</h1>
        <p className="text-muted-foreground">Satış ve kazanç detaylarınızı görüntüleyin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Kazanç
            </CardTitle>
            <Wallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPrice(totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">Ödenen kazançlar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bekleyen Kazanç
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatPrice(pendingEarnings)}</div>
            <p className="text-xs text-muted-foreground">Onay bekleyen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Komisyon
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalCommission)}</div>
            <p className="text-xs text-muted-foreground">%{seller?.commission_rate} oran</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>İşlem Geçmişi</CardTitle>
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
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
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
                        Satış: {formatPrice(transaction.sale_amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Komisyon: {formatPrice(transaction.commission_amount)} (%{transaction.commission_rate})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleString("tr-TR")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      +{formatPrice(transaction.net_amount)}
                    </p>
                    <Badge 
                      variant={transaction.status === "completed" ? "default" : "secondary"}
                      className={transaction.status === "completed" ? "bg-green-500" : ""}
                    >
                      {transaction.status === "completed" ? "Ödendi" : 
                       transaction.status === "pending" ? "Bekliyor" :
                       transaction.status === "refunded" ? "İade" : "İptal"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Info */}
      <Card>
        <CardHeader>
          <CardTitle>Ödeme Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Banka</p>
              <p className="font-medium">{seller?.bank_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">IBAN</p>
              <p className="font-medium font-mono text-sm">{seller?.iban}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hesap Sahibi</p>
              <p className="font-medium">{seller?.account_holder}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerEarnings;
