import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Database } from '@/integrations/supabase/types';
import { formatPrice, safeJsonParse } from './utils';

type Order = Database['public']['Tables']['orders']['Row'] & {
    order_items?: any[];
};

export const generateInvoicePDF = (order: any, seller?: any) => {
    const doc = new jsPDF();

    // Professional Header with Logo Area
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('FATURA', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('INVOICE', 105, 26, { align: 'center' });

    // Company Info (Left Side)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('MEDEA PAZARYERİ', 14, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('İstanbul, Türkiye', 14, 45);
    doc.text('Tel: +90 (212) 555 00 00', 14, 50);
    doc.text('E-posta: info@medea.com', 14, 55);
    doc.text('Web: www.medea.com', 14, 60);

    // Tax Info
    doc.setFontSize(8);
    doc.text('Vergi Dairesi: Kadıköy V.D.', 14, 66);
    doc.text('Vergi No: 1234567890', 14, 70);

    // Invoice Details (Right Side) - Box Style
    const boxX = 140;
    const boxY = 35;
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 245, 245);
    doc.rect(boxX - 2, boxY, 60, 30, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Fatura No:', boxX, boxY + 6);
    doc.text('Fatura Tarihi:', boxX, boxY + 12);
    doc.text('Sipariş No:', boxX, boxY + 18);
    doc.text('Durum:', boxX, boxY + 24);

    doc.setFont('helvetica', 'normal');
    doc.text(`INV-${order.order_number}`, boxX + 25, boxY + 6);
    doc.text(new Date().toLocaleDateString('tr-TR'), boxX + 25, boxY + 12);
    doc.text(order.order_number, boxX + 25, boxY + 18);

    const statusMap: Record<string, string> = {
        'pending': 'Beklemede',
        'processing': 'İşleniyor',
        'shipped': 'Kargoda',
        'delivered': 'Teslim Edildi',
        'cancelled': 'İptal'
    };
    doc.text(statusMap[order.status] || order.status, boxX + 25, boxY + 24);

    // Horizontal Line
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.line(14, 78, 196, 78);

    // Customer Info Section
    const shippingAddress = safeJsonParse(order.shipping_address, {} as any);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('MÜŞTERİ BİLGİLERİ', 14, 86);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(shippingAddress?.full_name || 'Sayın Müşteri', 14, 92);
    doc.text(shippingAddress?.address || '', 14, 97, { maxWidth: 80 });
    doc.text(`${shippingAddress?.district || ''} / ${shippingAddress?.city || ''}`, 14, 107);
    doc.text(`Tel: ${shippingAddress?.phone || ''}`, 14, 112);
    doc.text(`E-posta: ${shippingAddress?.email || ''}`, 14, 117);

    // Items Table with improved design
    const tableColumn = ['Ürün Adı', 'Adet', 'Birim Fiyat', 'KDV', 'Toplam'];
    const tableRows: any[] = [];

    const items = order.order_items || order.items || [];
    let subtotalWithoutVAT = 0;

    items.forEach((item: any) => {
        if (seller && item.product?.seller_id !== seller.id) return;

        const name = item.product_name || item.product?.name || 'Ürün';
        const quantity = item.quantity;
        const price = item.unit_price;
        const total = item.total_price;
        const vat = '18%'; // KDV oranı

        subtotalWithoutVAT += total / 1.18; // KDV hariç tutar

        tableRows.push([
            name,
            quantity.toString(),
            formatPrice(price),
            vat,
            formatPrice(total)
        ]);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 125,
        theme: 'striped',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold'
        },
        columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 30, halign: 'right' }
        }
    });

    // Summary Section with proper VAT calculation
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    const summaryX = 130;

    doc.setFontSize(9);
    doc.text('Ara Toplam (KDV Hariç):', summaryX, finalY);
    doc.text(formatPrice(subtotalWithoutVAT), 190, finalY, { align: 'right' });

    doc.text('Kargo Ücreti:', summaryX, finalY + 5);
    doc.text(formatPrice(order.shipping_cost || 0), 190, finalY + 5, { align: 'right' });

    const vatAmount = order.subtotal - subtotalWithoutVAT;
    doc.text('KDV (%18):', summaryX, finalY + 10);
    doc.text(formatPrice(vatAmount), 190, finalY + 10, { align: 'right' });

    if (order.discount_amount > 0) {
        doc.text('İndirim:', summaryX, finalY + 15);
        doc.text(`-${formatPrice(order.discount_amount)}`, 190, finalY + 15, { align: 'right' });
    }

    if (order.wallet_discount > 0) {
        doc.text('Cüzdan İndirimi:', summaryX, finalY + 20);
        doc.text(`-${formatPrice(order.wallet_discount)}`, 190, finalY + 20, { align: 'right' });
    }

    // Total with box
    const totalY = finalY + (order.discount_amount > 0 ? 30 : 20);
    doc.setFillColor(41, 128, 185);
    doc.setTextColor(255, 255, 255);
    doc.rect(summaryX - 2, totalY - 5, 67, 10, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('GENEL TOPLAM:', summaryX, totalY);
    doc.text(formatPrice(order.total), 190, totalY, { align: 'right' });

    // Reset color
    doc.setTextColor(0, 0, 0);

    // Payment Info
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const paymentMethodMap: Record<string, string> = {
        'credit_card': 'Kredi Kartı',
        'bank_transfer': 'Havale/EFT',
        'cash_on_delivery': 'Kapıda Ödeme',
        'shopier': 'Shopier',
        'shopinext': 'ShopiNext',
        'payizone': 'Payizone'
    };
    doc.text(`Ödeme Yöntemi: ${paymentMethodMap[order.payment_method] || order.payment_method}`, 14, totalY + 10);
    doc.text(`Ödeme Durumu: ${order.payment_status === 'paid' ? 'Ödendi' : 'Bekliyor'}`, 14, totalY + 15);

    // Legal Footer
    doc.setDrawColor(100, 100, 100);
    doc.line(14, 270, 196, 270);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('Bu belge elektronik ortamda oluşturulmuş olup, Mali mevzuat gereği geçerlidir.', 105, 275, { align: 'center' });
    doc.text('Fatura ile ilgili sorularınız için info@medea.com adresine e-posta gönderebilirsiniz.', 105, 280, { align: 'center' });

    // Page number
    doc.setFontSize(8);
    doc.text('Sayfa 1/1', 190, 285, { align: 'right' });

    doc.save(`Fatura-${order.order_number}.pdf`);
};
