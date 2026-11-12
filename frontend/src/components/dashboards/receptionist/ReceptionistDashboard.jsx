import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { receptionistConfig } from '../../layout/dashboardConfigs';
import { PlusCircle, FileText, CheckCircle2, RefreshCw, Layers, Calendar, User, Phone, Mail, Box } from 'lucide-react';
import { useLiveSync } from '../../../utils/useLiveSync';

export default function ReceptionistDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Form state
  const [customer, setCustomer] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('Mechanical');
  const [partCode, setPartCode] = useState('');
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');

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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customer,
          contact_email: email,
          contact_phone: phone,
          category,
          part_code: partCode,
          quantity: qty,
          notes
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Enquiry ${data.enquiry_no} created successfully & saved to Database!`);
        setCustomer('');
        setEmail('');
        setPhone('');
        setPartCode('');
        setQty(1);
        setNotes('');
        fetchEnquiries();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout
      config={receptionistConfig}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      <div className="dash-view-header">
        <div>
          <h2>Enquiry Desk Operations</h2>
          <p>Capture incoming customer requirements and route by product category.</p>
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

      {/* TAB 1: ALL ENQUIRIES */}
      {(activeTab === 'dashboard' || activeTab === 'all-enquiries') && (
        <div className="dash-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={19} color="#2563eb" /> Real Database Enquiries Register
          </h3>
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Enquiry Ref</th>
                  <th>Customer Name</th>
                  <th>Category</th>
                  <th>Part Code</th>
                  <th>Qty</th>
                  <th>Current Status</th>
                  <th>Date Logged</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No enquiries recorded yet.
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
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{enq.contact_email || enq.contact_phone || 'Direct Walk-in'}</span>
                      </td>
                      <td>
                        <span className="status-badge badge-blue">
                          {enq.category}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{enq.part_code}</span>
                      </td>
                      <td>
                        <span className="status-badge badge-slate" style={{ fontWeight: 700 }}>{enq.quantity} pcs</span>
                      </td>
                      <td>
                        <span className={`status-badge ${enq.status.includes('Dispatched') ? 'badge-emerald' : enq.status.includes('Confirmed') ? 'badge-blue' : 'badge-amber'}`}>
                          {enq.status}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.82rem' }}>
                        {new Date(enq.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LOG NEW ENQUIRY */}
      {activeTab === 'new-enquiry' && (
        <div className="dash-card" style={{ maxWidth: '780px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={19} color="#2563eb" /> Register Customer Requirement
          </h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>Customer / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reliance Industries Ltd"
                  value={customer}
                  onChange={e => setCustomer(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>Product Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="Mechanical">Mechanical Products</option>
                  <option value="Electrical">Electrical Products</option>
                  <option value="Computer / IT">Computer / IT Products</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>Contact Email</label>
                <input
                  type="email"
                  placeholder="procurement@reliance.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>Part Code / SKU *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MCH-VALVE-DN50"
                  value={partCode}
                  onChange={e => setPartCode(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>Requirement Notes / Specs</label>
              <textarea
                rows="3"
                placeholder="Special technical parameters, delivery location, or timeline..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <button type="submit" className="dash-btn" style={{ padding: '12px 20px', fontSize: '0.95rem', marginTop: '6px' }}>
              <PlusCircle size={17} /> Save Enquiry to Database & Route to Procurement
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: CATEGORIES */}
      {activeTab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
          <div className="dash-card" style={{ borderLeft: '4px solid #2563eb' }}>
            <h4 style={{ color: '#2563eb', marginBottom: '8px', fontSize: '1.05rem', fontWeight: 700 }}>Mechanical Division</h4>
            <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5 }}>Valves, actuators, industrial pumps, gearboxes, bearings, flanges and mechanical hardware.</p>
          </div>
          <div className="dash-card" style={{ borderLeft: '4px solid #d97706' }}>
            <h4 style={{ color: '#d97706', marginBottom: '8px', fontSize: '1.05rem', fontWeight: 700 }}>Electrical Division</h4>
            <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5 }}>Transformers, circuit breakers, contactors, relays, power distribution panels, cables and sensors.</p>
          </div>
          <div className="dash-card" style={{ borderLeft: '4px solid #059669' }}>
            <h4 style={{ color: '#059669', marginBottom: '8px', fontSize: '1.05rem', fontWeight: 700 }}>Computer / IT Division</h4>
            <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5 }}>Rack servers, network switches, enterprise storage, UPS systems, routers and workstation parts.</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
