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
  swift: "HDFCINBB",
  branch: "Hinjawadi Phase 1, Pune"
};

const fmtCurrency = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function buildQuotationPdf(enq) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 36;
  const contentW = W - M * 2;
  const teal = [0, 128, 128];
  const dark = [30, 41, 59];
  const grey = [100, 116, 139];

  /* ── HEADER ── */
  // Top border line teal
  doc.setDrawColor(...teal);
  doc.setLineWidth(2);
  doc.line(M, 30, W - M, 30);

  // Logo circle placeholder
  doc.setFillColor(...teal);
  doc.circle(M + 28, 60, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('N', M + 28, 65, { align: 'center' });

  // Company name
  doc.setTextColor(...teal);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(COMPANY_DETAILS.name, M + 60, 55);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...dark);
  doc.text(COMPANY_DETAILS.tagline, M + 60, 70);

  // Contact line centered
  doc.setFontSize(8.5);
  doc.setTextColor(...grey);
  doc.text(`${COMPANY_DETAILS.cityStatePin}  |  ${COMPANY_DETAILS.email}  |  ${COMPANY_DETAILS.phone}`, W / 2, 90, { align: 'center' });

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(M, 97, W - M, 97);

  // QUOTATION title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...teal);
  doc.text('QUOTATION', W / 2, 114, { align: 'center' });

  /* ── CLIENT + META ROW ── */
  let y = 128;
  // Left: Quotation for
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...dark);
  doc.text('Quotation for:', M, y);
  doc.setFontSize(10);
  doc.text(enq.contact_person || enq.customer_name || 'Valued Customer', M, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...grey);
  doc.text(enq.customer_address || 'Pune, Maharashtra', M, y + 26);

  // Right: Client company + date + number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...teal);
  doc.text(enq.customer_name || 'Client Enterprise', W - M, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...dark);
  const dateStr = new Date(enq.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.text(`Date: ${dateStr}`, W - M, y + 14, { align: 'right' });
  doc.text(`Quotation #: ${enq.quotation_no || `Q-${new Date().getFullYear()}-0001`}`, W - M, y + 26, { align: 'right' });

  /* ── SUBJECT LINE ── */
  y += 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...teal);
  doc.text(`Subject :  Quotation for  ${enq.category || 'Products & Services'}`, W / 2, y, { align: 'center' });

  /* ── BODY TEXT ── */
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...dark);
  doc.text('Dear Sir,', M, y);
  y += 13;
  const bodyLine1 = `Subject: - Your enquiry for requirement for ${enq.category || 'Products & Services'} service. Dated on ${dateStr}.`;
  const wrapped1 = doc.splitTextToSize(bodyLine1, contentW);
  doc.text(wrapped1, M, y);
  y += wrapped1.length * 12 + 6;
  const bodyLine2 = 'Thank you for showing interest in our Services & contacting us. Please find our exclusive quotation for your requirement';
  const wrapped2 = doc.splitTextToSize(bodyLine2, contentW);
  doc.text(wrapped2, M, y);
  y += wrapped2.length * 12 + 10;

  /* ── TABLE ── */
  const colSr = M, colSrW = 28;
  const colDesc = M + colSrW, colDescW = 140;
  const colTech = colDesc + colDescW, colTechW = 80;
  const colDel = colTech + colTechW, colDelW = 110;
  const colPrice = colDel + colDelW, colPriceW = 68;
  const colAmt = colPrice + colPriceW, colAmtW = W - M - (colAmt - M);

  const qty = Number(enq.quantity || 1);
  const unitPrice = Number(enq.selling_price || (enq.supplier_cost ? enq.supplier_cost * 1.25 : 1000));
  const subtotal = qty * unitPrice;
  const discountPercent = Number(enq.discount_percent || 0);
  const discountVal = (subtotal * discountPercent) / 100;
  const taxableVal = subtotal - discountVal;
  const gstRate = 0.18;
  const gstVal = taxableVal * gstRate;
  const grandTotal = taxableVal + gstVal;

  // Table header
  doc.setFillColor(...teal);
  doc.rect(M, y, contentW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Sr.\nNo.', colSr + colSrW / 2, y + 8, { align: 'center' });
  doc.text('Product\nDescription', colDesc + 10, y + 8);
  doc.text('Technology', colTech + colTechW / 2, y + 8, { align: 'center' });
  doc.text('Deliverables', colDel + colDelW / 2, y + 8, { align: 'center' });
  doc.text('Price / Unit', colPrice + colPriceW / 2, y + 8, { align: 'center' });
  doc.text('Total Amount', colAmt + colAmtW / 2, y + 9, { align: 'center' });

  // Table row
  y += 22;
  const rowH = 36;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 200);
  doc.rect(M, y, contentW, rowH, 'FD');
  // vertical dividers
  [colDesc, colTech, colDel, colPrice, colAmt].forEach(x => {
    doc.line(x, y, x, y + rowH);
  });
  doc.line(W - M, y, W - M, y + rowH);

  doc.setTextColor(...dark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('1', colSr + colSrW / 2, y + rowH / 2 + 3, { align: 'center' });
  doc.text(enq.part_code || enq.category || 'Service', colDesc + 4, y + rowH / 2 + 3);
  doc.text(enq.technology || '-', colTech + colTechW / 2, y + rowH / 2 + 3, { align: 'center' });

  const delivText = doc.splitTextToSize(enq.deliverables || `1) As per scope\n2) Project deliverable`, colDelW - 6);
  doc.text(delivText, colDel + colDelW / 2, y + 10, { align: 'center' });

  doc.text(`Rs ${unitPrice.toLocaleString('en-IN')}/-`, colPrice + colPriceW / 2, y + rowH / 2 + 3, { align: 'center' });
  doc.text(`Rs ${subtotal.toLocaleString('en-IN')}/-`, colAmt + colAmtW / 2, y + rowH / 2 + 3, { align: 'center' });

  // Sub Total row
  y += rowH;
  doc.setFillColor(245, 245, 245);
  doc.rect(M, y, contentW, 18, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...dark);
  doc.text('Sub Total :', colAmt - 10, y + 12, { align: 'right' });
  doc.text(`Rs ${subtotal.toLocaleString('en-IN')} /-`, colAmt + colAmtW / 2, y + 12, { align: 'center' });

  // Grand Total row
  y += 18;
  doc.setFillColor(240, 240, 240);
  doc.rect(M, y, contentW, 18, 'FD');
  doc.text(`(Including ${Math.round(gstRate * 100)}% GST ) Grand Total :`, colAmt - 10, y + 12, { align: 'right' });
  doc.text(`Rs ${Math.round(grandTotal).toLocaleString('en-IN')}/-`, colAmt + colAmtW / 2, y + 12, { align: 'center' });

  /* ── FOOTER / SIGNATURE ── */
  const sigY = H - 90;
  doc.setDrawColor(...teal);
  doc.setLineWidth(1.5);
  doc.line(M, sigY, W - M, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...dark);
  doc.text(`For ${COMPANY_DETAILS.name}`, W - M, sigY + 30, { align: 'right' });
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.line(W - M - 140, sigY + 50, W - M, sigY + 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...grey);
  doc.text('Authorised Signatory', W - M - 70, sigY + 62, { align: 'center' });
  doc.setFontSize(7.5);
  doc.text(`GSTIN: ${COMPANY_DETAILS.gstin}  |  ${COMPANY_DETAILS.email}`, W / 2, H - 20, { align: 'center' });

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
  const M = 36;
  const contentW = W - M * 2;
  const dark = [30, 41, 59];
  const grey = [100, 116, 139];
  const teal = [0, 128, 128];

  /* ── OUTER BORDER ── */
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.8);
  doc.rect(M - 4, 20, contentW + 8, H - 36);

  /* ── HEADER ── */
  // "TAX INVOICE" title + "ORIGINAL FOR RECIPIENT"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...dark);
  doc.text('TAX INVOICE', W / 2, 38, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grey);
  doc.text('ORIGINAL FOR RECIPIENT', W - M, 38, { align: 'right' });

  // Company name block (centered)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...dark);
  doc.text(COMPANY_DETAILS.name, W / 2, 58, { align: 'center' });

  // Logo circle left
  doc.setFillColor(...teal);
  doc.circle(M + 20, 55, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('N', M + 20, 60, { align: 'center' });

  // Address lines
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grey);
  doc.text(COMPANY_DETAILS.address, W / 2, 70, { align: 'center' });
  doc.text(`${COMPANY_DETAILS.cityStatePin}`, W / 2, 79, { align: 'center' });
  doc.text(`Email: ${COMPANY_DETAILS.email}  |  Ph: ${COMPANY_DETAILS.phone}`, W / 2, 88, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...dark);
  doc.text(`GSTIN: ${COMPANY_DETAILS.gstin}`, W / 2, 98, { align: 'center' });

  // Divider
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.line(M - 4, 105, W - M + 4, 105);

  /* ── CLIENT + INVOICE META (two boxes) ── */
  let y = 110;
  const leftW = contentW * 0.52;
  const rightW = contentW - leftW;
  const rightX = M + leftW;

  // Left box lines
  const lLabels = ['Client Name :', 'Address :', '', '', 'Mobile No. :', 'Pincode :', 'GSTIN :'];
  const lVals = [
    enq.customer_name || 'Client Name',
    enq.customer_address || 'Address Line 1',
    enq.customer_address2 || '',
    enq.customer_city || '',
    enq.contact_phone || '',
    enq.pincode || '',
    enq.customer_gstin || ''
  ];

  doc.setFontSize(8);
  lLabels.forEach((lbl, i) => {
    const ly = y + 10 + i * 12;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...dark);
    if (lbl) doc.text(lbl, M + 2, ly);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    if (lVals[i]) doc.text(lVals[i], M + 60, ly);
  });

  // Right box lines
  const invoiceDate = new Date(enq.created_at || Date.now()).toISOString().split('T')[0];
  const rLabels = ['Invoice Date :', 'Invoice No :', 'State Name :', 'State Code :', 'Place of Supply :'];
  const rVals = [
    invoiceDate,
    enq.invoice_no || `NXFL/${new Date().getFullYear()}-27/0001`,
    enq.state_name || 'Maharashtra',
    enq.state_code || 'MH',
    enq.place_of_supply || 'Maharashtra (27)'
  ];

  rLabels.forEach((lbl, i) => {
    const ly = y + 10 + i * 12;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...dark);
    doc.text(lbl, rightX + 4, ly);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(rVals[i], rightX + 70, ly);
  });

  // Box borders
  const clientBoxH = lLabels.length * 12 + 16;
  doc.setDrawColor(180, 180, 180);
  doc.rect(M - 4, y, leftW + 4, clientBoxH);
  doc.rect(rightX, y, rightW + 4, clientBoxH);

  /* ── ITEMS TABLE ── */
  y += clientBoxH;
  const colSn = M - 4, colSnW = 24;
  const colDesc = colSn + colSnW, colDescW = 230;
  const colHsn = colDesc + colDescW, colHsnW = 54;
  const colQty = colHsn + colHsnW, colQtyW = 32;
  const colRate = colQty + colQtyW, colRateW = 70;
  const colAmt = colRate + colRateW, colAmtW = W - M + 4 - colAmt;

  // Header row
  doc.setFillColor(240, 240, 240);
  doc.rect(colSn, y, contentW + 8, 18, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...dark);
  doc.text('S.N.', colSn + colSnW / 2, y + 12, { align: 'center' });
  doc.text('DESCRIPTION', colDesc + colDescW / 2, y + 12, { align: 'center' });
  doc.text('HSN/SAC', colHsn + colHsnW / 2, y + 12, { align: 'center' });
  doc.text('QTY', colQty + colQtyW / 2, y + 12, { align: 'center' });
  doc.text('RATE', colRate + colRateW / 2, y + 12, { align: 'center' });
  doc.text('AMOUNT', colAmt + colAmtW / 2, y + 12, { align: 'center' });

  // col dividers
  [colDesc, colHsn, colQty, colRate, colAmt, W - M + 4].forEach(x => {
    doc.line(x, y, x, y + 18);
  });

  y += 18;

  // calc values
  const qty = Number(enq.quantity || 1);
  const unitPrice = Number(enq.selling_price || (enq.supplier_cost ? enq.supplier_cost * 1.25 : 1000));
  const subtotal = qty * unitPrice;
  const discountPercent = Number(enq.discount_percent || 0);
  const discountVal = (subtotal * discountPercent) / 100;
  const taxableVal = subtotal - discountVal;
  const cgstVal = taxableVal * 0.09;
  const sgstVal = taxableVal * 0.09;
  const grandTotal = Math.round(taxableVal + cgstVal + sgstVal);

  // Single item row (tall)
  const itemRowH = 100;
  doc.setFillColor(255, 255, 255);
  doc.rect(colSn, y, contentW + 8, itemRowH, 'FD');
  [colDesc, colHsn, colQty, colRate, colAmt, W - M + 4].forEach(x => {
    doc.line(x, y, x, y + itemRowH);
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...dark);
  doc.text('1', colSn + colSnW / 2, y + 14, { align: 'center' });
  doc.text(enq.part_code || enq.category || 'Service', colDesc + 4, y + 14);
  doc.text(enq.hsn_sac || '', colHsn + colHsnW / 2, y + 14, { align: 'center' });
  doc.text(`${qty}`, colQty + colQtyW / 2, y + 14, { align: 'center' });
  doc.text(unitPrice ? unitPrice.toLocaleString('en-IN') : '', colRate + colRateW / 2, y + 14, { align: 'center' });
  doc.text(subtotal ? subtotal.toLocaleString('en-IN') : '', colAmt + colAmtW / 2, y + 14, { align: 'center' });

  y += itemRowH;
  doc.line(colSn, y, W - M + 4, y);

  /* ── TOTALS SECTION ── */
  // Split into left (GST amount / Invoice value / Bank) and right (tax breakdown)
  const totalsH = 90;
  const splitX = colAmt; // left part is wide, right is last 2 cols combined

  // Left side
  doc.setDrawColor(180, 180, 180);
  doc.rect(colSn, y, colAmt - colSn, totalsH);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...dark);
  doc.text(`GST Amount : Rs. ${(cgstVal + sgstVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, colSn + 4, y + 18);
  doc.line(colSn, y + 25, colAmt, y + 25);
  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice Value : Rs. ${grandTotal.toLocaleString('en-IN')}`, colSn + 4, y + 42);
  doc.line(colSn, y + 50, colAmt, y + 50);

  // Right side (taxable / CGST / SGST / TOTAL)
  const rightTotals = [
    { label: 'TAXABLE AMOUNT', val: taxableVal.toLocaleString('en-IN', { minimumFractionDigits: 2 }) },
    { label: 'CGST @9%', val: cgstVal.toLocaleString('en-IN', { minimumFractionDigits: 2 }) },
    { label: 'SGST @9%', val: sgstVal.toLocaleString('en-IN', { minimumFractionDigits: 2 }) },
    { label: 'TOTAL (ROUNDED)', val: `₹ ${grandTotal.toLocaleString('en-IN')}` }
  ];

  doc.rect(colAmt, y, colAmtW, totalsH);
  rightTotals.forEach((r, i) => {
    const ry = y + 10 + i * (totalsH / 4);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...dark);
    doc.text(r.label, colAmt + 4, ry);
    doc.setFont('helvetica', 'normal');
    doc.text(r.val, W - M + 2, ry, { align: 'right' });
    if (i < rightTotals.length - 1) doc.line(colAmt, ry + 4, W - M + 4, ry + 4);
  });

  y += totalsH;

  /* ── BANK DETAILS + GRAND TOTAL ── */
  const bankBoxH = 80;
  doc.rect(colSn, y, colAmt - colSn, bankBoxH);
  doc.rect(colAmt, y, colAmtW, bankBoxH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...dark);
  doc.text('BANK ACCOUNT DETAILS', colSn + 4, y + 12);

  const bankLines = [
    ['Account Name', BANK_DETAILS.accountName],
    ['Bank Name', BANK_DETAILS.bankName],
    ['Account No.', BANK_DETAILS.accountNumber],
    ['IFSC Code', BANK_DETAILS.ifsc],
    ['SWIFT Code', BANK_DETAILS.swift || 'N/A'],
    ['Branch Name', BANK_DETAILS.branch]
  ];

  doc.setFontSize(7.5);
  bankLines.forEach(([lbl, val], i) => {
    const by = y + 22 + i * 9;
    doc.setFont('helvetica', 'bold');
    doc.text(`${lbl}`, colSn + 4, by);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${val}`, colSn + 52, by);
  });

  // Grand total right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  doc.text('Grand TOTAL', colAmt + 4, y + 30);
  doc.text(`₹ ${grandTotal.toLocaleString('en-IN')}`, W - M + 2, y + 30, { align: 'right' });

  y += bankBoxH;

  /* ── PAYMENT STATUS ── */
  doc.rect(colSn, y, colAmt - colSn, 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...dark);
  doc.text('Payment Status : ', colSn + 4, y + 12);
  doc.setTextColor(0, 150, 0);
  doc.text(enq.payment_status || 'PENDING', colSn + 72, y + 12);

  // Right side: project deal / current bill
  doc.rect(colAmt, y, colAmtW, 18);
  doc.setTextColor(...dark);
  doc.setFontSize(7.5);
  doc.text(`TOTAL PROJECT DEAL : ₹ ${(enq.total_deal || grandTotal).toLocaleString('en-IN')}`, colAmt + 4, y + 7);
  doc.text(`Current Bill Amount : ₹ ${grandTotal.toLocaleString('en-IN')}`, colAmt + 4, y + 15);

  y += 18;

  /* ── SIGNATORY ── */
  const sigY = y + 20;
  doc.setDrawColor(180, 180, 180);
  doc.line(W - M - 130, sigY + 28, W - M, sigY + 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...dark);
  doc.text(`For ${COMPANY_DETAILS.name}`, W - M - 65, sigY + 10, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...grey);
  doc.text('Authorised Signatory', W - M - 65, sigY + 40, { align: 'center' });

  doc.setFontSize(7);
  doc.text(`GSTIN: ${COMPANY_DETAILS.gstin}`, W / 2, H - 12, { align: 'center' });

  return doc;
}

export function buildDeliveryChallanPdf(enq) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const contentW = W - M * 2;

  // Header Background Bar (Navy / Steel Blue)
  doc.setFillColor(24, 71, 108);
  doc.rect(M, 35, contentW, 55, 'F');

  // Company Name & Delivery Challan Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(COMPANY_DETAILS.name, M + 14, 58);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`GSTIN: ${COMPANY_DETAILS.gstin} | PAN: ${COMPANY_DETAILS.pan}`, M + 14, 73);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('DELIVERY CHALLAN', W - M - 14, 62, { align: 'right' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('GOODS DISPATCH CONSIGNMENT NOTE', W - M - 14, 76, { align: 'right' });

  // Two-column Info Card
  let y = 105;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(M, y, contentW, 95, 4, 4, 'FD');

  // Left Column: Consignee / Deliver To
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DELIVER TO (CONSIGNEE):', M + 12, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(enq.customer_name || 'Customer Name', M + 12, y + 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Contact: ${enq.contact_email || 'client@company.com'}`, M + 12, y + 49);
  doc.text(`Phone: ${enq.contact_phone || '+91 9876543210'}`, M + 12, y + 62);
  doc.text(`Buyer PO No: ${enq.po_number || 'PO-VERIFIED'} | Order: ${enq.order_no || 'SO-CONFIRMED'}`, M + 12, y + 76);

  // Right Column: Challan & Transport Metadata
  const midX = M + contentW / 2 + 10;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TRANSPORT & CHALLAN DETAILS:', midX, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Challan No: ${enq.challan_no || 'DC-2026-001'}`, midX, y + 34);
  doc.text(`Dispatch Date: ${new Date().toLocaleDateString('en-IN')}`, midX, y + 48);
  doc.text(`Transport Mode: ${(enq.transport_mode || 'Road').toUpperCase()}`, midX, y + 62);
  doc.text(`Carrier: ${enq.transporter || 'Express Cargo'} | Tracking: ${enq.tracking_no || 'TRK-PENDING'}`, midX, y + 76);

  // Items Table
  y = 220;
  doc.setFillColor(241, 245, 249);
  doc.rect(M, y, contentW, 25, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(M, y + 25, W - M, y + 25);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('ITEM CODE / SKU', M + 10, y + 16);
  doc.text('CATEGORY & DESCRIPTION', M + 150, y + 16);
  doc.text('INSPECTION', M + 340, y + 16);
  doc.text('QTY DISPATCHED', W - M - 10, y + 16, { align: 'right' });

  // Item Row
  y += 25;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  doc.text(enq.part_code || 'PRT-SKU', M + 10, y + 20);
  doc.text(`${enq.category || 'General'} - Inspected Stock`, M + 150, y + 20);
  doc.setTextColor(5, 150, 105);
  doc.text(enq.inspection_status || 'Verified Ready', M + 340, y + 20);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text(`${enq.quantity || 1} Units`, W - M - 10, y + 20, { align: 'right' });

  // Underline
  y += 32;
  doc.setDrawColor(226, 232, 240);
  doc.line(M, y, W - M, y);

  // Dispatch & Receipt Terms
  y += 25;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(M, y, contentW, 90, 4, 4, 'FD');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('DISPATCH DECLARATION & TERMS:', M + 12, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('1. Goods listed above have undergone warehouse pick-pack and sales readiness inspection.', M + 12, y + 34);
  doc.text(`2. Shipment dispatched via ${enq.transport_mode || 'Road'} transport under carrier consignment note.`, M + 12, y + 48);
  doc.text('3. Any shortage, transit loss or damage must be notified within 24 hours of delivery.', M + 12, y + 62);
  doc.text('4. Official Delivery Challan issued subject to delivery confirmation at destination.', M + 12, y + 76);

  // Signatures Row
  const sigY = H - 110;
  // Left: Receiver Sign
  doc.setDrawColor(203, 213, 225);
  doc.line(M, sigY + 35, M + 160, sigY + 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text("Receiver's Signature & Seal", M + 80, sigY + 48, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('(Date & Received with thanks)', M + 80, sigY + 60, { align: 'center' });

  // Right: Company Sign
  doc.line(W - M - 160, sigY + 35, W - M, sigY + 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`For ${COMPANY_DETAILS.name}`, W - M - 80, sigY + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorised Signatory / Logistics Desk', W - M - 80, sigY + 48, { align: 'center' });

  // Footer Note
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Delivery Challan generated by NexFlow ERP Logistics Hub. Valid goods-in-transit document.`, W / 2, H - 25, { align: 'center' });

  return doc;
}

export function buildOpcPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 36;
  const contentW = W - M * 2;
  const teal = [0, 128, 128];
  const navy = [15, 23, 42];
  const dark = [30, 41, 59];
  const grey = [100, 116, 139];
  const lightBg = [248, 250, 252];
  const borderCol = [203, 213, 225];

  // Top Accent Bar
  doc.setFillColor(...navy);
  doc.rect(M, 28, contentW, 58, 'F');

  // Logo circle
  doc.setFillColor(...teal);
  doc.circle(M + 28, 57, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('N', M + 28, 62, { align: 'center' });

  // Company info
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(COMPANY_DETAILS.name, M + 56, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`${COMPANY_DETAILS.tagline} | GSTIN: ${COMPANY_DETAILS.gstin}`, M + 56, 64);
  doc.text(`${COMPANY_DETAILS.cityStatePin} | ${COMPANY_DETAILS.phone} | ${COMPANY_DETAILS.email}`, M + 56, 76);

  // Document Title on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(45, 212, 191); // Teal bright
  doc.text('ORDER PROCESSING CONFIRMATION', W - M - 12, 50, { align: 'right' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text('(OPC - INTERNAL & CLIENT COPY)', W - M - 12, 64, { align: 'right' });

  // Status Badge on Header Right
  const currentStatus = data.opc_status || data.status || 'Draft';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`STATUS: ${currentStatus.toUpperCase()}`, W - M - 12, 77, { align: 'right' });

  /* ── METADATA BOX (OPC No, Date, Quotation Ref, Order Ref) ── */
  let y = 94;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderCol);
  doc.setLineWidth(0.75);
  doc.roundedRect(M, y, contentW, 36, 3, 3, 'FD');

  const colW = contentW / 4;
  const opcDateStr = new Date(data.opc_date || data.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const opcNoStr = data.opc_no || `OPC-${new Date().getFullYear()}-0001`;
  const quoteRef = data.quotation_no || 'QT-CONFIRMED';
  const orderRef = data.order_reference || data.po_number || data.order_no || 'PO-PENDING';

  const metaItems = [
    { label: 'OPC NUMBER', val: opcNoStr, bold: true, color: teal },
    { label: 'OPC DATE', val: opcDateStr, bold: false, color: dark },
    { label: 'QUOTATION REF', val: quoteRef, bold: false, color: dark },
    { label: 'ORDER / PO REF', val: orderRef, bold: true, color: [180, 83, 9] }
  ];

  metaItems.forEach((m, i) => {
    const x = M + i * colW + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...grey);
    doc.text(m.label, x, y + 14);

    doc.setFont('helvetica', m.bold ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...m.color);
    doc.text(m.val, x, y + 27);

    if (i < 3) {
      doc.setDrawColor(...borderCol);
      doc.line(M + (i + 1) * colW, y + 5, M + (i + 1) * colW, y + 31);
    }
  });

  /* ── CLIENT DETAILS SECTION (Company, Contact, Billing & Delivery Addresses) ── */
  y += 44;
  const clientBoxH = 88;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderCol);
  doc.roundedRect(M, y, contentW, clientBoxH, 3, 3, 'FD');

  const halfW = contentW / 2;
  const clientComp = data.opc_company_name || data.company_name || data.customer_name || 'Client Enterprise';
  const contactPerson = data.opc_contact_person || data.contact_person || data.customer_name || 'Authorized Buyer';
  const phone = data.opc_contact_phone || data.contact_phone || '+91 98765 43210';
  const email = data.opc_contact_email || data.contact_email || 'client@enterprise.com';
  const billAddr = data.opc_billing_address || data.billing_address || 'MIDC Industrial Estate, Phase II, Pune, MH 411018';
  const delivAddr = data.opc_delivery_address || data.delivery_address || 'Customer Works / Plant Site, Pune, MH';

  // Left side: Client & Contact Person
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...navy);
  doc.text('CLIENT & CONTACT DETAILS', M + 10, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...teal);
  doc.text(clientComp, M + 10, y + 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...dark);
  doc.text(`Contact Person: ${contactPerson}`, M + 10, y + 44);
  doc.setTextColor(...grey);
  doc.text(`Mobile: ${phone}  |  Email: ${email}`, M + 10, y + 57);
  doc.text(`Enquiry No: ${data.enquiry_no || 'ENQ-DIRECT'}`, M + 10, y + 70);

  // Vertical separator
  doc.setDrawColor(...borderCol);
  doc.line(M + halfW, y + 6, M + halfW, y + clientBoxH - 6);

  // Right side: Billing & Delivery Address
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...navy);
  doc.text('BILLING & DELIVERY ADDRESS', M + halfW + 10, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...dark);
  doc.text('Billing Address:', M + halfW + 10, y + 30);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grey);
  const billLines = doc.splitTextToSize(billAddr, halfW - 20);
  doc.text(billLines, M + halfW + 72, y + 30);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text('Delivery Site:', M + halfW + 10, y + 54);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grey);
  const delivLines = doc.splitTextToSize(delivAddr, halfW - 20);
  doc.text(delivLines, M + halfW + 72, y + 54);

  /* ── PRODUCT DETAILS TABLE ── */
  y += clientBoxH + 10;
  doc.setFillColor(...navy);
  doc.rect(M, y, contentW, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('S.NO', M + 8, y + 15);
  doc.text('PRODUCT / PART CODE & SPECIFICATION', M + 42, y + 15);
  doc.text('CATEGORY', M + 260, y + 15);
  doc.text('QTY', M + 345, y + 15, { align: 'center' });
  doc.text('UNIT RATE (Rs.)', M + 430, y + 15, { align: 'right' });
  doc.text('AMOUNT (Rs.)', W - M - 8, y + 15, { align: 'right' });

  // Product Row
  y += 22;
  const prodName = data.opc_product_name || data.product_name || data.part_code || 'Standard Item SKU';
  const category = data.opc_category || data.category || 'Mechanical';
  const description = data.opc_description || data.description || data.notes || 'Industrial standard grade verified part.';
  const qty = Number(data.opc_quantity || data.quantity || 1);
  const unitPrice = Number(data.opc_unit_price || data.unit_price || data.selling_price || 0);
  const subtotal = Number(data.opc_subtotal || data.subtotal || qty * unitPrice);
  const discountPercent = Number(data.opc_discount_percent ?? data.discount_percent ?? 0);
  const discountVal = (subtotal * discountPercent) / 100;
  const taxableVal = subtotal - discountVal;
  const gstPercent = Number(data.opc_gst_percent ?? data.gst_percent ?? 18);
  const gstVal = Number(data.opc_gst_amount ?? data.gst_amount ?? (taxableVal * (gstPercent / 100)));
  const transportCharges = Number(data.opc_transport_charges ?? data.transport_charges ?? 0);
  const grandTotal = Number(data.opc_grand_total ?? data.grand_total ?? (taxableVal + gstVal + transportCharges));

  const rowH = 46;
  doc.setFillColor(255, 255, 255);
  doc.rect(M, y, contentW, rowH, 'F');
  doc.setDrawColor(...borderCol);
  doc.line(M, y + rowH, W - M, y + rowH);

  doc.setTextColor(...dark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('1', M + 14, y + 18);

  doc.text(prodName, M + 42, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...grey);
  const descLines = doc.splitTextToSize(description, 210);
  doc.text(descLines, M + 42, y + 28);

  // Category
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...dark);
  doc.text(category, M + 260, y + 20);

  // Quantity
  doc.setFont('helvetica', 'bold');
  doc.text(`${qty} Units`, M + 345, y + 20, { align: 'center' });

  // Unit Price & Subtotal
  doc.text(fmtCurrency(unitPrice), M + 430, y + 20, { align: 'right' });
  doc.text(fmtCurrency(subtotal), W - M - 8, y + 20, { align: 'right' });

  /* ── COMMERCIAL DETAILS & TOTALS + TERMS & REMARKS ── */
  y += rowH + 12;
  const termsBoxW = 280;
  const totalsBoxW = contentW - termsBoxW - 15;
  const totalsX = W - M - totalsBoxW;

  // Left: Payment Terms, Delivery Details & Remarks Box
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderCol);
  doc.roundedRect(M, y, termsBoxW, 140, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...navy);
  doc.text('TERMS, DELIVERY & SPECIAL INSTRUCTIONS', M + 10, y + 15);

  const paymentTerms = data.opc_payment_terms || data.payment_terms || '30 Days Net from Delivery';
  const deliveryTerms = data.opc_delivery_terms || data.delivery_terms || 'Door Delivery / Standard Freight Included';
  const deliverySchedule = data.opc_delivery_schedule || data.delivery_schedule || '7-10 Business Days after Confirmation';
  const remarks = data.opc_remarks || data.remarks || 'Standard packaging. Inspection and stock verification required prior to dispatch.';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...dark);
  doc.text('Payment Terms:', M + 10, y + 32);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grey);
  doc.text(paymentTerms, M + 85, y + 32);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text('Delivery Terms:', M + 10, y + 48);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grey);
  doc.text(deliveryTerms, M + 85, y + 48);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text('Delivery Schedule:', M + 10, y + 64);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grey);
  doc.text(deliverySchedule, M + 85, y + 64);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text('Remarks / Notes:', M + 10, y + 80);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grey);
  const remarkLines = doc.splitTextToSize(remarks, termsBoxW - 20);
  doc.text(remarkLines, M + 10, y + 93);

  // Right: Commercial Calculation Table
  const calcRows = [
    { label: 'Product Subtotal:', val: fmtCurrency(subtotal) },
    ...(discountPercent > 0 ? [{ label: `Discount (${discountPercent}%):`, val: `- ${fmtCurrency(discountVal)}` }] : []),
    { label: 'Taxable Amount:', val: fmtCurrency(taxableVal) },
    { label: `GST (${gstPercent}%):`, val: fmtCurrency(gstVal) },
    { label: 'Transportation Charges:', val: fmtCurrency(transportCharges) }
  ];

  calcRows.forEach((r, idx) => {
    const rowY = y + idx * 16 + 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...dark);
    doc.text(r.label, totalsX, rowY);
    doc.setFont('helvetica', 'bold');
    doc.text(r.val, W - M - 8, rowY, { align: 'right' });
  });

  // Grand Total Highlight Bar
  const gtY = y + calcRows.length * 16 + 16;
  doc.setFillColor(...navy);
  doc.roundedRect(totalsX - 6, gtY, totalsBoxW + 6, 26, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('GRAND TOTAL:', totalsX + 4, gtY + 17);
  doc.text(fmtCurrency(grandTotal), W - M - 8, gtY + 17, { align: 'right' });

  /* ── SIGNATURES SECTION ── */
  const sigY = H - 120;
  const sigBoxW = (contentW - 30) / 2;

  // Left Signature: Salesperson Prepared By
  doc.setDrawColor(...borderCol);
  doc.setFillColor(...lightBg);
  doc.roundedRect(M, sigY, sigBoxW, 70, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...navy);
  doc.text('PREPARED & VERIFIED BY (SALESPERSON)', M + 12, sigY + 15);

  const salesRep = data.opc_salesperson_name || data.salesperson_name || 'Sales Executive';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...dark);
  doc.text(salesRep, M + 12, sigY + 38);

  doc.setDrawColor(...borderCol);
  doc.line(M + 12, sigY + 52, M + sigBoxW - 12, sigY + 52);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grey);
  doc.text('Sales Department Signature & Date', M + 12, sigY + 62);

  // Right Signature: Authorized Approval
  const rightSigX = M + sigBoxW + 30;
  doc.setDrawColor(...borderCol);
  doc.setFillColor(...lightBg);
  doc.roundedRect(rightSigX, sigY, sigBoxW, 70, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...navy);
  doc.text('AUTHORIZED APPROVAL SIGNATORY', rightSigX + 12, sigY + 15);

  const approver = data.opc_approved_by || data.approved_by || 'Operations / Commercial Head';
  const approvalDate = data.opc_approved_at || data.approved_at
    ? new Date(data.opc_approved_at || data.approved_at).toLocaleDateString('en-IN')
    : 'Authorized Sign-off';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...teal);
  doc.text(`${approver}  (${approvalDate})`, rightSigX + 12, sigY + 38);

  doc.setDrawColor(...borderCol);
  doc.line(rightSigX + 12, sigY + 52, rightSigX + sigBoxW - 12, sigY + 52);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grey);
  doc.text(`Official Commercial Seal & Authorized Stamp`, rightSigX + 12, sigY + 62);

  // Footer Note
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Order Processing Confirmation (OPC) generated by NexFlow ERP. Mandatory store fulfillment & stock inspection document.`, W / 2, H - 24, { align: 'center' });

  return doc;
}

export function previewDocumentPdf(doc) {
  const blobUrl = doc.output('bloburl');
  window.open(blobUrl, '_blank');
}

export function downloadDocumentPdf(doc, filename) {
  doc.save(filename);
}
