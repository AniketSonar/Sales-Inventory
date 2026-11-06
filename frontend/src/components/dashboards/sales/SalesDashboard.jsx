import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { salesConfig } from '../../layout/dashboardConfigs';
import { Send, FileText, Truck, CheckCircle2, RefreshCw, DollarSign } from 'lucide-react';
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

  return (
    <DashboardLayout
      config={salesConfig}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      <div className="dash-view-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Sales Commercial & Fulfilment Hub</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>Manage full lifecycle: Price validation, quotations, customer POs, invoicing & transporter dispatch.</p>
        </div>
        <button
          onClick={fetchEnquiries}
          className="dash-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e293b' }}
        >
          <RefreshCw size={15} /> Refresh DB
        </button>
      </div>

      {msg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} />
          <span>{msg}</span>
        </div>
      )}

      {/* Main Table */}
      <div className="dash-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="#38bdf8" /> Real-Time Orders & Sales Lifecycle
        </h3>
        <table className="dash-table">
          <thead>
            <tr>
              <th>Enquiry Ref</th>
              <th>Customer</th>
              <th>Item / Qty</th>
              <th>Purchase Cost</th>
              <th>Quotation Total</th>
              <th>PO / Sales Order</th>
              <th>Status</th>
              <th>Sales Actions</th>
            </tr>
          </thead>
          <tbody>
            {enquiries.map(enq => (
              <tr key={enq.id}>
                <td><strong>{enq.enquiry_no}</strong></td>
                <td>{enq.customer_name}</td>
                <td>{enq.part_code} (×{enq.quantity})</td>
                <td>
                  {enq.supplier_cost ? (
                    <span style={{ color: '#38bdf8' }}>${enq.supplier_cost}</span>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>Awaiting Cost</span>
                  )}
                </td>
                <td>
                  {enq.quotation_amount ? (
                    <strong style={{ color: '#34d399' }}>${enq.quotation_amount} ({enq.quotation_no})</strong>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>—</span>
                  )}
                </td>
                <td>
                  {enq.order_no ? (
                    <div>
                      <span style={{ color: '#818cf8', fontWeight: 600 }}>{enq.order_no}</span>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PO: {enq.po_number}</div>
                    </div>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>—</span>
                  )}
                </td>
                <td>
                  <span className="status-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                    {enq.status}
                  </span>
                </td>
                <td>
                  {/* Step 6: Issue Quotation */}
                  {enq.supplier_cost && !enq.quotation_no && (
                    <button
                      className="dash-btn"
                      onClick={() => {
                        setActiveAction({ type: 'QUOTE', item: enq });
                        setSellingPrice(enq.supplier_cost * 1.3);
                      }}
                    >
                      Issue Quote
                    </button>
                  )}

                  {/* Step 8-9: Verify PO & Generate Sales Order */}
                  {enq.quotation_no && !enq.order_no && (
                    <button
                      className="dash-btn"
                      style={{ background: '#f59e0b' }}
                      onClick={() => {
                        setActiveAction({ type: 'PO', item: enq });
                        setPoNumber(`PO-CUST-${Math.floor(1000 + Math.random() * 9000)}`);
                      }}
                    >
                      Verify PO & Create SO
                    </button>
                  )}

                  {/* Step 11-13: Invoice & Transporter Dispatch */}
                  {enq.order_no && enq.status !== 'Dispatched & Closed' && (
                    <button
                      className="dash-btn"
                      style={{ background: enq.store_status.includes('Packed') ? '#10b981' : '#1e293b' }}
                      onClick={() => {
                        setActiveAction({ type: 'DISPATCH', item: enq });
                        setInvoiceNo(`INV-${Math.floor(10000 + Math.random() * 90000)}`);
                        setTrackingNo(`TRK-EXP-${Math.floor(10000 + Math.random() * 90000)}`);
                      }}
                    >
                      Invoice & Dispatch
                    </button>
                  )}

                  {enq.status === 'Dispatched & Closed' && (
                    <span style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
                      ✓ Closed ({enq.invoice_no})
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Modals */}
      {activeAction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="dash-card animate-fade" style={{ maxWidth: '480px', width: '90%', margin: 0, border: '1px solid #38bdf8' }}>
            {activeAction.type === 'QUOTE' && (
              <form onSubmit={handleIssueQuotation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Send size={18} color="#38bdf8" /> Issue Quotation: {activeAction.item.enquiry_no}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  Supplier cost is <strong>${activeAction.item.supplier_cost}</strong>. Set client selling price:
                </p>
                <div>
                  <label style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Selling Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={sellingPrice}
                    onChange={e => setSellingPrice(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', borderRadius: '8px', marginTop: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Discount Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={e => setDiscount(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', borderRadius: '8px', marginTop: '6px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button type="submit" className="dash-btn" style={{ flex: 1 }}>Send Quotation to Client</button>
                  <button type="button" className="dash-btn" style={{ background: '#1e293b' }} onClick={() => setActiveAction(null)}>Cancel</button>
                </div>
              </form>
            )}

            {activeAction.type === 'PO' && (
              <form onSubmit={handleConvertPO} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="#fbbf24" /> Verify Customer PO & Confirm Sales Order
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  Enquiry <strong>{activeAction.item.enquiry_no}</strong> for <strong>{activeAction.item.customer_name}</strong>
                </p>
                <div>
                  <label style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Customer Purchase Order (PO) Number *</label>
                  <input
                    type="text"
                    required
                    value={poNumber}
                    onChange={e => setPoNumber(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', borderRadius: '8px', marginTop: '6px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button type="submit" className="dash-btn" style={{ flex: 1, background: '#f59e0b' }}>Confirm & Send to Store</button>
                  <button type="button" className="dash-btn" style={{ background: '#1e293b' }} onClick={() => setActiveAction(null)}>Cancel</button>
                </div>
              </form>
            )}

            {activeAction.type === 'DISPATCH' && (
              <form onSubmit={handleDispatch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={18} color="#34d399" /> Invoice & Transporter Dispatch
                </h3>
                <div>
                  <label style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Invoice Number *</label>
                  <input
                    type="text"
                    required
                    value={invoiceNo}
                    onChange={e => setInvoiceNo(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', borderRadius: '8px', marginTop: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Transporter / Carrier Mode *</label>
                  <input
                    type="text"
                    required
                    value={transporter}
                    onChange={e => setTransporter(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', borderRadius: '8px', marginTop: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Tracking / AWB Number *</label>
                  <input
                    type="text"
                    required
                    value={trackingNo}
                    onChange={e => setTrackingNo(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', borderRadius: '8px', marginTop: '6px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button type="submit" className="dash-btn" style={{ flex: 1, background: '#10b981' }}>Complete Dispatch & Close</button>
                  <button type="button" className="dash-btn" style={{ background: '#1e293b' }} onClick={() => setActiveAction(null)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
