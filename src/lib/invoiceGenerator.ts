import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'] & {
    order_items?: any[];
};

export const generateInvoicePDF = (order: any, seller?: any) => {
    const doc = new jsPDF();

    // Fonts support (basic)
    // For extensive Turkish character support, custom fonts might be needed in a real app
    // but standard fonts often handle basic chars. We'll stick to standard for now.

    // Header
    doc.setFontSize(20);
    doc.text('FATURA / INVOICE', 105, 20, { align: 'center' });

    // Company Info (Platform or Seller)
    doc.setFontSize(10);
    doc.text('Medea Pazaryeri', 14, 30);
    doc.text('Istanbul, Turkiye', 14, 35);
    doc.text('info@medea.com', 14, 40);

    // Invoice Details
    doc.text(`Fatura No: INV-${order.order_number}`, 140, 30);
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 140, 35);
    doc.text(`Sipariş No: ${order.order_number}`, 140, 40);

    // Customer Info
    const shippingAddress = typeof order.shipping_address === 'string'
        ? JSON.parse(order.shipping_address)
        : order.shipping_address;

    doc.text('Müşteri:', 14, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(shippingAddress?.full_name || 'Sayın Müşteri', 14, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(shippingAddress?.address || '', 14, 65);
    doc.text(`${shippingAddress?.district || ''} / ${shippingAddress?.city || ''}`, 14, 70);
    doc.text(shippingAddress?.phone || '', 14, 75);

    // Items Table
    const tableColumn = ["Ürün", "Adet", "Birim Fiyat", "Toplam"];
    const tableRows: any[] = [];

    const items = order.order_items || order.items || [];

    items.forEach((item: any) => {
        // If identifying a specific seller's items for a seller-specific invoice
        if (seller && item.product?.seller_id !== seller.id) return;

        const name = item.product_name || item.product?.name;
        const quantity = item.quantity;
        const price = item.unit_price;
        const total = item.total_price;

        tableRows.push([
            name,
            quantity,
            new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(price),
            new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(total)
        ]);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 85,
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] }
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.text(`Ara Toplam: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(order.subtotal)}`, 140, finalY);
    doc.text(`Kargo: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(order.shipping_cost)}`, 140, finalY + 5);

    if (order.discount_amount > 0) {
        doc.text(`İndirim: -${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(order.discount_amount)}`, 140, finalY + 10);
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`GENEL TOPLAM: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(order.total)}`, 140, finalY + 20);

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Bu belge bilgilendirme amaçlıdır. Mali değeri yoktur.', 105, 280, { align: 'center' });

    doc.save(`Fatura-${order.order_number}.pdf`);
};
