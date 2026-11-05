import React, { useState } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { DollarSign, CheckCircle } from 'lucide-react';

export default function PurchaseDashboard() {
  const [items, setItems] = useState([
    {
      id: 'ENQ-901',
      customer: 'Titan Industries',
      partCode: 'MCH-P-442',
      qty: 25,
      supplierCost: null,
      availability: 'Pending',
      leadTime: null
    }
  ]);

  const [selectedEnq, setSelectedEnq] = useState(null);
  const [cost, setCost] = useState('');
  const [avail, setAvail] = useState('Available');
  const [leadTime, setLeadTime] = useState('3');

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!selectedEnq) return;
    setItems(items.map(it => it.id === selectedEnq.id ? {
      ...it,
      supplierCost: cost,
      availability: avail,
      leadTime: `${leadTime} days`
    } : it));
    setSelectedEnq(null);
    setCost('');
  };

  return (
    <DashboardLayout title="Purchase Pricing & Availability" roleBadge="PURCHASE">
      <div style={{ display: 'grid', gridTemplateColumns: selectedEnq ? '1fr 380px' : '1fr', gap: '1.5rem' }}>
        <div className="dash-card">
          <h3>Pending Pricing Requests from Sales / Reception</h3>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Enquiry</th>
                <th>Part Code</th>
                <th>Qty</th>
                <th>Supplier Cost</th>
                <th>Availability</th>
                <th>Lead Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id}>
                  <td><strong>{it.id}</strong> ({it.customer})</td>
                  <td>{it.partCode}</td>
                  <td>{it.qty}</td>
                  <td>{it.supplierCost ? `$${it.supplierCost}` : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td><span className={`status-badge ${it.supplierCost ? 'badge-success' : 'badge-warning'}`}>{it.availability}</span></td>
                  <td>{it.leadTime || '—'}</td>
                  <td>
                    <button className="dash-btn" onClick={() => { setSelectedEnq(it); setCost(it.supplierCost || '150'); }}>
                      {it.supplierCost ? 'Edit Price' : 'Provide Cost'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedEnq && (
          <div className="dash-card animate-fade">
            <h3>Enter Vendor Pricing: {selectedEnq.id}</h3>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Supplier Cost Per Unit ($)</label>
                <input
                  type="number"
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-card)', border: '1px solid var(--surface-border)', color: 'white', borderRadius: '6px', marginTop: '4px' }}
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Availability Status</label>
                <select
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-card)', border: '1px solid var(--surface-border)', color: 'white', borderRadius: '6px', marginTop: '4px' }}
                  value={avail}
                  onChange={e => setAvail(e.target.value)}
                >
                  <option value="Available">Available (In Stock)</option>
                  <option value="Sourcing Required">Sourcing Required</option>
                  <option value="Backorder">Backorder</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimated Lead Time (Days)</label>
                <input
                  type="number"
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-card)', border: '1px solid var(--surface-border)', color: 'white', borderRadius: '6px', marginTop: '4px' }}
                  value={leadTime}
                  onChange={e => setLeadTime(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="dash-btn" style={{ flex: 1 }}>Submit to Sales</button>
                <button type="button" className="dash-btn" style={{ background: 'var(--surface-border)' }} onClick={() => setSelectedEnq(null)}>Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
