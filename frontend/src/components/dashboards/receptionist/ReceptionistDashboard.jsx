import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { receptionistConfig } from '../../layout/dashboardConfigs';
import { PlusCircle, FileText, CheckCircle2, RefreshCw, Layers } from 'lucide-react';
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
      <div className="dash-view-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Enquiry Desk Operations</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>Capture incoming customer requirements and route by product category.</p>
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

      {/* TAB 1: ALL ENQUIRIES */}
      {(activeTab === 'dashboard' || activeTab === 'all-enquiries') && (
        <div className="dash-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#38bdf8" /> Real Database Enquiries Register
          </h3>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Enquiry Ref</th>
                <th>Customer Name</th>
                <th>Category</th>
                <th>Part Code</th>
                <th>Qty</th>
                <th>Current Status</th>
                <th>Date Logged</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map(enq => (
                <tr key={enq.id}>
                  <td><strong style={{ color: '#38bdf8' }}>{enq.enquiry_no}</strong></td>
                  <td>{enq.customer_name}</td>
                  <td>
                    <span className="status-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                      {enq.category}
                    </span>
                  </td>
                  <td>{enq.part_code}</td>
                  <td>{enq.quantity}</td>
                  <td>
                    <span className="status-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                      {enq.status}
                    </span>
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{new Date(enq.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: LOG NEW ENQUIRY */}
      {activeTab === 'new-enquiry' && (
        <div className="dash-card" style={{ maxWidth: '720px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={18} color="#38bdf8" /> Register Customer Requirement
          </h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Customer / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reliance Industries Ltd"
                  value={customer}
                  onChange={e => setCustomer(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', borderRadius: '8px', marginTop: '6px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Product Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', borderRadius: '8px', marginTop: '6px' }}
                >
                  <option value="Mechanical">Mechanical Products</option>
                  <option value="Electrical">Electrical Products</option>
                  <option value="Computer / IT">Computer / IT Products</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Contact Email</label>
                <input
                  type="email"
                  placeholder="procurement@reliance.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', borderRadius: '8px', marginTop: '6px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', borderRadius: '8px', marginTop: '6px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Part Code / SKU *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MCH-VALVE-DN50"
                  value={partCode}
                  onChange={e => setPartCode(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', borderRadius: '8px', marginTop: '6px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', borderRadius: '8px', marginTop: '6px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Requirement Notes / Specs</label>
              <textarea
                rows="3"
                placeholder="Special technical parameters, delivery location, or timeline..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', borderRadius: '8px', marginTop: '6px', resize: 'vertical' }}
              />
            </div>

            <button type="submit" className="dash-btn" style={{ padding: '12px 20px', fontSize: '0.95rem' }}>
              Save Enquiry to Database & Notify Purchase Team
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: CATEGORIES */}
      {activeTab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div className="dash-card">
            <h4 style={{ color: '#38bdf8', marginBottom: '8px' }}>Mechanical Division</h4>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Valves, actuators, industrial pumps, gearboxes, bearings, flanges and mechanical hardware.</p>
          </div>
          <div className="dash-card">
            <h4 style={{ color: '#fbbf24', marginBottom: '8px' }}>Electrical Division</h4>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Transformers, circuit breakers, contactors, relays, power distribution panels, cables and sensors.</p>
          </div>
          <div className="dash-card">
            <h4 style={{ color: '#34d399', marginBottom: '8px' }}>Computer / IT Division</h4>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Rack servers, network switches, enterprise storage, UPS systems, routers and workstation parts.</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
