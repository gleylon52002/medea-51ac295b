import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPrice, safeJsonParse } from './utils';

/**
 * Professional Invoice Generator
 * Based on modern design with dark theme, gradient headers, and decorative elements
 */

export const generateProfessionalInvoice = (order: any, seller?: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Background color (dark theme)
    doc.setFillColor(10, 10, 15);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // ====== HEADER SECTION ======
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.text('FİYAT TEKLİFİ', 14, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Teklif Verilen Firma', 14, 35);
    doc.text('Teklif Tarihi', 100, 35);

    // Company/Seller Info (Left Side)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const companyName = seller?.company_name || 'MEDEA PAZARYERI';
    doc.text(companyName.toUpperCase(), 14, 45);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(seller?.address || 'Atatürk Mah. Gazi Bulvarı', 14, 50);
    doc.text(seller?.city ? `No: 12 10100 ${seller.city}` : 'İstanbul, Türkiye', 14, 55);

    // Invoice Date (Right Side)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }), 100, 45);

    // Seller/Platform Info Box (Top Right)
    doc.setFillColor(25, 25, 35);
    doc.roundedRect(pageWidth - 70, 10, 60, 50, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('MEDEA PAZARYERİ', pageWidth - 35, 18, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Atatürk Mah. Gazi Bulvarı', pageWidth - 35, 24, { align: 'center' });
    doc.text('No: 12 10100', pageWidth - 35, 29, { align: 'center' });
    doc.text('Karesi/Balıkesir', pageWidth - 35, 34, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.text('V.D: GAZİLER', pageWidth - 35, 42, { align: 'center' });

    // Customer Info
    const shippingAddress = safeJsonParse(order.shipping_address, {} as any);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    doc.text(`Müşteri: ${shippingAddress?.full_name || 'Sayın Müşteri'}`, 14, 65);
    doc.text(`Adres: ${shippingAddress?.address || ''}`, 14, 70);
    doc.text(`${shippingAddress?.district || ''} / ${shippingAddress?.city || ''}`, 14, 75);

    // ====== ITEMS TABLE ======
    const items = order.order_items || order.items || [];
    const tableData: any[] = [];
    let itemNumber = 1;

    items.forEach((item: any) => {
        if (seller && item.product?.seller_id !== seller.id) return;

        const name = item.product_name || item.product?.name || 'Ürün';
        const unitPrice = item.unit_price || 0;
        const quantity = item.quantity || 1;
        const total = item.total_price || (unitPrice * quantity);

        tableData.push([
            itemNumber.toString().padStart(2, '0'),
            name,
            `${formatPrice(unitPrice)}`,
            quantity.toString(),
            `${formatPrice(total)}`
        ]);
        itemNumber++;
    });

    // Table with gradient header
    autoTable(doc, {
        startY: 85,
        head: [['No', 'Ürün Açıklaması', 'Fiyat', 'Adet', 'Toplam']],
        body: tableData,
        theme: 'plain',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            textColor: [255, 255, 255],
            cellPadding: 5,
        },
        headStyles: {
            fillColor: [88, 80, 236], // Purple-blue gradient start
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
        },
        bodyStyles: {
            fillColor: [20, 20, 30],
            lineColor: [50, 50, 60],
            lineWidth: 0.5,
        },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 85 },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 30, halign: 'right' },
        }
    });

    // ====== PAYMENT SUMMARY ======
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Payment details box
    doc.setFillColor(25, 25, 35);
    doc.roundedRect(pageWidth - 80, finalY, 70, 45, 2, 2, 'F');

    doc.setTextColor(200, 200, 200);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const summaryX = pageWidth - 75;
    let summaryY = finalY + 8;

    // Calculate totals
    const subtotal = order.subtotal || 0;
    const shipping = order.shipping_cost || 0;
    const discount = order.discount_amount || 0;
    const walletDiscount = order.wallet_discount || 0;

    // VAT calculation (18%)
    const subtotalWithoutVAT = subtotal / 1.18;
    const vatAmount = subtotal - subtotalWithoutVAT;
    const totalDiscount = discount + walletDiscount;

    doc.text('Ara Toplam', summaryX, summaryY);
    doc.text(formatPrice(subtotalWithoutVAT), pageWidth - 15, summaryY, { align: 'right' });
    summaryY += 6;

    doc.text('Vergiler (%18)', summaryX, summaryY);
    doc.text(formatPrice(vatAmount), pageWidth - 15, summaryY, { align: 'right' });
    summaryY += 6;

    if (totalDiscount > 0) {
        doc.text('İskonto', summaryX, summaryY);
        doc.text(formatPrice(totalDiscount), pageWidth - 15, summaryY, { align: 'right' });
        summaryY += 6;
    }

    // Total with blue background
    doc.setFillColor(88, 80, 236);
    doc.roundedRect(pageWidth - 80, summaryY - 4, 70, 12, 2, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Toplam', summaryX, summaryY + 4);
    doc.text(`${formatPrice(order.total)}`, pageWidth - 15, summaryY + 4, { align: 'right' });

    // ====== PAYMENT DETAILS ======
    doc.setTextColor(200, 200, 200);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('ÖDEME DETAYLARI', 14, finalY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Banka Adı:', 14, finalY + 12);
    doc.text('Hesap Numarası:', 14, finalY + 17);
    doc.text('IBAN:', 14, finalY + 22);

    doc.setFont('helvetica', 'bold');
    doc.text(seller?.bank_name || 'Yapı Kredi Bankası', 45, finalY + 12);
    doc.text(seller?.account_number || '1234567890', 45, finalY + 17);
    doc.text(seller?.iban || 'TR00 0000 0000 0000 0000 0000 00', 45, finalY + 22);

    // ====== DECORATIVE ELEMENTS (Bottom) ======
    // Molecular/hexagonal pattern (simplified dots)
    doc.setFillColor(88, 80, 236, 0.3);
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * (pageWidth - 20) + 10;
        const y = pageHeight - 50 + Math.random() * 40;
        const radius = Math.random() * 2 + 0.5;
        doc.circle(x, y, radius, 'F');
    }

    // Additional cyan dots
    doc.setFillColor(0, 200, 255, 0.5);
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * (pageWidth - 20) + 10;
        const y = pageHeight - 50 + Math.random() * 40;
        const radius = Math.random() * 1.5 + 0.3;
        doc.circle(x, y, radius, 'F');
    }

    // ====== FOOTER ======
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('Bu belge elektronik ortamda oluşturulmuştur.', pageWidth / 2, pageHeight - 15, { align: 'center' });
    doc.text(`Sipariş No: ${order.order_number} | Fatura Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Page number
    doc.setFontSize(8);
    doc.text('Sayfa 1/1', pageWidth - 15, pageHeight - 10, { align: 'right' });

    // Save
    doc.save(`Fatura-${order.order_number}.pdf`);
};
