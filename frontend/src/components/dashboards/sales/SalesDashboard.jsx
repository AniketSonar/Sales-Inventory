import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { salesConfig } from '../../layout/dashboardConfigs';
import { Send, FileText, Truck, CheckCircle2, RefreshCw, DollarSign, Clock, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { useLiveSync } from '../../../utils/useLiveSync';

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

  return (
    <DashboardLayout
      config={salesConfig}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      <div className="dash-view-header">
        <div>
          <h2>Sales Commercial & Fulfilment Hub</h2>
          <p>Manage full lifecycle: Price validation, quotations, customer POs, invoicing & transporter dispatch.</p>
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

      {/* Main Table */}
      <div className="dash-card" style={{ padding: '20px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={19} color="#2563eb" /> Real-Time Orders & Sales Lifecycle
        </h3>
        
        <div className="dash-table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Enquiry Ref</th>
                <th>Customer</th>
                <th>Item / Qty</th>
                <th>Purchase Cost</th>
                <th>Quotation Total</th>
                <th>PO / Sales Order</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '20px' }}>Sales Actions</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No orders or enquiries found in the database.
                  </td>
                </tr>
              ) : (
                enquiries.map(enq => (
                  <tr key={enq.id}>
                    <td>
                      <span className="data-code-pill">{enq.enquiry_no}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.88rem' }}>{enq.customer_name}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{enq.contact_email || enq.contact_phone || 'Direct Lead'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{enq.part_code}</span>
                        <span className="status-badge badge-slate" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>×{enq.quantity}</span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#64748b' }}>{enq.category}</span>
                    </td>
                    <td>
                      {enq.supplier_cost ? (
                        <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.92rem' }}>${Number(enq.supplier_cost).toFixed(2)}</span>
                      ) : (
                        <span className="status-badge badge-amber" style={{ fontSize: '0.74rem' }}>Awaiting Cost</span>
                      )}
                    </td>
                    <td>
                      {enq.quotation_amount ? (
                        <div>
                          <strong style={{ color: '#059669', fontSize: '0.92rem' }}>${Number(enq.quotation_amount).toFixed(2)}</strong>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>{enq.quotation_no}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td>
                      {enq.order_no ? (
                        <div>
                          <span style={{ color: '#4f46e5', fontWeight: 700, fontSize: '0.88rem' }}>{enq.order_no}</span>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>PO: {enq.po_number}</div>
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

      {/* Action Modals */}
      {activeAction && (
        <div className="modal-backdrop">
          <div className="modal-dialog animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {activeAction.type === 'QUOTE' && <Send size={20} color="#2563eb" />}
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
                  Supplier Cost: <strong style={{ color: '#0f172a' }}>${activeAction.item.supplier_cost}</strong> for customer <strong>{activeAction.item.customer_name}</strong>. Set client selling price:
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
                  Enquiry <strong style={{ color: '#0f172a' }}>{activeAction.item.enquiry_no}</strong> for client <strong style={{ color: '#0f172a' }}>{activeAction.item.customer_name}</strong>
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
    </DashboardLayout>
  );
}
