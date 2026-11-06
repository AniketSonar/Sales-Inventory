import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { purchaseConfig } from '../../layout/dashboardConfigs';
import { DollarSign, CheckCircle2, Clock, RefreshCw, AlertCircle } from 'lucide-react';
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
      <div className="dash-view-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Procurement & Pricing Desk</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>Provide accurate supplier cost, availability, and lead time for customer inquiries.</p>
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

      <div style={{ display: 'grid', gridTemplateColumns: selectedEnquiry ? '1fr 420px' : '1fr', gap: '20px' }}>
        {/* Enquiries List */}
        <div className="dash-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={18} color="#38bdf8" /> Enquiries Awaiting / With Purchase Pricing
          </h3>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Enquiry</th>
                <th>Category</th>
                <th>Part Code & Qty</th>
                <th>Supplier Cost</th>
                <th>Availability</th>
                <th>Lead Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map(enq => (
                <tr key={enq.id}>
                  <td>
                    <strong>{enq.enquiry_no}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{enq.customer_name}</div>
                  </td>
                  <td>
                    <span className="status-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                      {enq.category}
                    </span>
                  </td>
                  <td>
                    {enq.part_code} <strong>(×{enq.quantity})</strong>
                  </td>
                  <td>
                    {enq.supplier_cost ? (
                      <span style={{ color: '#34d399', fontWeight: 700 }}>${enq.supplier_cost}</span>
                    ) : (
                      <span style={{ color: '#f87171' }}>Awaiting Cost</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${enq.supplier_cost ? 'badge-success' : 'badge-warning'}`}>
                      {enq.availability || 'Pending'}
                    </span>
                  </td>
                  <td>{enq.lead_time_days ? `${enq.lead_time_days} days` : '—'}</td>
                  <td>
                    <button
                      className="dash-btn"
                      onClick={() => handleOpenPricingModal(enq)}
                      style={{ background: enq.supplier_cost ? '#1e293b' : '#2563eb' }}
                    >
                      {enq.supplier_cost ? 'Update Cost' : 'Enter Pricing'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Side Panel */}
        {selectedEnquiry && (
          <div className="dash-card animate-fade">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} color="#38bdf8" /> Record Pricing: {selectedEnquiry.enquiry_no}
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '8px 0 16px' }}>
              For customer <strong>{selectedEnquiry.customer_name}</strong> — Item: <strong>{selectedEnquiry.part_code}</strong> (Qty: {selectedEnquiry.quantity})
            </p>

            <form onSubmit={handleSubmitPricing} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Supplier Cost Per Unit ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 350.00"
                  value={supplierCost}
                  onChange={e => setSupplierCost(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', borderRadius: '8px', marginTop: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Stock Availability Status *</label>
                <select
                  value={availability}
                  onChange={e => setAvailability(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', borderRadius: '8px', marginTop: '6px' }}
                >
                  <option value="Available">Available in Warehouse</option>
                  <option value="Supplier Ready">Supplier Stock Ready</option>
                  <option value="Sourcing Required">Sourcing / Manufacturing Required</option>
                  <option value="Backorder">Backorder</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Procurement Lead Time (Days) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={leadTime}
                  onChange={e => setLeadTime(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', borderRadius: '8px', marginTop: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Supplier Reference / Notes</label>
                <textarea
                  rows="2"
                  placeholder="Vendor name, batch validity..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', borderRadius: '8px', marginTop: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="submit" className="dash-btn" style={{ flex: 1 }}>
                  Save to Database
                </button>
                <button
                  type="button"
                  className="dash-btn"
                  style={{ background: '#1e293b' }}
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
