import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPrice, safeJsonParse } from './utils';

/**
 * Modern Professional Invoice Generator
 * Clean white design with accent color sidebar and structured layout
 */

const ACCENT = { r: 37, g: 99, b: 235 }; // Blue accent
const DARK = { r: 15, g: 23, b: 42 }; // Slate-900
const GRAY = { r: 100, g: 116, b: 139 }; // Slate-500
const LIGHT_BG = { r: 248, g: 250, b: 252 }; // Slate-50
const WHITE = { r: 255, g: 255, b: 255 };

const turkishText = (text: string): string => {
  // jsPDF helvetica doesn't support Turkish chars well, map common ones
  return text
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 'S')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C');
};

export const generateProfessionalInvoice = (order: any, seller?: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ====== LEFT ACCENT SIDEBAR ======
  doc.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.rect(0, 0, 6, pageHeight, 'F');

  // ====== HEADER ======
  // Company name
  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('MEDEA', 16, 22);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
  doc.text(turkishText('Pazaryeri'), 16, 28);

  // FATURA title (right aligned)
  doc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('FATURA', pageWidth - 16, 22, { align: 'right' });

  // Invoice meta (right side)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
  const invoiceDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('tr-TR')
    : new Date().toLocaleDateString('tr-TR');

  const metaLabels = ['Fatura No:', 'Tarih:', turkishText('Siparis No:'), turkishText('Odeme:')];
  const paymentMethodMap: Record<string, string> = {
    credit_card: 'Kredi Karti',
    bank_transfer: 'Havale/EFT',
    cash_on_delivery: turkishText('Kapida Odeme'),
    shopier: 'Shopier',
    shopinext: 'ShopiNext',
    payizone: 'Payizone',
  };
  const metaValues = [
    `INV-${order.order_number || '0000'}`,
    invoiceDate,
    `#${order.order_number || '0000'}`,
    paymentMethodMap[order.payment_method] || order.payment_method || '-',
  ];

  let metaY = 32;
  metaLabels.forEach((label, i) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(DARK.r, DARK.g, DARK.b);
    doc.text(label, pageWidth - 60, metaY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
    doc.text(metaValues[i], pageWidth - 16, metaY, { align: 'right' });
    metaY += 5;
  });

  // ====== SEPARATOR ======
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(16, 56, pageWidth - 16, 56);

  // ====== FROM / TO SECTIONS ======
  const shippingAddress = safeJsonParse(order.shipping_address, {} as any);

  // FROM (Seller/Platform)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.text('GONDEREN', 16, 64);

  doc.setFontSize(9);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  doc.setFont('helvetica', 'bold');
  doc.text(turkishText(seller?.company_name || 'MEDEA Pazaryeri'), 16, 70);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
  doc.text(turkishText(seller?.address || 'Istanbul, Turkiye'), 16, 75);
  doc.text(turkishText(`${seller?.district || ''} ${seller?.city || ''}`).trim() || turkishText('Istanbul'), 16, 80);
  if (seller?.tax_number) {
    doc.text(`V.No: ${seller.tax_number}`, 16, 85);
  }

  // TO (Customer)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.text(turkishText('MUSTERI'), pageWidth / 2 + 10, 64);

  doc.setFontSize(9);
  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  doc.setFont('helvetica', 'bold');
  doc.text(turkishText(shippingAddress?.full_name || 'Sayin Musteri'), pageWidth / 2 + 10, 70);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
  const addrLines = doc.splitTextToSize(turkishText(shippingAddress?.address || ''), 70);
  doc.text(addrLines, pageWidth / 2 + 10, 75);
  const addrEndY = 75 + addrLines.length * 4;
  doc.text(turkishText(`${shippingAddress?.district || ''} / ${shippingAddress?.city || ''}`), pageWidth / 2 + 10, addrEndY);
  if (shippingAddress?.phone) {
    doc.text(`Tel: ${shippingAddress.phone}`, pageWidth / 2 + 10, addrEndY + 5);
  }
  if (shippingAddress?.email) {
    doc.text(shippingAddress.email, pageWidth / 2 + 10, addrEndY + 10);
  }

  // ====== ITEMS TABLE ======
  const items = order.order_items || order.items || [];
  const tableData: any[] = [];

  items.forEach((item: any, index: number) => {
    if (seller && item.product?.seller_id !== seller.id) return;

    const name = turkishText(item.product_name || item.product?.name || 'Urun');
    const unitPrice = Number(item.unit_price) || 0;
    const quantity = item.quantity || 1;
    const total = Number(item.total_price) || unitPrice * quantity;

    tableData.push([
      (index + 1).toString(),
      name,
      quantity.toString(),
      formatPrice(unitPrice),
      formatPrice(total),
    ]);
  });

  autoTable(doc, {
    startY: 98,
    head: [['#', turkishText('Urun Adi'), 'Adet', turkishText('Birim Fiyat'), 'Toplam']],
    body: tableData,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
      textColor: [DARK.r, DARK.g, DARK.b],
      lineColor: [226, 232, 240],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [ACCENT.r, ACCENT.g, ACCENT.b],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fillColor: [WHITE.r, WHITE.g, WHITE.b],
    },
    alternateRowStyles: {
      fillColor: [LIGHT_BG.r, LIGHT_BG.g, LIGHT_BG.b],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 90 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 16, right: 16 },
  });

  // ====== TOTALS SECTION ======
  const finalY = (doc as any).lastAutoTable.finalY + 8;

  const subtotal = Number(order.subtotal) || 0;
  const shipping = Number(order.shipping_cost) || 0;
  const discount = Number(order.discount_amount) || 0;
  const total = Number(order.total) || 0;

  // KDV calculation
  const subtotalExVAT = subtotal / 1.18;
  const vatAmount = subtotal - subtotalExVAT;

  // Summary box (right side)
  const summaryBoxX = pageWidth - 90;
  const summaryBoxW = 74;
  let sy = finalY;

  // Background for summary
  doc.setFillColor(LIGHT_BG.r, LIGHT_BG.g, LIGHT_BG.b);
  doc.roundedRect(summaryBoxX, sy - 4, summaryBoxW, discount > 0 ? 48 : 40, 2, 2, 'F');

  doc.setFontSize(8);
  const drawSummaryRow = (label: string, value: string, bold = false, color?: { r: number; g: number; b: number }) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
    doc.text(label, summaryBoxX + 4, sy);
    doc.setTextColor(color?.r || DARK.r, color?.g || DARK.g, color?.b || DARK.b);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(value, summaryBoxX + summaryBoxW - 4, sy, { align: 'right' });
    sy += 6;
  };

  drawSummaryRow('Ara Toplam (KDV Haric)', formatPrice(subtotalExVAT));
  drawSummaryRow('KDV (%18)', formatPrice(vatAmount));
  drawSummaryRow('Kargo', shipping > 0 ? formatPrice(shipping) : turkishText('Ucretsiz'));
  if (discount > 0) {
    drawSummaryRow(turkishText('Indirim'), `-${formatPrice(discount)}`, false, { r: 220, g: 38, b: 38 });
  }

  // Total row with accent background
  sy += 2;
  doc.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.roundedRect(summaryBoxX, sy - 5, summaryBoxW, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOPLAM', summaryBoxX + 4, sy + 2);
  doc.text(formatPrice(total), summaryBoxX + summaryBoxW - 4, sy + 2, { align: 'right' });

  // ====== NOTES / PAYMENT INFO (Left side at same height as summary) ======
  const notesY = finalY;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.text(turkishText('ODEME BILGILERI'), 16, notesY);

  doc.setFontSize(8);
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
  doc.setFont('helvetica', 'normal');

  const statusLabels: Record<string, string> = {
    pending: 'Beklemede',
    paid: turkishText('Odendi'),
    failed: turkishText('Basarisiz'),
    refunded: 'Iade Edildi',
  };
  doc.text(turkishText(`Durum: ${statusLabels[order.payment_status] || order.payment_status || '-'}`), 16, notesY + 6);

  if (seller?.bank_name) {
    doc.text(`Banka: ${turkishText(seller.bank_name)}`, 16, notesY + 12);
    doc.text(`IBAN: ${seller.iban || '-'}`, 16, notesY + 18);
  }

  // ====== FOOTER ======
  // Separator line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(16, pageHeight - 28, pageWidth - 16, pageHeight - 28);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
  doc.text(
    turkishText('Bu belge elektronik ortamda olusturulmustur. Mali mevzuat geregi gecerlidir.'),
    pageWidth / 2,
    pageHeight - 22,
    { align: 'center' }
  );
  doc.text(
    turkishText(`Fatura No: INV-${order.order_number || '0000'} | Olusturulma: ${new Date().toLocaleDateString('tr-TR')}`),
    pageWidth / 2,
    pageHeight - 17,
    { align: 'center' }
  );

  // Bottom accent bar
  doc.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text('www.medea.com  |  info@medea.com', pageWidth / 2, pageHeight - 3, { align: 'center' });

  // Save
  doc.save(`Fatura-${order.order_number || 'ornek'}.pdf`);
};

/**
 * Generate a sample invoice for demo/preview purposes
 */
export const generateSampleInvoice = () => {
  const sampleOrder = {
    order_number: 'ORNEK-2026-001',
    created_at: new Date().toISOString(),
    payment_method: 'credit_card',
    payment_status: 'paid',
    status: 'delivered',
    shipping_address: {
      full_name: 'Ahmet Yilmaz',
      address: 'Ataturk Mah. Cumhuriyet Cad. No: 42 D: 5',
      district: 'Kadikoy',
      city: 'Istanbul',
      phone: '0532 123 45 67',
      email: 'ahmet@ornek.com',
    },
    subtotal: 1250.0,
    shipping_cost: 0,
    discount_amount: 50.0,
    total: 1200.0,
    order_items: [
      {
        product_name: 'Organik Lavanta Yagi - 100ml',
        unit_price: 450.0,
        quantity: 1,
        total_price: 450.0,
      },
      {
        product_name: 'Dogal Gul Suyu - 250ml',
        unit_price: 280.0,
        quantity: 2,
        total_price: 560.0,
      },
      {
        product_name: 'Argan Yagi Sac Bakimi - 150ml',
        unit_price: 240.0,
        quantity: 1,
        total_price: 240.0,
      },
    ],
  };

  generateProfessionalInvoice(sampleOrder);
};
