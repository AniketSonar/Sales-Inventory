import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { purchaseConfig } from '../../layout/dashboardConfigs';
import { 
  DollarSign, IndianRupee, CheckCircle2, Clock, RefreshCw, 
  AlertCircle, ShoppingCart, Box, X, Lock, Send, ShieldCheck, CheckSquare, Layers 
} from 'lucide-react';
import { useLiveSync } from '../../../utils/useLiveSync';
import { API_URL } from '../../../config/api';

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

  const isVerifiedFromSales = (enq) => {
    const s = enq.status || '';
    // Unverified enquiries still with Sales must NOT go to Purchase!
    if (s.includes('New - Assigned') || s.includes('Follow-up & Verification')) {
      return false;
    }
    return true;
  };

  const fetchEnquiries = async () => {
    try {
      const res = await fetch(`${API_URL}/api/enquiries`);
      const data = await res.json();
      if (data.success) {
        setEnquiries(data.data);
      }
    } catch (err) {
      console.error('Error fetching enquiries:', err);
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
      const res = await fetch(`${API_URL}/api/purchase/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enquiry_id: selectedEnquiry.id,
          supplier_cost: supplierCost,
          availability,
          lead_time_days: leadTime,
          notes,
          performed_by: 'Purchase Officer'
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Cost estimation calculated and sent back to Salesperson for ${selectedEnquiry.enquiry_no}!`);
        setSelectedEnquiry(null);
        fetchEnquiries();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error recording pricing:', err);
    }
  };

  // Filter based on active tab
  const verifiedList = enquiries.filter(isVerifiedFromSales);

  const displayedList = verifiedList.filter(e => {
    if (activeTab === 'vendor-costs') {
      return !!e.supplier_cost;
    }
    if (activeTab === 'availability') {
      return true;
    }
    return true; // 'dashboard': all verified enquiries
  });

  return (
    <DashboardLayout
      config={purchaseConfig}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      <div className="dash-view-header">
        <div>
          <h2>Purchase Department – Cost Estimation & Parts Check</h2>
          <p>Receive verified enquiries from Sales, check required products & parts, calculate purchase costs, and return estimates to Sales.</p>
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

      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="dash-card" style={{ padding: '16px', borderTop: '3px solid #d97706', margin: 0 }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Verified by Sales</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
            {verifiedList.length}
          </div>
          <span style={{ fontSize: '0.74rem', color: '#d97706' }}>Awaiting or Priced</span>
        </div>
        <div className="dash-card" style={{ padding: '16px', borderTop: '3px solid #ef4444', margin: 0 }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Pending Cost Calculation</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', margin: '4px 0' }}>
            {verifiedList.filter(e => !e.supplier_cost).length}
          </div>
          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Action required</span>
        </div>
        <div className="dash-card" style={{ padding: '16px', borderTop: '3px solid #10b981', margin: 0 }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Estimates Sent to Sales</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', margin: '4px 0' }}>
            {verifiedList.filter(e => e.supplier_cost).length}
          </div>
          <span style={{ fontSize: '0.74rem', color: '#059669' }}>Handed over to Sales</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedEnquiry ? '1fr 440px' : '1fr', gap: '22px' }}>
        {/* Enquiries List */}
        <div className="dash-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <DollarSign size={19} color="#18476c" /> Verified Enquiries for Cost Estimation
            </h3>
            <span className="status-badge badge-slate" style={{ fontSize: '0.76rem', fontWeight: 700 }}>
              {displayedList.length} Records
            </span>
          </div>

          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Enquiry</th>
                  <th>Customer</th>
                  <th>Category</th>
                  <th>Part Code & Qty</th>
                  <th>Sales Verification</th>
                  <th>Supplier Cost</th>
                  <th>Availability</th>
                  <th>Lead Time</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>Purchase Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedList.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No verified enquiries pending cost estimation.
                    </td>
                  </tr>
                ) : (
                  displayedList.map(enq => (
                    <tr key={enq.id}>
                      <td>
                        <span className="data-code-pill">{enq.enquiry_no}</span>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.88rem' }}>{enq.customer_name}</strong>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{enq.notes || 'No customer notes'}</span>
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
                        <span className="status-badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                          <ShieldCheck size={11} style={{ marginRight: 3 }} /> {enq.client_seriousness || 'Verified'}
                        </span>
                        {enq.verification_notes && (
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={enq.verification_notes}>
                            {enq.verification_notes}
                          </div>
                        )}
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
                            <IndianRupee size={14} /> {enq.supplier_cost ? 'Update Cost' : 'Calculate & Send'}
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

        {/* Pricing Side Panel (Cost Estimation Drawer) */}
        {selectedEnquiry && (
          <div className="dash-card animate-fade" style={{ border: '1px solid #cbdce8', boxShadow: 'var(--shadow-md)', alignSelf: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, padding: 0, border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem' }}>
                <DollarSign size={18} color="#18476c" /> Cost Estimation & Parts Check
              </h3>
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '0.84rem' }}>
              <div>Enquiry: <strong style={{ color: '#18476c' }}>{selectedEnquiry.enquiry_no}</strong></div>
              <div>Customer: <strong>{selectedEnquiry.customer_name}</strong></div>
              <div>Category: <span className="status-badge badge-blue" style={{ fontSize: '0.7rem' }}>{selectedEnquiry.category}</span></div>
              <div>Part Code: <strong>{selectedEnquiry.part_code}</strong> (Qty: {selectedEnquiry.quantity})</div>
              {selectedEnquiry.verification_notes && (
                <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1', color: '#047857' }}>
                  ✓ Sales Verified: {selectedEnquiry.verification_notes}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitPricing} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Supplier Cost per Unit (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={supplierCost}
                  onChange={e => setSupplierCost(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Parts Availability *
                  </label>
                  <select
                    value={availability}
                    onChange={e => setAvailability(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="Available">Available (In Stock)</option>
                    <option value="Procurement Required">Procurement Required</option>
                    <option value="Backorder 1-2 Weeks">Backorder 1-2 Weeks</option>
                    <option value="Custom Fabrication">Custom Fabrication</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Lead Time (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={leadTime}
                    onChange={e => setLeadTime(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Cost Calculation Notes & Vendor Terms
                </label>
                <textarea
                  rows="3"
                  placeholder="Vendor name, warranty terms, bulk discount, payment condition..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" className="dash-btn" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Send size={15} /> Send Estimated Cost to Sales
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
