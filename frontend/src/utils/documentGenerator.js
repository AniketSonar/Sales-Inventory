import { jsPDF } from 'jspdf';

export const COMPANY_DETAILS = {
  name: "NEXFLOW SYSTEMS PVT. LTD.",
  tagline: "Industrial Equipment & Sales Solutions",
  address: "Plot 42, Tech Park, MIDC Industrial Area, Phase II",
  cityStatePin: "Pune, Maharashtra - 411057",
  phone: "+91 98765 43210",
  email: "sales@nexflowsystems.com",
  gstin: "27AABCU9603R1ZM",
  pan: "AABCU9603R"
};

export const BANK_DETAILS = {
  bankName: "HDFC BANK LTD",
  accountName: "NEXFLOW SYSTEMS PVT. LTD.",
  accountNumber: "50200084729183",
  ifsc: "HDFC0001234",
  branch: "Hinjawadi Phase 1, Pune"
};

const fmtCurrency = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function buildQuotationPdf(enq) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const contentW = W - M * 2;

  // Header Background Bar
  doc.setFillColor(30, 41, 59);
  doc.rect(M, 35, contentW, 55, 'F');

  // Company Name & Quotation Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(COMPANY_DETAILS.name, M + 14, 58);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(COMPANY_DETAILS.tagline, M + 14, 73);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('QUOTATION', W - M - 14, 62, { align: 'right' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('ORIGINAL FOR RECIPIENT', W - M - 14, 76, { align: 'right' });

  // Two-column Info Card
  let y = 105;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(M, y, contentW, 85, 4, 4, 'FD');

  // Left Column: Client / Recipient Info
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('QUOTATION TO (CLIENT):', M + 12, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(enq.customer_name || 'Valued Customer', M + 12, y + 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Email: ${enq.contact_email || 'sales-lead@client.com'}`, M + 12, y + 49);
  doc.text(`Phone: ${enq.contact_phone || '+91 9876543210'}`, M + 12, y + 62);
  doc.text(`Department / Category: ${enq.category || 'General'}`, M + 12, y + 75);

  // Right Column: Quotation Metadata
  const midX = M + contentW / 2 + 10;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DOCUMENT DETAILS:', midX, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Quotation No:`, midX, y + 34);
  doc.text(`Date of Issue:`, midX, y + 49);
  doc.text(`Enquiry Reference:`, midX, y + 62);
  doc.text(`Validity Period:`, midX, y + 75);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(enq.quotation_no || `QT-${new Date().getFullYear()}-001`, midX + 105, y + 34);
  doc.text(new Date(enq.created_at || Date.now()).toLocaleDateString('en-IN'), midX + 105, y + 49);
  doc.text(enq.enquiry_no || 'ENQ-DIRECT', midX + 105, y + 62);
  doc.text('30 Days from Issue', midX + 105, y + 75);

  // Items Table Header
  y = 205;
  doc.setFillColor(51, 65, 85);
  doc.rect(M, y, contentW, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('S.NO', M + 8, y + 16);
  doc.text('DESCRIPTION / PART CODE', M + 45, y + 16);
  doc.text('QTY', M + 280, y + 16, { align: 'center' });
  doc.text('UNIT PRICE', M + 380, y + 16, { align: 'right' });
  doc.text('AMOUNT', W - M - 12, y + 16, { align: 'right' });

  // Items Table Rows
  y += 24;
  const qty = Number(enq.quantity || 1);
  const unitPrice = Number(enq.selling_price || (enq.supplier_cost ? enq.supplier_cost * 1.25 : 1000));
  const subtotal = qty * unitPrice;
  const discountPercent = Number(enq.discount_percent || 0);
  const discountVal = (subtotal * discountPercent) / 100;
  const taxableVal = subtotal - discountVal;
  const cgstVal = taxableVal * 0.09;
  const sgstVal = taxableVal * 0.09;
  const grandTotal = taxableVal + cgstVal + sgstVal;

  // Single Item Row
  doc.setFillColor(255, 255, 255);
  doc.rect(M, y, contentW, 36, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(M, y + 36, W - M, y + 36);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('1', M + 14, y + 18);
  doc.text(enq.part_code || 'STANDARD-PART', M + 45, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Industrial Grade Component (${enq.category || 'Mechanical'})`, M + 45, y + 28);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9.5);
  doc.text(`${qty} Units`, M + 280, y + 20, { align: 'center' });
  doc.text(fmtCurrency(unitPrice), M + 380, y + 20, { align: 'right' });
  doc.text(fmtCurrency(subtotal), W - M - 12, y + 20, { align: 'right' });

  // Calculation Breakdown
  y += 50;
  const totalsBoxW = 220;
  const totalsX = W - M - totalsBoxW;

  const rows = [
    { label: 'Subtotal:', val: fmtCurrency(subtotal) },
    ...(discountPercent > 0 ? [{ label: `Discount (${discountPercent}%):`, val: `- ${fmtCurrency(discountVal)}` }] : []),
    { label: 'Taxable Amount:', val: fmtCurrency(taxableVal) },
    { label: 'CGST (9%):', val: fmtCurrency(cgstVal) },
    { label: 'SGST (9%):', val: fmtCurrency(sgstVal) }
  ];

  doc.setFontSize(9);
  rows.forEach((r, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(r.label, totalsX, y + idx * 16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(r.val, W - M - 8, y + idx * 16, { align: 'right' });
  });

  // Grand Total Highlight Bar
  const gtY = y + rows.length * 16 + 6;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(totalsX - 10, gtY, totalsBoxW + 10, 24, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL PAYABLE:', totalsX, gtY + 16);
  doc.text(fmtCurrency(grandTotal), W - M - 8, gtY + 16, { align: 'right' });

  // Terms & Conditions + Bank Details
  const termsY = y + 10;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('TERMS & CONDITIONS:', M, termsY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('1. Payment: 50% advance along with PO, 50% prior to dispatch.', M, termsY + 14);
  doc.text('2. Delivery: Dispatched within 5-7 working days from confirmed PO.', M, termsY + 26);
  doc.text('3. Taxes: GST charged extra as per government statutory notification.', M, termsY + 38);
  doc.text('4. Warranty: 12 months against manufacturing or material defect.', M, termsY + 50);

  // Bank Account Box
  const bankY = termsY + 68;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(M, bankY, 260, 52, 3, 3, 'FD');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('BANK TRANSFER DETAILS:', M + 8, bankY + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Bank: ${BANK_DETAILS.bankName} | A/C: ${BANK_DETAILS.accountNumber}`, M + 8, bankY + 26);
  doc.text(`IFSC: ${BANK_DETAILS.ifsc} | Branch: ${BANK_DETAILS.branch}`, M + 8, bankY + 38);

  // Signatory Box
  const sigY = H - 100;
  doc.setDrawColor(203, 213, 225);
  doc.line(W - M - 160, sigY + 35, W - M, sigY + 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`For ${COMPANY_DETAILS.name}`, W - M - 80, sigY + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorised Signatory', W - M - 80, sigY + 48, { align: 'center' });

  // Footer Note
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`This is a computer-generated quotation issued by ${COMPANY_DETAILS.name}.`, W / 2, H - 25, { align: 'center' });

  return doc;
}

export function buildSalesOrderPdf(enq) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const contentW = W - M * 2;

  // Header Background Bar
  doc.setFillColor(30, 41, 59);
  doc.rect(M, 35, contentW, 55, 'F');

  // Company Name & Sales Order Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(COMPANY_DETAILS.name, M + 14, 58);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Internal Order Fulfillment & Customer PO Confirmation', M + 14, 73);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('SALES ORDER', W - M - 14, 62, { align: 'right' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('CONFIRMED ORDER COPY', W - M - 14, 76, { align: 'right' });

  // Two-column Info Card
  let y = 105;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(M, y, contentW, 90, 4, 4, 'FD');

  // Left Column: Client / Buyer Info
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('BUYER / CUSTOMER DETAILS:', M + 12, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(enq.customer_name || 'Customer Name', M + 12, y + 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Contact: ${enq.contact_email || 'client@company.com'}`, M + 12, y + 49);
  doc.text(`Phone: ${enq.contact_phone || '+91 9876543210'}`, M + 12, y + 62);
  doc.text(`Category: ${enq.category || 'Mechanical Products'}`, M + 12, y + 76);

  // Right Column: Order & PO Metadata
  const midX = M + contentW / 2 + 10;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ORDER & PO REFERENCE:', midX, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Sales Order No:`, midX, y + 34);
  doc.text(`Customer PO No:`, midX, y + 49);
  doc.text(`Quotation Ref:`, midX, y + 62);
  doc.text(`Order Date:`, midX, y + 76);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(enq.order_no || `SO-${new Date().getFullYear()}-001`, midX + 110, y + 34);
  doc.setTextColor(217, 119, 6); // Amber emphasis for PO
  doc.text(enq.po_number || 'PO-PENDING', midX + 110, y + 49);
  doc.setTextColor(15, 23, 42);
  doc.text(enq.quotation_no || 'QT-DIRECT', midX + 110, y + 62);
  doc.text(new Date().toLocaleDateString('en-IN'), midX + 110, y + 76);

  // Items Table Header
  y = 210;
  doc.setFillColor(30, 41, 59);
  doc.rect(M, y, contentW, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('S.NO', M + 8, y + 16);
  doc.text('CONFIRMED ITEM & SPECIFICATION', M + 45, y + 16);
  doc.text('QTY TO PACK', M + 280, y + 16, { align: 'center' });
  doc.text('AGREED RATE', M + 380, y + 16, { align: 'right' });
  doc.text('AMOUNT (₹)', W - M - 12, y + 16, { align: 'right' });

  // Items Table Row
  y += 24;
  const qty = Number(enq.quantity || 1);
  const unitPrice = Number(enq.selling_price || (enq.supplier_cost ? enq.supplier_cost * 1.25 : 1000));
  const subtotal = qty * unitPrice;
  const discountPercent = Number(enq.discount_percent || 0);
  const discountVal = (subtotal * discountPercent) / 100;
  const taxableVal = subtotal - discountVal;
  const cgstVal = taxableVal * 0.09;
  const sgstVal = taxableVal * 0.09;
  const grandTotal = taxableVal + cgstVal + sgstVal;

  doc.setFillColor(255, 255, 255);
  doc.rect(M, y, contentW, 36, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(M, y + 36, W - M, y + 36);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('1', M + 14, y + 18);
  doc.text(enq.part_code || 'PART-SKU', M + 45, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Enquiry Ref: ${enq.enquiry_no || 'ENQ-DIRECT'} | PO Verified Order`, M + 45, y + 28);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9.5);
  doc.text(`${qty} Units`, M + 280, y + 20, { align: 'center' });
  doc.text(fmtCurrency(unitPrice), M + 380, y + 20, { align: 'right' });
  doc.text(fmtCurrency(subtotal), W - M - 12, y + 20, { align: 'right' });

  // Calculation Breakdown
  y += 50;
  const totalsBoxW = 220;
  const totalsX = W - M - totalsBoxW;

  const rows = [
    { label: 'Order Subtotal:', val: fmtCurrency(subtotal) },
    ...(discountPercent > 0 ? [{ label: `Agreed Discount (${discountPercent}%):`, val: `- ${fmtCurrency(discountVal)}` }] : []),
    { label: 'Taxable Value:', val: fmtCurrency(taxableVal) },
    { label: 'CGST @ 9%:', val: fmtCurrency(cgstVal) },
    { label: 'SGST @ 9%:', val: fmtCurrency(sgstVal) }
  ];

  doc.setFontSize(9);
  rows.forEach((r, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(r.label, totalsX, y + idx * 16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(r.val, W - M - 8, y + idx * 16, { align: 'right' });
  });

  // Grand Total Highlight Bar
  const gtY = y + rows.length * 16 + 6;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(totalsX - 10, gtY, totalsBoxW + 10, 24, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL ORDER VALUE:', totalsX, gtY + 16);
  doc.text(fmtCurrency(grandTotal), W - M - 8, gtY + 16, { align: 'right' });

  // Store Packing & Warehouse Routing Box
  const routingY = y + 10;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(M, routingY, 260, 95, 3, 3, 'FD');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('FULFILLMENT & WAREHOUSE INSTRUCTIONS:', M + 8, routingY + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Store Status: ${enq.store_status || 'Assigned to Packing Queue'}`, M + 8, routingY + 30);
  doc.text(`Packaging: Heavy Duty Corrugated / Sealed Box`, M + 8, routingY + 44);
  doc.text(`Inspection: Physical QC & barcode verification required`, M + 8, routingY + 58);
  doc.text(`Dispatch Route: Scheduled Logistics Partner`, M + 8, routingY + 72);
  doc.text(`Delivery Location: Customer Plant / Factory Receiving`, M + 8, routingY + 86);

  // Signatory Box
  const sigY = H - 100;
  doc.setDrawColor(203, 213, 225);
  doc.line(W - M - 160, sigY + 35, W - M, sigY + 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`For ${COMPANY_DETAILS.name}`, W - M - 80, sigY + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Order Management Commercial Seal', W - M - 80, sigY + 48, { align: 'center' });

  // Footer Note
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Confirmed Sales Order generated against verified Customer PO. NexFlow ERP Systems.`, W / 2, H - 25, { align: 'center' });

  return doc;
}

export function buildInvoicePdf(enq) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const contentW = W - M * 2;

  // Header Background Bar
  doc.setFillColor(15, 23, 42); // Deep Charcoal
  doc.rect(M, 35, contentW, 55, 'F');

  // Company Name & Invoice Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(COMPANY_DETAILS.name, M + 14, 58);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`GSTIN: ${COMPANY_DETAILS.gstin} | PAN: ${COMPANY_DETAILS.pan}`, M + 14, 73);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('TAX INVOICE', W - M - 14, 62, { align: 'right' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('ORIGINAL FOR RECIPIENT', W - M - 14, 76, { align: 'right' });

  // Two-column Info Card
  let y = 105;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(M, y, contentW, 90, 4, 4, 'FD');

  // Left Column: Billed To
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('BILLED TO (BUYER):', M + 12, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(enq.customer_name || 'Customer Name', M + 12, y + 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Contact: ${enq.contact_email || 'client@company.com'}`, M + 12, y + 49);
  doc.text(`Phone: ${enq.contact_phone || '+91 9876543210'}`, M + 12, y + 62);
  doc.text(`Buyer PO No: ${enq.po_number || 'PO-VERIFIED'}`, M + 12, y + 76);

  // Right Column: Invoice Metadata
  const midX = M + contentW / 2 + 10;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('INVOICE & DISPATCH:', midX, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Invoice No:`, midX, y + 34);
  doc.text(`Invoice Date:`, midX, y + 49);
  doc.text(`Sales Order Ref:`, midX, y + 62);
  doc.text(`Transporter / Docket:`, midX, y + 76);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(enq.invoice_no || `INV-${new Date().getFullYear()}-001`, midX + 115, y + 34);
  doc.text(new Date().toLocaleDateString('en-IN'), midX + 115, y + 49);
  doc.text(enq.order_no || 'SO-CONFIRMED', midX + 115, y + 62);
  doc.text(`${enq.transporter || 'SafeExpress'} / ${enq.tracking_no || 'TRK-9821'}`, midX + 115, y + 76);

  // Items Table Header
  y = 210;
  doc.setFillColor(30, 41, 59);
  doc.rect(M, y, contentW, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('S.NO', M + 8, y + 16);
  doc.text('ITEM DESCRIPTION & SPECIFICATION', M + 45, y + 16);
  doc.text('QTY', M + 280, y + 16, { align: 'center' });
  doc.text('RATE (₹)', M + 380, y + 16, { align: 'right' });
  doc.text('AMOUNT (₹)', W - M - 12, y + 16, { align: 'right' });

  // Items Table Row
  y += 24;
  const qty = Number(enq.quantity || 1);
  const unitPrice = Number(enq.selling_price || (enq.supplier_cost ? enq.supplier_cost * 1.25 : 1000));
  const subtotal = qty * unitPrice;
  const discountPercent = Number(enq.discount_percent || 0);
  const discountVal = (subtotal * discountPercent) / 100;
  const taxableVal = subtotal - discountVal;
  const cgstVal = taxableVal * 0.09;
  const sgstVal = taxableVal * 0.09;
  const grandTotal = taxableVal + cgstVal + sgstVal;

  doc.setFillColor(255, 255, 255);
  doc.rect(M, y, contentW, 36, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(M, y + 36, W - M, y + 36);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('1', M + 14, y + 18);
  doc.text(enq.part_code || 'ITEM-PART-CODE', M + 45, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Category: ${enq.category || 'Mechanical'} | Verified PO: ${enq.po_number || 'Direct'}`, M + 45, y + 28);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9.5);
  doc.text(`${qty} Pcs`, M + 280, y + 20, { align: 'center' });
  doc.text(fmtCurrency(unitPrice), M + 380, y + 20, { align: 'right' });
  doc.text(fmtCurrency(subtotal), W - M - 12, y + 20, { align: 'right' });

  // Calculation Breakdown
  y += 50;
  const totalsBoxW = 220;
  const totalsX = W - M - totalsBoxW;

  const rows = [
    { label: 'Subtotal Amount:', val: fmtCurrency(subtotal) },
    ...(discountPercent > 0 ? [{ label: `Discount Allowed (${discountPercent}%):`, val: `- ${fmtCurrency(discountVal)}` }] : []),
    { label: 'Taxable Turnover:', val: fmtCurrency(taxableVal) },
    { label: 'Central Tax CGST @ 9%:', val: fmtCurrency(cgstVal) },
    { label: 'State Tax SGST @ 9%:', val: fmtCurrency(sgstVal) }
  ];

  doc.setFontSize(9);
  rows.forEach((r, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(r.label, totalsX, y + idx * 16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(r.val, W - M - 8, y + idx * 16, { align: 'right' });
  });

  // Grand Total Highlight Bar
  const gtY = y + rows.length * 16 + 6;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(totalsX - 10, gtY, totalsBoxW + 10, 24, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL INVOICE VALUE:', totalsX, gtY + 16);
  doc.text(fmtCurrency(grandTotal), W - M - 8, gtY + 16, { align: 'right' });

  // Bank Info & Statutory declarations
  const termsY = y + 10;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('DECLARATION & TERMS:', M, termsY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('1. Goods once sold will not be taken back or exchanged.', M, termsY + 14);
  doc.text('2. We declare that this invoice shows the actual price of goods described.', M, termsY + 26);
  doc.text('3. All disputes are subject to Pune, Maharashtra jurisdiction.', M, termsY + 38);

  const bankY = termsY + 54;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(M, bankY, 260, 52, 3, 3, 'FD');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('REMITTANCE BANK DETAILS:', M + 8, bankY + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Bank: ${BANK_DETAILS.bankName} | A/C: ${BANK_DETAILS.accountNumber}`, M + 8, bankY + 26);
  doc.text(`IFSC: ${BANK_DETAILS.ifsc} | Branch: ${BANK_DETAILS.branch}`, M + 8, bankY + 38);

  // Signatory Box
  const sigY = H - 100;
  doc.setDrawColor(203, 213, 225);
  doc.line(W - M - 160, sigY + 35, W - M, sigY + 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`For ${COMPANY_DETAILS.name}`, W - M - 80, sigY + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorised Signatory', W - M - 80, sigY + 48, { align: 'center' });

  // Footer Note
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Tax Invoice generated by ${COMPANY_DETAILS.name}. Original copy.`, W / 2, H - 25, { align: 'center' });

  return doc;
}

export function previewDocumentPdf(doc) {
  const blobUrl = doc.output('bloburl');
  window.open(blobUrl, '_blank');
}

export function downloadDocumentPdf(doc, filename) {
  doc.save(filename);
}
