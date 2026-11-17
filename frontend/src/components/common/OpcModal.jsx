import React, { useState, useEffect } from 'react';
import { 
  X, FileText, CheckCircle2, ShieldCheck, Send, Printer, 
  Download, ExternalLink, Edit3, Save, ArrowRight, AlertCircle, Building, Truck, DollarSign
} from 'lucide-react';
import { buildOpcPdf, previewDocumentPdf, downloadDocumentPdf } from '../../utils/documentGenerator';

export default function OpcModal({ isOpen, onClose, enquiry, onSaved }) {
  if (!isOpen || !enquiry) return null;

  // Initialize or prefill state from existing OPC or enquiry/quotation
  const isExistingOpc = Boolean(enquiry.opc_id || enquiry.opc_no);
  const currentStatus = enquiry.opc_status || 'Draft';
  const isEditable = currentStatus === 'Draft' || currentStatus === 'Pending Approval' || !isExistingOpc;

  const [companyName, setCompanyName] = useState(enquiry.opc_company_name || enquiry.customer_name || '');
  const [contactPerson, setContactPerson] = useState(enquiry.opc_contact_person || enquiry.contact_person || enquiry.customer_name || '');
  const [contactPhone, setContactPhone] = useState(enquiry.opc_contact_phone || enquiry.contact_phone || '');
  const [contactEmail, setContactEmail] = useState(enquiry.opc_contact_email || enquiry.contact_email || '');
  const [billingAddress, setBillingAddress] = useState(enquiry.opc_billing_address || 'MIDC Industrial Area, Phase II, Pune, Maharashtra 411018');
  const [deliveryAddress, setDeliveryAddress] = useState(enquiry.opc_delivery_address || 'Client Works / Receiving Bay, Pune, Maharashtra');

  const [productName, setProductName] = useState(enquiry.opc_product_name || enquiry.part_code || '');
  const [category, setCategory] = useState(enquiry.opc_category || enquiry.category || 'Mechanical');
  const [description, setDescription] = useState(enquiry.opc_description || enquiry.notes || 'Industrial standard grade verified components as per quotation.');
  const [quantity, setQuantity] = useState(Number(enquiry.opc_quantity || enquiry.quantity || 1));

  const initialUnitPrice = Number(enquiry.opc_unit_price || enquiry.selling_price || (enquiry.supplier_cost ? enquiry.supplier_cost * 1.3 : 1000));
  const [unitPrice, setUnitPrice] = useState(initialUnitPrice);
  const [discountPercent, setDiscountPercent] = useState(Number(enquiry.opc_discount_percent ?? enquiry.discount_percent ?? 0));
  const [gstPercent, setGstPercent] = useState(Number(enquiry.opc_gst_percent ?? 18));
  const [transportCharges, setTransportCharges] = useState(Number(enquiry.opc_transport_charges ?? 0));

  const [orderReference, setOrderReference] = useState(
    enquiry.opc_order_reference || enquiry.po_number || `PO-${(enquiry.customer_name || 'CLI').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [paymentTerms, setPaymentTerms] = useState(enquiry.opc_payment_terms || '30 Days Net from Delivery Date');
  const [deliveryTerms, setDeliveryTerms] = useState(enquiry.opc_delivery_terms || 'Door Delivery / Standard Freight Included');
  const [deliverySchedule, setDeliverySchedule] = useState(enquiry.opc_delivery_schedule || '7-10 Business Days after Confirmation');
  const [remarks, setRemarks] = useState(enquiry.opc_remarks || 'Handle with care. Mandatory store stock verification & packing certificate before transport.');
  const [salespersonName, setSalespersonName] = useState(enquiry.opc_salesperson_name || 'Sales Executive');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-calculated totals
  const subtotal = quantity * unitPrice;
  const discountVal = (subtotal * discountPercent) / 100;
  const taxableVal = subtotal - discountVal;
  const gstAmount = (taxableVal * gstPercent) / 100;
  const grandTotal = taxableVal + gstAmount + transportCharges;

  const fmtCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Assemble full payload
  const assembleData = (targetStatus) => ({
    enquiry_id: enquiry.id,
    order_reference: orderReference,
    company_name: companyName,
    contact_person: contactPerson,
    contact_phone: contactPhone,
    contact_email: contactEmail,
    billing_address: billingAddress,
    delivery_address: deliveryAddress,
    product_name: productName,
    category,
    description,
    quantity,
    unit_price: unitPrice,
    subtotal,
    discount_percent: discountPercent,
    gst_percent: gstPercent,
    gst_amount: gstAmount,
    transport_charges: transportCharges,
    grand_total: grandTotal,
    payment_terms: paymentTerms,
    delivery_terms: deliveryTerms,
    delivery_schedule: deliverySchedule,
    remarks,
    salesperson_name: salespersonName,
    status: targetStatus
  });

  // Save / Update OPC
  const handleSave = async (targetStatus) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = assembleData(targetStatus);
      const url = enquiry.opc_id 
        ? `http://localhost:5000/api/opc/${enquiry.opc_id}`
        : 'http://localhost:5000/api/opc';
      const method = enquiry.opc_id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || `OPC successfully saved with status: ${targetStatus}`);
        if (onSaved) onSaved();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Failed to save OPC');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error while saving OPC');
    } finally {
      setLoading(false);
    }
  };

  // Submit for approval
  const handleSubmitApproval = async () => {
    if (!enquiry.opc_id) {
      await handleSave('Pending Approval');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`http://localhost:5000/api/opc/${enquiry.opc_id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performed_by: salespersonName })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        if (onSaved) onSaved();
        setTimeout(() => onClose(), 1500);
      } else {
        setErrorMsg(data.message || 'Failed to submit for approval');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error submitting OPC');
    } finally {
      setLoading(false);
    }
  };

  // Approve OPC (Authorized user approves -> auto forward to Store)
  const handleApprove = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const opcId = enquiry.opc_id;
      if (!opcId) {
        setErrorMsg('Please save the OPC before approving.');
        setLoading(false);
        return;
      }

      const res = await fetch(`http://localhost:5000/api/opc/${opcId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: 'Commercial & Operations Authority' })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        if (onSaved) onSaved();
        setTimeout(() => onClose(), 1500);
      } else {
        setErrorMsg(data.message || 'Failed to approve OPC');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error approving OPC');
    } finally {
      setLoading(false);
    }
  };

  // Prepare full data for PDF generator
  const getPdfData = () => {
    return {
      ...enquiry,
      opc_no: enquiry.opc_no || 'OPC-PENDING-CREATION',
      opc_date: enquiry.opc_date || new Date().toISOString(),
      order_reference: orderReference,
      quotation_no: enquiry.quotation_no,
      company_name: companyName,
      contact_person: contactPerson,
      contact_phone: contactPhone,
      contact_email: contactEmail,
      billing_address: billingAddress,
      delivery_address: deliveryAddress,
      product_name: productName,
      category,
      description,
      quantity,
      unit_price: unitPrice,
      subtotal,
      discount_percent: discountPercent,
      gst_percent: gstPercent,
      gst_amount: gstAmount,
      transport_charges: transportCharges,
      grand_total: grandTotal,
      payment_terms: paymentTerms,
      delivery_terms: deliveryTerms,
      delivery_schedule: deliverySchedule,
      remarks,
      salesperson_name: salespersonName,
      status: currentStatus,
      approved_by: enquiry.opc_approved_by || 'Operations Head',
      approved_at: enquiry.opc_approved_at
    };
  };

  const handleOpenPdf = () => {
    const doc = buildOpcPdf(getPdfData());
    previewDocumentPdf(doc);
  };

  const handleDownloadPdf = () => {
    const doc = buildOpcPdf(getPdfData());
    downloadDocumentPdf(doc, `OPC-${enquiry.opc_no || 'Draft'}.pdf`);
  };

  const handlePrintPdf = () => {
    const doc = buildOpcPdf(getPdfData());
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
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
        maxWidth: '920px',
        maxHeight: '94vh',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #cbd5e1'
      }}>
        {/* Header Bar */}
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
            <FileText size={20} color="#2dd4bf" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Order Processing Confirmation (OPC)</span>
                {enquiry.opc_no && (
                  <span style={{ color: '#2dd4bf', fontSize: '0.9rem' }}>#{enquiry.opc_no}</span>
                )}
                <span className={`status-badge ${
                  currentStatus === 'Draft' ? 'badge-slate' :
                  currentStatus === 'Pending Approval' ? 'badge-amber' :
                  currentStatus === 'Approved' || currentStatus === 'Sent to Store' ? 'badge-blue' :
                  'badge-emerald'
                }`} style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                  {currentStatus}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Enquiry: {enquiry.enquiry_no} | Quotation: {enquiry.quotation_no || 'Approved'} | Client: {enquiry.customer_name}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePrintPdf}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 11px',
                background: '#334155',
                color: '#f8fafc',
                border: '1px solid #475569',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Print A4 PDF"
            >
              <Printer size={13} /> Print
            </button>
            <button
              onClick={handleOpenPdf}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 11px',
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #475569',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Preview in new tab"
            >
              <ExternalLink size={13} /> PDF Preview
            </button>
            <button
              onClick={handleDownloadPdf}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                background: '#0d9488',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Download PDF"
            >
              <Download size={13} /> Download
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div style={{ padding: '10px 20px', background: '#fef2f2', borderBottom: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '10px 20px', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', color: '#15803d', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Workflow Progression Stepper */}
        <div style={{ padding: '12px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {[
            { label: 'Draft', active: true },
            { label: 'Pending Approval', active: ['Pending Approval', 'Approved', 'Sent to Store', 'Stock Verified', 'Packing Completed'].includes(currentStatus) },
            { label: 'Approved', active: ['Approved', 'Sent to Store', 'Stock Verified', 'Packing Completed'].includes(currentStatus) },
            { label: 'Sent to Store', active: ['Sent to Store', 'Stock Verified', 'Packing Completed'].includes(currentStatus) },
            { label: 'Stock Verified', active: ['Stock Verified', 'Packing Completed'].includes(currentStatus) },
            { label: 'Packing Completed', active: currentStatus === 'Packing Completed' }
          ].map((st, idx, arr) => (
            <React.Fragment key={st.label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: st.active ? '#0d9488' : '#cbd5e1',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {idx + 1}
                </span>
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: st.active ? 700 : 500,
                  color: st.active ? '#0f172a' : '#94a3b8'
                }}>
                  {st.label}
                </span>
              </div>
              {idx < arr.length - 1 && (
                <div style={{ flex: 1, height: '2px', background: st.active ? '#0d9488' : '#e2e8f0', margin: '0 8px' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Body (Scrollable) */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, backgroundColor: '#ffffff' }}>
          {/* Section 1: Client & Delivery Information */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building size={16} color="#0d9488" />
              <span>1. Client & Delivery Information (Auto-fetched & Editable)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Client Company Name *
                </label>
                <input
                  type="text"
                  className="dash-input"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem' }}
                  value={companyName}
                  disabled={!isEditable}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Contact Person *
                </label>
                <input
                  type="text"
                  className="dash-input"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem' }}
                  value={contactPerson}
                  disabled={!isEditable}
                  onChange={(e) => setContactPerson(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Contact Mobile / Phone *
                </label>
                <input
                  type="text"
                  className="dash-input"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem' }}
                  value={contactPhone}
                  disabled={!isEditable}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Client Email *
                </label>
                <input
                  type="email"
                  className="dash-input"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem' }}
                  value={contactEmail}
                  disabled={!isEditable}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Billing Address
                </label>
                <input
                  type="text"
                  className="dash-input"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem' }}
                  value={billingAddress}
                  disabled={!isEditable}
                  onChange={(e) => setBillingAddress(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Delivery / Site Address
                </label>
                <input
                  type="text"
                  className="dash-input"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem' }}
                  value={deliveryAddress}
                  disabled={!isEditable}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Order Reference & Product Details */}
          <div style={{ marginBottom: '20px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Truck size={16} color="#0d9488" />
              <span>2. Product & Order References</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Order / PO Reference *
                </label>
                <input
                  type="text"
                  className="dash-input"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem', fontWeight: 700, color: '#b45309' }}
                  value={orderReference}
                  disabled={!isEditable}
                  onChange={(e) => setOrderReference(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Product Name / Part Code *
                </label>
                <input
                  type="text"
                  className="dash-input"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem' }}
                  value={productName}
                  disabled={!isEditable}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Category
                </label>
                <input
                  type="text"
                  className="dash-input"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem' }}
                  value={category}
                  disabled={!isEditable}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Quantity (Units) *
                </label>
                <input
                  type="number"
                  min="1"
                  className="dash-input"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem' }}
                  value={quantity}
                  disabled={!isEditable}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
            </div>
            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Technical Description &amp; Specifications
              </label>
              <input
                type="text"
                className="dash-input"
                style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem' }}
                value={description}
                disabled={!isEditable}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Section 3: Commercial & Pricing Calculations */}
          <div style={{ marginBottom: '20px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={16} color="#0d9488" />
              <span>3. Commercial Pricing &amp; GST Details</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Unit Rate (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="dash-input"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem' }}
                  value={unitPrice}
                  disabled={!isEditable}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Discount (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="dash-input"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem' }}
                  value={discountPercent}
                  disabled={!isEditable}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  GST Rate (%)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="dash-input"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem' }}
                  value={gstPercent}
                  disabled={!isEditable}
                  onChange={(e) => setGstPercent(Number(e.target.value))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Transportation Charges (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="dash-input"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem' }}
                  value={transportCharges}
                  disabled={!isEditable}
                  onChange={(e) => setTransportCharges(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Calculations Summary Card */}
            <div style={{ marginTop: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                <span>Subtotal: <strong>{fmtCurrency(subtotal)}</strong></span>
                {discountVal > 0 && <span style={{ marginLeft: '12px', color: '#b91c1c' }}>Discount: -{fmtCurrency(discountVal)}</span>}
                <span style={{ marginLeft: '12px' }}>Taxable: <strong>{fmtCurrency(taxableVal)}</strong></span>
                <span style={{ marginLeft: '12px' }}>GST: <strong>{fmtCurrency(gstAmount)}</strong></span>
                <span style={{ marginLeft: '12px' }}>Freight: <strong>{fmtCurrency(transportCharges)}</strong></span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.76rem', color: '#64748b', display: 'block' }}>Grand Total (Payable):</span>
                <strong style={{ fontSize: '1.2rem', color: '#0d9488' }}>{fmtCurrency(grandTotal)}</strong>
              </div>
            </div>
          </div>

          {/* Section 4: Terms, Schedule & Instructions */}
          <div style={{ paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
              4. Payment Terms, Delivery Schedule &amp; Special Remarks
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Payment Terms
                </label>
                <input
                  type="text"
                  className="dash-input"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem' }}
                  value={paymentTerms}
                  disabled={!isEditable}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Delivery Terms
                </label>
                <input
                  type="text"
                  className="dash-input"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem' }}
                  value={deliveryTerms}
                  disabled={!isEditable}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Delivery Schedule
                </label>
                <input
                  type="text"
                  className="dash-input"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem' }}
                  value={deliverySchedule}
                  disabled={!isEditable}
                  onChange={(e) => setDeliverySchedule(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginTop: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Remarks / Special Instructions
                </label>
                <input
                  type="text"
                  className="dash-input"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem' }}
                  value={remarks}
                  disabled={!isEditable}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Salesperson (Prepared By)
                </label>
                <input
                  type="text"
                  className="dash-input"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem' }}
                  value={salespersonName}
                  disabled={!isEditable}
                  onChange={(e) => setSalespersonName(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Store Verification & Packing Logs if present */}
          {(enquiry.opc_store_verification_notes || enquiry.opc_packing_notes) && (
            <div style={{ marginTop: '16px', padding: '12px 14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857', marginBottom: '6px' }}>
                Store &amp; Warehouse Verification Status:
              </div>
              {enquiry.opc_store_verification_notes && (
                <div style={{ fontSize: '0.78rem', color: '#065f46' }}>
                  <strong>Stock Verified By:</strong> {enquiry.opc_store_verified_by || 'Store Keeper'} | {enquiry.opc_store_verification_notes}
                </div>
              )}
              {enquiry.opc_packing_notes && (
                <div style={{ fontSize: '0.78rem', color: '#065f46', marginTop: '4px' }}>
                  <strong>Packing Completed By:</strong> {enquiry.opc_packing_completed_by || 'Store Team'} | {enquiry.opc_packing_notes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Bottom Bar */}
        <div style={{
          padding: '14px 24px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={onClose}
            className="dash-btn dash-btn-secondary"
            style={{ fontSize: '0.84rem' }}
          >
            Close
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isEditable && (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSave('Draft')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    background: '#ffffff',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Save size={14} /> Save as Draft
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmitApproval}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    background: '#f59e0b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Send size={14} /> Submit for Approval
                </button>
              </>
            )}

            {currentStatus === 'Pending Approval' && (
              <button
                type="button"
                disabled={loading}
                onClick={handleApprove}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: '#0d9488',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <ShieldCheck size={15} /> Approve &amp; Send to Store
              </button>
            )}

            {currentStatus === 'Draft' && (
              <button
                type="button"
                disabled={loading}
                onClick={handleApprove}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: '#0d9488',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Directly approve and dispatch to Store Department"
              >
                <ShieldCheck size={15} /> Approve &amp; Forward to Store
              </button>
            )}

            {(currentStatus === 'Sent to Store' || currentStatus === 'Stock Verified' || currentStatus === 'Packing Completed') && (
              <span style={{ fontSize: '0.84rem', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={16} /> Approved &amp; Forwarded to Store
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
