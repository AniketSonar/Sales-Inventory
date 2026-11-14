import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { salesConfig } from '../../layout/dashboardConfigs';
import {
  Send,
  FileText,
  Truck,
  CheckCircle2,
  RefreshCw,
  DollarSign,
  Clock,
  ShieldCheck,
  ArrowRight,
  X,
  Wrench,
  Zap,
  Monitor,
  Layers,
  Search,
  Filter,
  Check,
  Paperclip,
  Eye,
  Download
} from 'lucide-react';
import { useLiveSync } from '../../../utils/useLiveSync';
import DocumentModal from '../../common/DocumentModal';
import { buildQuotationPdf, buildInvoicePdf, buildSalesOrderPdf, downloadDocumentPdf } from '../../../utils/documentGenerator';

export default function SalesDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [enquiries, setEnquiries] = useState([]);
  const [activeAction, setActiveAction] = useState(null); // { type: 'QUOTE' | 'PO' | 'DISPATCH', item }
  const [sellingPrice, setSellingPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [poNumber, setPoNumber] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [transporter, setTransporter] = useState('Roadways Cargo Express');
  const [trackingNo, setTrackingNo] = useState('');
  const [msg, setMsg] = useState('');
  const [previewModal, setPreviewModal] = useState({ isOpen: false, type: 'quotation', data: null });

  // Compartment filter: 'all' | 'mechanical' | 'electrical' | 'computer'
  const [selectedCompartment, setSelectedCompartment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEnquiries = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/enquiries');
      const data = await res.json();
      if (data.success) {
        setEnquiries(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useLiveSync(fetchEnquiries, 3000);

  // 1. Issue Quotation
  const handleIssueQuotation = async (e) => {
    e.preventDefault();
    if (!activeAction?.item) return;

    try {
      const res = await fetch('http://localhost:5000/api/sales/quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enquiry_id: activeAction.item.id,
          selling_price: sellingPrice,
          discount_percent: discount
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Quotation ${data.quotation_no} created and recorded in DB!`);
        setActiveAction(null);
        fetchEnquiries();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Convert PO to Sales Order
  const handleConvertPO = async (e) => {
    e.preventDefault();
    if (!activeAction?.item) return;

    try {
      const res = await fetch('http://localhost:5000/api/sales/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enquiry_id: activeAction.item.id,
          po_number: poNumber
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Sales Order ${data.order_no} created in DB! Forwarded to Store for Packing.`);
        setActiveAction(null);
        fetchEnquiries();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Invoice & Dispatch
  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!activeAction?.item) return;

    try {
      const res = await fetch('http://localhost:5000/api/sales/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enquiry_id: activeAction.item.id,
          invoice_no: invoiceNo,
          transporter,
          tracking_no: trackingNo
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Invoice ${data.invoice_no} issued & Transporter (${data.tracking_no}) logged! Order Closed.`);
        setActiveAction(null);
        fetchEnquiries();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return <span className="status-badge badge-slate">Pending</span>;
    if (status.includes('Dispatched') || status.includes('Closed')) {
      return <span className="status-badge badge-emerald"><CheckCircle2 size={13} /> {status}</span>;
    }
    if (status.includes('Confirmed') || status.includes('Packed')) {
      return <span className="status-badge badge-blue"><ShieldCheck size={13} /> {status}</span>;
    }
    if (status.includes('Pricing Received')) {
      return <span className="status-badge badge-blue"><DollarSign size={13} /> {status}</span>;
    }
    if (status.includes('Awaiting')) {
      return <span className="status-badge badge-amber"><Clock size={13} /> {status}</span>;
    }
    return <span className="status-badge badge-slate">{status}</span>;
  };

  // Compartment Configurations
  const compartments = [
    {
      id: 'mechanical',
      name: 'Mechanical',
      fullTitle: 'Mechanical Compartment Requirements',
      shortTitle: 'Mechanical',
      description: 'Valves, actuators, industrial pumps, gearboxes, bearings, flanges & hardware',
      icon: Wrench,
      matcher: (category) => {
        const c = (category || '').toLowerCase();
        return c.includes('mech');
      }
    },
    {
      id: 'electrical',
      name: 'Electrical',
      fullTitle: 'Electrical Compartment Requirements',
      shortTitle: 'Electrical',
      description: 'Transformers, switchgear, relays, power distribution panels, cables & sensors',
      icon: Zap,
      matcher: (category) => {
        const c = (category || '').toLowerCase();
        return c.includes('elect');
      }
    },
    {
      id: 'computer',
      name: 'Computer / IT',
      fullTitle: 'Computer / IT Compartment Requirements',
      shortTitle: 'Computer / IT',
      description: 'Rack servers, enterprise storage, network switches, routers & workstation parts',
      icon: Monitor,
      matcher: (category) => {
        const c = (category || '').toLowerCase();
        return c.includes('comp') || c.includes('it');
      }
    }
  ];

  // Lifecycle stage filtering from sidebar activeTab
  const lifecycleFilteredEnquiries = useMemo(() => {
    let list = enquiries;

    if (activeTab === 'quotations') {
      // Items pending quotation
      list = list.filter(e => !e.quotation_no);
    } else if (activeTab === 'customer-pos') {
      // Items that have quotation awaiting PO confirmation or confirmed SO
      list = list.filter(e => e.quotation_no);
    } else if (activeTab === 'dispatch') {
      // Items with confirmed order ready for dispatch or completed
      list = list.filter(e => e.order_no);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        (e.enquiry_no && e.enquiry_no.toLowerCase().includes(q)) ||
        (e.customer_name && e.customer_name.toLowerCase().includes(q)) ||
        (e.part_code && e.part_code.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q))
      );
    }

    return list;
  }, [enquiries, activeTab, searchQuery]);

  // Grouped by Compartment
  const compartmentData = useMemo(() => {
    const mechanicalList = lifecycleFilteredEnquiries.filter(e => compartments[0].matcher(e.category));
    const electricalList = lifecycleFilteredEnquiries.filter(e => compartments[1].matcher(e.category));
    const computerList = lifecycleFilteredEnquiries.filter(e => compartments[2].matcher(e.category));
    
    // Catch-all for uncategorized
    const otherList = lifecycleFilteredEnquiries.filter(e =>
      !compartments[0].matcher(e.category) &&
      !compartments[1].matcher(e.category) &&
      !compartments[2].matcher(e.category)
    );

    return {
      mechanical: mechanicalList,
      electrical: electricalList,
      computer: computerList,
      other: otherList
    };
  }, [lifecycleFilteredEnquiries]);

  // Render Table for a Compartment
  const renderCompartmentTable = (items, compartmentInfo) => {
    const IconComponent = compartmentInfo.icon;
    return (
      <div className="dash-card" key={compartmentInfo.id} style={{ padding: '22px', marginBottom: '24px' }}>
        {/* Compartment Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#edf4f9',
                border: '1px solid #cbdce8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#18476c'
              }}
            >
              <IconComponent size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, padding: 0, border: 'none', fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>
                {compartmentInfo.fullTitle}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                {compartmentInfo.description}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="status-badge"
              style={{
                background: '#edf4f9',
                border: '1px solid #cbdce8',
                color: '#18476c',
                fontWeight: 700,
                fontSize: '0.78rem',
                padding: '4px 10px'
              }}
            >
              {items.length} {items.length === 1 ? 'Requirement' : 'Requirements'}
            </span>
          </div>
        </div>

        {/* Compartment Table */}
        <div className="dash-table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Enquiry Ref</th>
                <th>Customer</th>
                <th>Item / Part Code</th>
                <th>Supplier Cost</th>
                <th>Quotation Total</th>
                <th>PO / Sales Order</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '20px' }}>Sales Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No {compartmentInfo.name} requirements logged currently.
                  </td>
                </tr>
              ) : (
                items.map(enq => (
                  <tr key={enq.id}>
                    <td>
                      <span className="data-code-pill">{enq.enquiry_no}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.88rem' }}>{enq.customer_name}</strong>
                      <span style={{ fontSize: '0.74rem', color: '#64748b' }}>{enq.contact_email || enq.contact_phone || 'Direct Lead'}</span>
                      {enq.pdf_attachment && (
                        <div style={{ marginTop: '3px' }}>
                          <a
                            href={enq.pdf_attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={enq.attachment_name || `${enq.enquiry_no}_attachment.pdf`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 7px',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '4px',
                              color: '#1d4ed8',
                              textDecoration: 'none',
                              fontSize: '0.72rem',
                              fontWeight: 600
                            }}
                            title="Download / View Attached PDF"
                          >
                            <Paperclip size={11} /> {enq.attachment_name || 'Attached PDF'}
                          </a>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{enq.part_code}</span>
                        <span className="status-badge badge-slate" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>×{enq.quantity}</span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#18476c', fontWeight: 600 }}>{enq.category}</span>
                    </td>
                    <td>
                      {enq.supplier_cost ? (
                        <span style={{ color: '#18476c', fontWeight: 700, fontSize: '0.92rem' }}>₹{Number(enq.supplier_cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      ) : (
                        <span className="status-badge badge-amber" style={{ fontSize: '0.74rem' }}>Awaiting Cost</span>
                      )}
                    </td>
                    <td>
                      {enq.quotation_amount ? (
                        <div>
                          <strong style={{ color: '#18476c', fontSize: '0.92rem' }}>₹{Number(enq.quotation_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>{enq.quotation_no}</div>
                          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                            <button
                              type="button"
                              onClick={() => setPreviewModal({ isOpen: true, type: 'quotation', data: enq })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 7px',
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                color: '#1e40af'
                              }}
                              title="Preview Quotation Document"
                            >
                              <Eye size={11} color="#2563eb" /> View
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadDocumentPdf(buildQuotationPdf(enq), `Quotation-${enq.quotation_no}.pdf`)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '2px 6px',
                                background: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                                color: '#475569'
                              }}
                              title="Download Quotation PDF"
                            >
                              <Download size={11} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td>
                      {enq.order_no ? (
                        <div>
                          <span style={{ color: '#18476c', fontWeight: 700, fontSize: '0.88rem' }}>{enq.order_no}</span>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>PO: {enq.po_number}</div>
                          
                          <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                            {/* Sales Order Document */}
                            <button
                              type="button"
                              onClick={() => setPreviewModal({ isOpen: true, type: 'order', data: enq })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 7px',
                                background: '#fffbeb',
                                border: '1px solid #fde68a',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                color: '#b45309'
                              }}
                              title="View Confirmed Sales Order"
                            >
                              <Eye size={11} color="#d97706" /> View SO
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadDocumentPdf(buildSalesOrderPdf(enq), `SalesOrder-${enq.order_no}.pdf`)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '2px 6px',
                                background: '#fffbeb',
                                border: '1px solid #fde68a',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                                color: '#b45309'
                              }}
                              title="Download Sales Order PDF"
                            >
                              <Download size={11} />
                            </button>

                            {/* Tax Invoice Document */}
                            {enq.invoice_no && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setPreviewModal({ isOpen: true, type: 'invoice', data: enq })}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: '2px 7px',
                                    background: '#ecfdf5',
                                    border: '1px solid #a7f3d0',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    color: '#047857'
                                  }}
                                  title="Preview Tax Invoice"
                                >
                                  <Eye size={11} color="#059669" /> Invoice
                                </button>
                                <button
                                  type="button"
                                  onClick={() => downloadDocumentPdf(buildInvoicePdf(enq), `Invoice-${enq.invoice_no}.pdf`)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '2px 6px',
                                    background: '#ecfdf5',
                                    border: '1px solid #a7f3d0',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    cursor: 'pointer',
                                    color: '#047857'
                                  }}
                                  title="Download Invoice PDF"
                                >
                                  <Download size={11} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td>
                      {getStatusBadge(enq.status)}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                      {/* Step 6: Issue Quotation */}
                      {enq.supplier_cost && !enq.quotation_no && (
                        <button
                          className="dash-btn"
                          onClick={() => {
                            setActiveAction({ type: 'QUOTE', item: enq });
                            setSellingPrice(Number(enq.supplier_cost * 1.3).toFixed(2));
                          }}
                        >
                          <Send size={14} /> Issue Quote
                        </button>
                      )}

                      {/* Step 8-9: Verify PO & Generate Sales Order */}
                      {enq.quotation_no && !enq.order_no && (
                        <button
                          className="dash-btn dash-btn-amber"
                          onClick={() => {
                            setActiveAction({ type: 'PO', item: enq });
                            setPoNumber(`PO-CUST-${Math.floor(1000 + Math.random() * 9000)}`);
                          }}
                        >
                          <FileText size={14} /> Verify PO & SO
                        </button>
                      )}

                      {/* Step 11-13: Invoice & Transporter Dispatch */}
                      {enq.order_no && enq.status !== 'Dispatched & Closed' && (
                        <button
                          className="dash-btn dash-btn-emerald"
                          onClick={() => {
                            setActiveAction({ type: 'DISPATCH', item: enq });
                            setInvoiceNo(`INV-${Math.floor(10000 + Math.random() * 90000)}`);
                            setTrackingNo(`TRK-EXP-${Math.floor(10000 + Math.random() * 90000)}`);
                          }}
                        >
                          <Truck size={14} /> Invoice & Dispatch
                        </button>
                      )}

                      {enq.status === 'Dispatched & Closed' && (
                        <span style={{ color: '#059669', fontSize: '0.84rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={16} /> Closed ({enq.invoice_no})
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout
      config={salesConfig}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {/* Header */}
      <div className="dash-view-header">
        <div>
          <h2>Sales Commercial & Fulfilment Hub</h2>
          <p>Compartment-segregated sales pipeline: Price quotes, customer PO validation, invoicing & dispatches.</p>
        </div>
        <button
          onClick={fetchEnquiries}
          className="dash-btn dash-btn-secondary"
        >
          <RefreshCw size={15} /> Refresh DB
        </button>
      </div>

      {msg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, fontSize: '0.9rem' }}>
          <CheckCircle2 size={18} />
          <span>{msg}</span>
        </div>
      )}

      {/* TOP COMPARTMENT KPI OVERVIEW ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '22px' }}>
        {/* Mechanical KPI */}
        <div
          onClick={() => setSelectedCompartment(selectedCompartment === 'mechanical' ? 'all' : 'mechanical')}
          className="dash-card"
          style={{
            padding: '18px 20px',
            margin: 0,
            cursor: 'pointer',
            border: selectedCompartment === 'mechanical' ? '1px solid #18476c' : '1px solid #cbdce8',
            borderTop: '4px solid #18476c',
            background: selectedCompartment === 'mechanical' ? '#edf4f9' : '#ffffff',
            transition: 'all 0.18s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#edf4f9', border: '1px solid #cbdce8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#18476c' }}>
                <Wrench size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Mechanical</span>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Industrial Valves, Pumps & Parts</div>
              </div>
            </div>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#18476c' }}>
              {compartmentData.mechanical.length}
            </span>
          </div>
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
            <span>Quotes Needed: <strong>{compartmentData.mechanical.filter(e => e.supplier_cost && !e.quotation_no).length}</strong></span>
            <span>Active Orders: <strong>{compartmentData.mechanical.filter(e => e.order_no).length}</strong></span>
          </div>
        </div>

        {/* Electrical KPI */}
        <div
          onClick={() => setSelectedCompartment(selectedCompartment === 'electrical' ? 'all' : 'electrical')}
          className="dash-card"
          style={{
            padding: '18px 20px',
            margin: 0,
            cursor: 'pointer',
            border: selectedCompartment === 'electrical' ? '1px solid #18476c' : '1px solid #cbdce8',
            borderTop: '4px solid #334155',
            background: selectedCompartment === 'electrical' ? '#edf4f9' : '#ffffff',
            transition: 'all 0.18s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#edf4f9', border: '1px solid #cbdce8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#18476c' }}>
                <Zap size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Electrical</span>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Switchgear, Transformers & Panels</div>
              </div>
            </div>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#18476c' }}>
              {compartmentData.electrical.length}
            </span>
          </div>
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
            <span>Quotes Needed: <strong>{compartmentData.electrical.filter(e => e.supplier_cost && !e.quotation_no).length}</strong></span>
            <span>Active Orders: <strong>{compartmentData.electrical.filter(e => e.order_no).length}</strong></span>
          </div>
        </div>

        {/* Computer / IT KPI */}
        <div
          onClick={() => setSelectedCompartment(selectedCompartment === 'computer' ? 'all' : 'computer')}
          className="dash-card"
          style={{
            padding: '18px 20px',
            margin: 0,
            cursor: 'pointer',
            border: selectedCompartment === 'computer' ? '1px solid #18476c' : '1px solid #cbdce8',
            borderTop: '4px solid #0f172a',
            background: selectedCompartment === 'computer' ? '#edf4f9' : '#ffffff',
            transition: 'all 0.18s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#edf4f9', border: '1px solid #cbdce8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#18476c' }}>
                <Monitor size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Computer / IT</span>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Servers, Switches & Storage</div>
              </div>
            </div>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#18476c' }}>
              {compartmentData.computer.length}
            </span>
          </div>
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
            <span>Quotes Needed: <strong>{compartmentData.computer.filter(e => e.supplier_cost && !e.quotation_no).length}</strong></span>
            <span>Active Orders: <strong>{compartmentData.computer.filter(e => e.order_no).length}</strong></span>
          </div>
        </div>
      </div>

      {/* FILTER & COMPARTMENT SELECTOR TOOLBAR */}
      <div
        className="dash-card"
        style={{
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Compartment Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px' }}>
            Compartment:
          </span>

          <button
            type="button"
            className="dash-btn"
            style={{
              background: selectedCompartment === 'all' ? '#18476c' : '#ffffff',
              color: selectedCompartment === 'all' ? '#ffffff' : '#334155',
              borderColor: selectedCompartment === 'all' ? '#18476c' : '#cbd5e1',
              padding: '6px 14px',
              fontSize: '0.82rem',
              borderRadius: '7px'
            }}
            onClick={() => setSelectedCompartment('all')}
          >
            All Compartments ({lifecycleFilteredEnquiries.length})
          </button>

          <button
            type="button"
            className="dash-btn"
            style={{
              background: selectedCompartment === 'mechanical' ? '#18476c' : '#ffffff',
              color: selectedCompartment === 'mechanical' ? '#ffffff' : '#334155',
              borderColor: selectedCompartment === 'mechanical' ? '#18476c' : '#cbd5e1',
              padding: '6px 14px',
              fontSize: '0.82rem',
              borderRadius: '7px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setSelectedCompartment('mechanical')}
          >
            <Wrench size={14} /> Mechanical ({compartmentData.mechanical.length})
          </button>

          <button
            type="button"
            className="dash-btn"
            style={{
              background: selectedCompartment === 'electrical' ? '#18476c' : '#ffffff',
              color: selectedCompartment === 'electrical' ? '#ffffff' : '#334155',
              borderColor: selectedCompartment === 'electrical' ? '#18476c' : '#cbd5e1',
              padding: '6px 14px',
              fontSize: '0.82rem',
              borderRadius: '7px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setSelectedCompartment('electrical')}
          >
            <Zap size={14} /> Electrical ({compartmentData.electrical.length})
          </button>

          <button
            type="button"
            className="dash-btn"
            style={{
              background: selectedCompartment === 'computer' ? '#18476c' : '#ffffff',
              color: selectedCompartment === 'computer' ? '#ffffff' : '#334155',
              borderColor: selectedCompartment === 'computer' ? '#18476c' : '#cbd5e1',
              padding: '6px 14px',
              fontSize: '0.82rem',
              borderRadius: '7px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setSelectedCompartment('computer')}
          >
            <Monitor size={14} /> Computer / IT ({compartmentData.computer.length})
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: '240px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search part code, customer, ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: '32px',
              paddingRight: '12px',
              fontSize: '0.84rem',
              width: '100%',
              borderRadius: '8px'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* COMPARTMENTS LIST SECTIONS */}
      {selectedCompartment === 'all' && (
        <div className="compartments-separated-wrapper">
          {/* 1. Mechanical Compartment Section */}
          {renderCompartmentTable(compartmentData.mechanical, compartments[0])}

          {/* 2. Electrical Compartment Section */}
          {renderCompartmentTable(compartmentData.electrical, compartments[1])}

          {/* 3. Computer / IT Compartment Section */}
          {renderCompartmentTable(compartmentData.computer, compartments[2])}

          {/* 4. Other / Uncategorized Section if any */}
          {compartmentData.other.length > 0 && (
            renderCompartmentTable(compartmentData.other, {
              id: 'other',
              name: 'General',
              fullTitle: 'General / Unclassified Requirements',
              shortTitle: 'General',
              description: 'Requirements awaiting compartment categorization',
              icon: Layers
            })
          )}
        </div>
      )}

      {/* Individual Compartment Focus View */}
      {selectedCompartment === 'mechanical' && (
        renderCompartmentTable(compartmentData.mechanical, compartments[0])
      )}

      {selectedCompartment === 'electrical' && (
        renderCompartmentTable(compartmentData.electrical, compartments[1])
      )}

      {selectedCompartment === 'computer' && (
        renderCompartmentTable(compartmentData.computer, compartments[2])
      )}

      {/* ACTION MODALS */}
      {activeAction && (
        <div className="modal-backdrop">
          <div className="modal-dialog animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {activeAction.type === 'QUOTE' && <Send size={20} color="#18476c" />}
                {activeAction.type === 'PO' && <FileText size={20} color="#d97706" />}
                {activeAction.type === 'DISPATCH' && <Truck size={20} color="#059669" />}
                <h3 style={{ margin: 0, padding: 0, border: 'none', fontSize: '1.15rem' }}>
                  {activeAction.type === 'QUOTE' && `Issue Quotation: ${activeAction.item.enquiry_no}`}
                  {activeAction.type === 'PO' && `Verify Customer PO & Confirm SO`}
                  {activeAction.type === 'DISPATCH' && `Invoice & Transporter Dispatch`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveAction(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {activeAction.type === 'QUOTE' && (
              <form onSubmit={handleIssueQuotation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.88rem', color: '#64748b', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  Compartment: <strong style={{ color: '#18476c' }}>{activeAction.item.category}</strong> | Customer: <strong style={{ color: '#0f172a' }}>{activeAction.item.customer_name}</strong> | Supplier Cost: <strong style={{ color: '#0f172a' }}>${activeAction.item.supplier_cost}</strong>.
                </p>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={sellingPrice}
                    onChange={e => setSellingPrice(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Discount Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={e => setDiscount(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewModal({
                      isOpen: true,
                      type: 'quotation',
                      data: {
                        ...activeAction.item,
                        selling_price: parseFloat(sellingPrice) || 0,
                        discount_percent: parseFloat(discount) || 0,
                        quotation_no: `QT-PREVIEW-${activeAction.item.enquiry_no ? activeAction.item.enquiry_no.replace('ENQ-', '') : '001'}`
                      }
                    })}
                    className="dash-btn dash-btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Eye size={15} /> Preview Quotation PDF
                  </button>
                  <button type="submit" className="dash-btn" style={{ flex: 1, padding: '10px' }}>
                    Send Quotation to Client
                  </button>
                  <button type="button" className="dash-btn dash-btn-secondary" onClick={() => setActiveAction(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {activeAction.type === 'PO' && (
              <form onSubmit={handleConvertPO} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.88rem', color: '#64748b', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  Enquiry <strong style={{ color: '#0f172a' }}>{activeAction.item.enquiry_no}</strong> ({activeAction.item.category}) for client <strong style={{ color: '#0f172a' }}>{activeAction.item.customer_name}</strong>
                </p>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Customer Purchase Order (PO) Number *</label>
                  <input
                    type="text"
                    required
                    value={poNumber}
                    onChange={e => setPoNumber(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewModal({
                      isOpen: true,
                      type: 'order',
                      data: {
                        ...activeAction.item,
                        po_number: poNumber,
                        order_no: `SO-PREVIEW-${activeAction.item.enquiry_no ? activeAction.item.enquiry_no.replace('ENQ-', '') : '001'}`
                      }
                    })}
                    className="dash-btn dash-btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Eye size={15} /> Preview Sales Order PDF
                  </button>
                  <button type="submit" className="dash-btn dash-btn-amber" style={{ flex: 1, padding: '10px' }}>
                    Confirm & Send to Store
                  </button>
                  <button type="button" className="dash-btn dash-btn-secondary" onClick={() => setActiveAction(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {activeAction.type === 'DISPATCH' && (
              <form onSubmit={handleDispatch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Invoice Number *</label>
                  <input
                    type="text"
                    required
                    value={invoiceNo}
                    onChange={e => setInvoiceNo(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Transporter / Carrier Mode *</label>
                  <input
                    type="text"
                    required
                    value={transporter}
                    onChange={e => setTransporter(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Tracking / AWB Number *</label>
                  <input
                    type="text"
                    required
                    value={trackingNo}
                    onChange={e => setTrackingNo(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewModal({
                      isOpen: true,
                      type: 'invoice',
                      data: {
                        ...activeAction.item,
                        invoice_no: invoiceNo,
                        transporter: transporter,
                        tracking_no: trackingNo
                      }
                    })}
                    className="dash-btn dash-btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Eye size={15} /> Preview Tax Invoice
                  </button>
                  <button type="submit" className="dash-btn dash-btn-emerald" style={{ flex: 1, padding: '10px' }}>
                    Complete Dispatch & Close
                  </button>
                  <button type="button" className="dash-btn dash-btn-secondary" onClick={() => setActiveAction(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Document Preview Modal */}
      <DocumentModal
        isOpen={previewModal.isOpen}
        type={previewModal.type}
        data={previewModal.data}
        onClose={() => setPreviewModal({ isOpen: false, type: 'quotation', data: null })}
      />
    </DashboardLayout>
  );
}
