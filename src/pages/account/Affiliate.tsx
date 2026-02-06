import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet, useAffiliate, useWalletTransactions } from "@/hooks/useAffiliate";
import { Wallet, Copy, Share2, TrendingUp, Users, History, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const AffiliatePage = () => {
    const { data: wallet, isLoading: walletLoading } = useWallet();
    const { referralLink, generateLink } = useAffiliate();
    const { data: transactions, isLoading: txLoading } = useWalletTransactions();
    const [copied, setCopied] = useState(false);

    const handleCopyLink = () => {
        if (!referralLink.data) return;
        const link = `${window.location.origin}?ref=${referralLink.data.code}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        toast.success("Referans linki kopyalandı!");
        setTimeout(() => setCopied(false), 2000);
    };

    if (walletLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-serif text-2xl font-medium">Referans Programı</h2>
                    <p className="text-muted-foreground text-sm">Arkadaşlarınızı davet edin, alışverişlerinden kazanın!</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Wallet Balance */}
                <Card className="bg-primary text-primary-foreground">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 opacity-90">
                            <Wallet className="h-4 w-4" />
                            Cüzdan Bakiyesi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {wallet?.balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </div>
                        <p className="text-xs mt-1 opacity-80">Kazandığınız bakiyeyi alışverişlerinizde kullanabilirsiniz.</p>
                    </CardContent>
                </Card>

                {/* Affiliate Link */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Share2 className="h-4 w-4 text-primary" />
                            Referans Linkiniz
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {referralLink.data ? (
                            <div className="flex gap-2">
                                <div className="bg-muted px-3 py-2 rounded border text-sm flex-1 font-mono truncate">
                                    {`REF CODE: ${referralLink.data.code}`}
                                </div>
                                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                                    {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        ) : (
                            <Button
                                onClick={() => generateLink.mutate()}
                                disabled={generateLink.isPending}
                                className="w-full"
                            >
                                {generateLink.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Link Oluştur"}
                            </Button>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Toplam Tıklama: {referralLink.data?.clicks || 0}</span>
                            <Badge variant="secondary">Aktif</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                        <h4 className="font-bold">Paylaş</h4>
                        <p className="text-xs text-muted-foreground mt-1">Linkinizi sosyal medyada veya arkadaşlarınızla paylaşın.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <ShoppingCart className="h-8 w-8 mx-auto text-green-500 mb-2" />
                        <h4 className="font-bold">Alışveriş</h4>
                        <p className="text-xs text-muted-foreground mt-1">Arkadaşınız linkinizle gelip ilk alışverişini yapsın.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <TrendingUp className="h-8 w-8 mx-auto text-primary mb-2" />
                        <h4 className="font-bold">Kazan</h4>
                        <p className="text-xs text-muted-foreground mt-1">Sipariş tutarının %5'i anında cüzdanınıza eklensin.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <History className="h-5 w-5" />
                        İşlem Geçmişi
                    </CardTitle>
                    <CardDescription>Cüzdan hareketleriniz ve referans kazançlarınız</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {transactions?.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground italic text-sm">
                                Henüz bir işlem bulunmuyor.
                            </div>
                        ) : (
                            transactions?.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/30 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium">{tx.description}</p>
                                        <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
                                    </div>
                                    <div className={cn("font-bold text-sm", tx.transaction_type === 'credit' ? "text-green-600" : "text-red-600")}>
                                        {tx.transaction_type === 'credit' ? '+' : '-'} {tx.amount} TL
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// Simple icon imports for the page logic
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

export default AffiliatePage;
