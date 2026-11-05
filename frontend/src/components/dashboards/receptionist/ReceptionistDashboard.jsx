import React, { useState } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { PlusCircle, FileText, CheckCircle } from 'lucide-react';

export default function ReceptionistDashboard() {
  const [enquiries, setEnquiries] = useState([
    {
      id: 'ENQ-901',
      customer: 'Titan Industries',
      category: 'Mechanical',
      partCode: 'MCH-P-442',
      qty: 25,
      status: 'Awaiting Purchase Pricing'
    },
    {
      id: 'ENQ-902',
      customer: 'Siemens Energy Ltd',
      category: 'Electrical',
      partCode: 'ELE-RELAY-12V',
      qty: 100,
      status: 'Pricing Received'
    }
  ]);

  const [customer, setCustomer] = useState('');
  const [category, setCategory] = useState('Mechanical');
  const [partCode, setPartCode] = useState('');
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    const newEnq = {
      id: `ENQ-${Math.floor(1000 + Math.random() * 9000)}`,
      customer,
      category,
      partCode,
      qty: Number(qty),
      status: 'Awaiting Purchase Pricing'
    };
    setEnquiries([newEnq, ...enquiries]);
    setCustomer('');
    setPartCode('');
    setQty(1);
    setMsg('Enquiry registered and categorized successfully! Routed to Purchase & Sales.');
    setTimeout(() => setMsg(''), 4000);
  };

  return (
    <DashboardLayout title="Receptionist Enquiry Portal" roleBadge="RECEPTIONIST">
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '1.5rem' }}>
        {/* Form Card */}
        <div className="dash-card">
          <h3><PlusCircle size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Record New Enquiry</h3>
          {msg && <div style={{ color: '#34d399', fontSize: '0.85rem', marginBottom: '1rem' }}><CheckCircle size={14} /> {msg}</div>}
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Customer Name</label>
              <input
                style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-card)', border: '1px solid var(--surface-border)', color: 'white', borderRadius: '6px', marginTop: '4px' }}
                value={customer}
                onChange={e => setCustomer(e.target.value)}
                placeholder="e.g. Bharat Forge Ltd"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Product Category</label>
              <select
                style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-card)', border: '1px solid var(--surface-border)', color: 'white', borderRadius: '6px', marginTop: '4px' }}
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="Mechanical">Mechanical</option>
                <option value="Electrical">Electrical</option>
                <option value="Computer / IT">Computer / IT</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Part Code / SKU</label>
              <input
                style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-card)', border: '1px solid var(--surface-border)', color: 'white', borderRadius: '6px', marginTop: '4px' }}
                value={partCode}
                onChange={e => setPartCode(e.target.value)}
                placeholder="e.g. MCH-VALVE-50"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Required Quantity</label>
              <input
                type="number"
                min="1"
                style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-card)', border: '1px solid var(--surface-border)', color: 'white', borderRadius: '6px', marginTop: '4px' }}
                value={qty}
                onChange={e => setQty(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="dash-btn" style={{ marginTop: '0.5rem', padding: '0.75rem' }}>
              Log & Categorize Enquiry
            </button>
          </form>
        </div>

        {/* List Card */}
        <div className="dash-card">
          <h3><FileText size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Registered Enquiries</h3>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Enquiry ID</th>
                <th>Customer</th>
                <th>Category</th>
                <th>Part Code</th>
                <th>Qty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map(enq => (
                <tr key={enq.id}>
                  <td><strong>{enq.id}</strong></td>
                  <td>{enq.customer}</td>
                  <td><span className="status-badge badge-info">{enq.category}</span></td>
                  <td>{enq.partCode}</td>
                  <td>{enq.qty}</td>
                  <td><span className="status-badge badge-warning">{enq.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
