import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { storeConfig } from '../../layout/dashboardConfigs';
import { Package, CheckCircle2, Clock, RefreshCw, Boxes } from 'lucide-react';
import { useLiveSync } from '../../../utils/useLiveSync';

export default function StoreDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [enquiries, setEnquiries] = useState([]);
  const [msg, setMsg] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/enquiries');
      const data = await res.json();
      if (data.success) {
        // filter orders that have sales_orders
        setEnquiries(data.data.filter(e => e.order_no));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useLiveSync(fetchOrders, 3000);

  const handlePackOrder = async (enquiryId, orderNo) => {
    try {
      const res = await fetch('http://localhost:5000/api/store/pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enquiry_id: enquiryId })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Order ${orderNo} marked as Picked, Packed & Reserved in Database!`);
        fetchOrders();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout
      config={storeConfig}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      <div className="dash-view-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Warehouse & Store Fulfillment</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>Pick, pack and reserve stock for verified Sales Orders awaiting dispatch.</p>
        </div>
        <button
          onClick={fetchOrders}
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

      <div className="dash-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={18} color="#38bdf8" /> Store Orders Queue
        </h3>
        <table className="dash-table">
          <thead>
            <tr>
              <th>Sales Order No</th>
              <th>Customer</th>
              <th>Item Code</th>
              <th>Qty to Pack</th>
              <th>Category</th>
              <th>Fulfillment Status</th>
              <th>Store Action</th>
            </tr>
          </thead>
          <tbody>
            {enquiries.map(enq => (
              <tr key={enq.id}>
                <td><strong style={{ color: '#818cf8' }}>{enq.order_no}</strong></td>
                <td>{enq.customer_name}</td>
                <td>{enq.part_code}</td>
                <td><strong>{enq.quantity} pcs</strong></td>
                <td>
                  <span className="status-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                    {enq.category}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${enq.store_status?.includes('Packed') ? 'badge-success' : 'badge-warning'}`}>
                    {enq.store_status || 'Pending Packing'}
                  </span>
                </td>
                <td>
                  {!enq.store_status?.includes('Packed') ? (
                    <button
                      className="dash-btn"
                      onClick={() => handlePackOrder(enq.id, enq.order_no)}
                      style={{ background: '#2563eb' }}
                    >
                      Pick & Pack
                    </button>
                  ) : (
                    <span style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
                      ✓ Packed & Ready
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
