import React from 'react';
import { X, Download, ExternalLink, Printer, FileText, CheckCircle2, Building, ShieldCheck } from 'lucide-react';
import { COMPANY_DETAILS, BANK_DETAILS, buildQuotationPdf, buildInvoicePdf, buildSalesOrderPdf, previewDocumentPdf, downloadDocumentPdf } from '../../utils/documentGenerator';

export default function DocumentModal({ isOpen, onClose, type = 'quotation', data }) {
  if (!isOpen || !data) return null;

  const isQuotation = type === 'quotation';
  const isOrder = type === 'order' || type === 'sales_order' || type === 'po';
  const isInvoice = type === 'invoice';

  const docTitle = isQuotation 
    ? 'OFFICIAL QUOTATION' 
    : isOrder 
      ? 'SALES ORDER CONFIRMATION' 
      : 'TAX INVOICE';

  const docNumber = isQuotation 
    ? (data.quotation_no || `QT-${new Date().getFullYear()}-001`)
    : isOrder
      ? (data.order_no || `SO-${new Date().getFullYear()}-001`)
      : (data.invoice_no || `INV-${new Date().getFullYear()}-001`);

  const qty = Number(data.quantity || 1);
  const unitPrice = Number(data.selling_price || (data.supplier_cost ? data.supplier_cost * 1.25 : 1000));
  const subtotal = qty * unitPrice;
  const discountPercent = Number(data.discount_percent || 0);
  const discountVal = (subtotal * discountPercent) / 100;
  const taxableVal = subtotal - discountVal;
  const cgstVal = taxableVal * 0.09;
  const sgstVal = taxableVal * 0.09;
  const grandTotal = taxableVal + cgstVal + sgstVal;

  const fmtCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getDoc = () => {
    if (isQuotation) return buildQuotationPdf(data);
    if (isOrder) return buildSalesOrderPdf(data);
    return buildInvoicePdf(data);
  };

  const handleDownload = () => {
    const doc = getDoc();
    const prefix = isQuotation ? 'Quotation' : isOrder ? 'SalesOrder' : 'Invoice';
    downloadDocumentPdf(doc, `${prefix}-${docNumber}.pdf`);
  };

  const handleOpenNewTab = () => {
    const doc = getDoc();
    previewDocumentPdf(doc);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: '860px',
        maxHeight: '94vh',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #cbd5e1'
      }}>
        {/* Modal Top Bar */}
        <div style={{
          padding: '14px 24px',
          background: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color="#93c5fd" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '0.3px' }}>
                {docTitle}: <span style={{ color: '#93c5fd' }}>{docNumber}</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Client: {data.customer_name || 'Customer'} | Ref: {data.enquiry_no || 'Direct'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleOpenNewTab}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #475569',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Open full PDF in new tab"
            >
              <ExternalLink size={14} /> Open PDF
            </button>
            <button
              onClick={handleDownload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Download PDF document"
            >
              <Download size={14} /> Download PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Document Paper Body */}
        <div style={{
          padding: '30px 40px',
          overflowY: 'auto',
          backgroundColor: '#f8fafc',
          color: '#1e293b',
          fontSize: '0.88rem'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '35px 35px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            borderRadius: '6px'
          }}>
            {/* Header Charcoal Banner */}
            <div style={{
              background: '#1e293b',
              color: '#ffffff',
              padding: '16px 20px',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '22px'
            }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.5px' }}>{COMPANY_DETAILS.name}</div>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{COMPANY_DETAILS.tagline}</div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                  GSTIN: {COMPANY_DETAILS.gstin} | PAN: {COMPANY_DETAILS.pan}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '1px' }}>{docTitle}</div>
                <div style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 600, letterSpacing: '0.5px' }}>
                  ORIGINAL FOR RECIPIENT
                </div>
              </div>
            </div>

            {/* Info Grid: Buyer & Document Metadata */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              padding: '16px 18px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              marginBottom: '22px'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                  {isQuotation ? 'QUOTATION TO (CLIENT):' : isOrder ? 'BUYER / ORDER TO:' : 'BILLED TO (BUYER):'}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{data.customer_name || 'Client Name'}</div>
                <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '3px' }}>
                  Email: {data.contact_email || 'client@company.com'}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                  Phone: {data.contact_phone || '+91 9876543210'}
                </div>
                {data.po_number && (
                  <div style={{ fontSize: '0.84rem', color: '#b45309', fontWeight: 700, marginTop: '5px', background: '#fef3c7', padding: '3px 8px', borderRadius: '4px', display: 'inline-block' }}>
                    Customer PO: {data.po_number}
                  </div>
                )}
              </div>

              <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '20px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                  DOCUMENT DETAILS:
                </div>
                <table style={{ width: '100%', fontSize: '0.82rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#64748b', paddingBottom: '4px' }}>
                        {isQuotation ? 'Quotation No:' : isOrder ? 'Sales Order No:' : 'Invoice No:'}
                      </td>
                      <td style={{ fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>{docNumber}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', paddingBottom: '4px' }}>Date:</td>
                      <td style={{ fontWeight: 600, textAlign: 'right' }}>{new Date().toLocaleDateString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748b', paddingBottom: '4px' }}>Enquiry Ref:</td>
                      <td style={{ fontWeight: 600, textAlign: 'right' }}>{data.enquiry_no || 'ENQ-DIRECT'}</td>
                    </tr>
                    {isOrder && (
                      <tr>
                        <td style={{ color: '#64748b', paddingBottom: '4px' }}>Store Status:</td>
                        <td style={{ fontWeight: 700, textAlign: 'right', color: '#0369a1' }}>
                          {data.store_status || 'Pending Store Packing'}
                        </td>
                      </tr>
                    )}
                    {isInvoice && (
                      <tr>
                        <td style={{ color: '#64748b' }}>Dispatch &amp; Docket:</td>
                        <td style={{ fontWeight: 600, textAlign: 'right', color: '#047857' }}>
                          {data.transporter || 'SafeExpress'} / {data.tracking_no || 'TRK-9821'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ border: '1px solid #334155', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#334155', color: '#ffffff', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '10px 14px', width: '50px', textAlign: 'center' }}>S.No</th>
                    <th style={{ padding: '10px 14px' }}>Description &amp; Part Code</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '80px' }}>Qty</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', width: '130px' }}>Unit Price</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', width: '130px' }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: '#64748b' }}>1</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{data.part_code || 'STANDARD-PART'}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        Category: {data.category || 'Mechanical'} | Industrial Standard Hardware
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>{qty} Pcs</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }}>{fmtCurrency(unitPrice)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{fmtCurrency(subtotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Financial Breakdown & Terms */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '25px', marginBottom: '25px' }}>
              {/* Terms & Bank */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Terms &amp; Statutory Notes:
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748b', lineHeight: 1.5, marginBottom: '14px' }}>
                  1. Payment terms: 50% advance along with PO, balance before delivery.<br />
                  2. Goods dispatched with carrier tracking docket.<br />
                  3. Standard 12 months technical warranty against defects.
                </div>

                <div style={{ background: '#f8fafc', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}>
                  <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>Remittance Account Details:</strong>
                  <span style={{ color: '#475569' }}>
                    Bank: {BANK_DETAILS.bankName} | A/C: {BANK_DETAILS.accountNumber}<br />
                    IFSC: {BANK_DETAILS.ifsc} | Branch: {BANK_DETAILS.branch}
                  </span>
                </div>
              </div>

              {/* Totals Table */}
              <div style={{ width: '280px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>Subtotal:</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{fmtCurrency(subtotal)}</td>
                      </tr>
                      {discountPercent > 0 && (
                        <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#b91c1c' }}>
                          <td style={{ padding: '8px 12px' }}>Discount ({discountPercent}%):</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>- {fmtCurrency(discountVal)}</td>
                        </tr>
                      )}
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>Taxable Amount:</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{fmtCurrency(taxableVal)}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>CGST @ 9%:</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{fmtCurrency(cgstVal)}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>SGST @ 9%:</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{fmtCurrency(sgstVal)}</td>
                      </tr>
                      <tr style={{ background: '#1e293b', color: '#ffffff' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>Total Payable:</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, fontSize: '0.95rem' }}>{fmtCurrency(grandTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px dashed #cbd5e1' }}>
              <div style={{ textAlign: 'center', width: '220px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '35px' }}>
                  For {COMPANY_DETAILS.name}
                </div>
                <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.78rem', color: '#64748b' }}>
                  Authorised Signatory
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div style={{
          padding: '12px 24px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Verify client, part code, pricing, and tax calculation before distribution.
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '7px 18px',
              background: '#e2e8f0',
              color: '#334155',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
