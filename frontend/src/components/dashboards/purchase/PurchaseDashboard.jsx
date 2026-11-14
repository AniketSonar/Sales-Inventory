import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { purchaseConfig } from '../../layout/dashboardConfigs';
import { DollarSign, IndianRupee, CheckCircle2, Clock, RefreshCw, AlertCircle, ShoppingCart, Box, X, Lock } from 'lucide-react';
import { useLiveSync } from '../../../utils/useLiveSync';

export default function PurchaseDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [enquiries, setEnquiries] = useState([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [supplierCost, setSupplierCost] = useState('');
  const [availability, setAvailability] = useState('Available');
  const [leadTime, setLeadTime] = useState(3);
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');

  const isClosed = (enq) => {
    const s = (enq.status || '').toLowerCase();
    const d = (enq.dispatch_status || '').toLowerCase();
    return s.includes('closed') || s.includes('dispatched') || d.includes('dispatched');
  };

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

  const handleOpenPricingModal = (enq) => {
    if (isClosed(enq)) {
      alert(`Order ${enq.order_no || enq.enquiry_no} has already been closed and dispatched. Pricing is locked.`);
      return;
    }
    setSelectedEnquiry(enq);
    setSupplierCost(enq.supplier_cost || '');
    setAvailability(enq.availability || 'Available');
    setLeadTime(enq.lead_time_days || 3);
    setNotes(enq.purchase_notes || '');
  };

  const handleSubmitPricing = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry) return;

    try {
      const res = await fetch('http://localhost:5000/api/purchase/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enquiry_id: selectedEnquiry.id,
          supplier_cost: supplierCost,
          availability,
          lead_time_days: leadTime,
          notes
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Supplier cost and availability saved to Database for ${selectedEnquiry.enquiry_no}!`);
        setSelectedEnquiry(null);
        fetchEnquiries();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout
      config={purchaseConfig}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      <div className="dash-view-header">
        <div>
          <h2>Procurement & Pricing Desk</h2>
          <p>Provide accurate supplier cost, availability, and lead time for customer inquiries.</p>
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

      <div style={{ display: 'grid', gridTemplateColumns: selectedEnquiry ? '1fr 440px' : '1fr', gap: '22px' }}>
        {/* Enquiries List */}
        <div className="dash-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={19} color="#18476c" /> Enquiries Awaiting / With Purchase Pricing
          </h3>
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Enquiry</th>
                  <th>Customer</th>
                  <th>Category</th>
                  <th>Part Code & Qty</th>
                  <th>Supplier Cost</th>
                  <th>Availability</th>
                  <th>Lead Time</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No enquiries pending pricing.
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
                      </td>
                      <td>
                        <span className="status-badge badge-blue">
                          {enq.category}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{enq.part_code}</span>
                        <span className="status-badge badge-slate" style={{ marginLeft: 6, fontSize: '0.72rem', padding: '2px 6px' }}>×{enq.quantity}</span>
                      </td>
                      <td>
                        {enq.supplier_cost ? (
                          <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.92rem' }}>₹{Number(enq.supplier_cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span className="status-badge badge-amber" style={{ fontSize: '0.74rem' }}>Awaiting Cost</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${enq.supplier_cost ? 'badge-emerald' : 'badge-amber'}`}>
                          {enq.availability || 'Pending'}
                        </span>
                      </td>
                      <td>
                        {enq.lead_time_days ? (
                          <span style={{ fontWeight: 600, color: '#334155' }}>{enq.lead_time_days} days</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                        {isClosed(enq) ? (
                          <span
                            className="status-badge badge-slate"
                            style={{ fontSize: '0.78rem', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px', opacity: 0.85 }}
                            title="Order is closed and fulfilled. Pricing is permanently locked."
                          >
                            <Lock size={12} /> Locked (Closed)
                          </span>
                        ) : (
                          <button
                            className={enq.supplier_cost ? "dash-btn dash-btn-secondary" : "dash-btn"}
                            onClick={() => handleOpenPricingModal(enq)}
                          >
                            <IndianRupee size={14} /> {enq.supplier_cost ? 'Update Cost' : 'Enter Pricing'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing Side Panel */}
        {selectedEnquiry && (
          <div className="dash-card animate-fade" style={{ border: '1px solid #cbdce8', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, padding: 0, border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={19} color="#18476c" /> Record Pricing
              </h3>
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '0.84rem', color: '#475569' }}>
              <div>Ref: <strong style={{ color: '#0f172a' }}>{selectedEnquiry.enquiry_no}</strong></div>
              <div>Customer: <strong style={{ color: '#0f172a' }}>{selectedEnquiry.customer_name}</strong></div>
              <div>Item: <strong style={{ color: '#0f172a' }}>{selectedEnquiry.part_code}</strong> (Qty: {selectedEnquiry.quantity})</div>
            </div>

            <form onSubmit={handleSubmitPricing} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>Supplier Cost Per Unit (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 350.00"
                  value={supplierCost}
                  onChange={e => setSupplierCost(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>Stock Availability Status *</label>
                <select
                  value={availability}
                  onChange={e => setAvailability(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="Available">Available in Warehouse</option>
                  <option value="Supplier Ready">Supplier Stock Ready</option>
                  <option value="Sourcing Required">Sourcing / Manufacturing Required</option>
                  <option value="Backorder">Backorder</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>Procurement Lead Time (Days) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={leadTime}
                  onChange={e => setLeadTime(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>Supplier Reference / Notes</label>
                <textarea
                  rows="2"
                  placeholder="Vendor name, batch validity..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" className="dash-btn" style={{ flex: 1, padding: '10px' }}>
                  Save to Database
                </button>
                <button
                  type="button"
                  className="dash-btn dash-btn-secondary"
                  onClick={() => setSelectedEnquiry(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
