import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSellerTransactions, useSellerProfile } from "@/hooks/useSeller";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FileText, Download, TrendingDown } from "lucide-react";
import { generateInvoicePDF } from "@/lib/invoiceGenerator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const SellerInvoices = () => {
    const { data: transactions, isLoading } = useSellerTransactions();
    const { data: seller } = useSellerProfile();

    if (isLoading) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64" />
            </div>
        );
    }

    // Group transactions by Order
    // Each order might have multiple items (transactions), but we usually invoice per order
    const orders = transactions?.reduce((acc: any[], transaction: any) => {
        const existingOrder = acc.find(o => o.order_id === transaction.order_id);
        if (!existingOrder) {
            if (transaction.order) {
                acc.push({
                    ...transaction.order,
                    transactions: [transaction],
                    order_id: transaction.order_id
                });
            }
        } else {
            existingOrder.transactions.push(transaction);
        }
        return acc;
    }, []) || [];

    const handleDownloadInvoice = (order: any) => {
        generateInvoicePDF(order, seller);
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Faturalarım</h1>
                <p className="text-muted-foreground">Satış faturalarınızı ve komisyon dökümlerini görüntüleyin</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Fatura Listesi</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sipariş No</TableHead>
                                <TableHead>Tarih</TableHead>
                                <TableHead>Tutar</TableHead>
                                <TableHead>Komisyon Kesintisi</TableHead>
                                <TableHead>Net Kazanç</TableHead>
                                <TableHead>İşlem</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order: any) => {
                                const totalSale = order.transactions.reduce((sum: number, t: any) => sum + t.sale_amount, 0);
                                const totalCommission = order.transactions.reduce((sum: number, t: any) => sum + t.commission_amount, 0);
                                const totalNet = order.transactions.reduce((sum: number, t: any) => sum + t.net_amount, 0);

                                return (
                                    <TableRow key={order.order_id}>
                                        <TableCell className="font-medium text-purple-600">
                                            #{order.order_number}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(order.created_at).toLocaleDateString('tr-TR')}
                                        </TableCell>
                                        <TableCell>{formatPrice(totalSale)}</TableCell>
                                        <TableCell className="text-red-500 flex items-center gap-1">
                                            <TrendingDown className="w-3 h-3" />
                                            {formatPrice(totalCommission)}
                                        </TableCell>
                                        <TableCell className="text-green-600 font-bold">
                                            {formatPrice(totalNet)}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2"
                                                onClick={() => handleDownloadInvoice(order)}
                                            >
                                                <FileText className="w-4 h-4" />
                                                Fatura İndir
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {orders.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Henüz fatura bulunmuyor
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default SellerInvoices;
