import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { storeConfig } from '../../layout/dashboardConfigs';
import { Package, CheckCircle2, Clock, RefreshCw, Boxes, Check, ArrowRight } from 'lucide-react';
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
      <div className="dash-view-header">
        <div>
          <h2>Warehouse & Store Fulfillment</h2>
          <p>Pick, pack and reserve stock for verified Sales Orders awaiting dispatch.</p>
        </div>
        <button
          onClick={fetchOrders}
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

      <div className="dash-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={19} color="#2563eb" /> Store Orders Queue
        </h3>
        <div className="dash-table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th style={{ width: '140px' }}>Sales Order No</th>
                <th>Customer</th>
                <th>Item Code</th>
                <th>Qty to Pack</th>
                <th>Category</th>
                <th>Fulfillment Status</th>
                <th style={{ textAlign: 'right', paddingRight: '20px' }}>Store Action</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No confirmed sales orders awaiting store packing.
                  </td>
                </tr>
              ) : (
                enquiries.map(enq => (
                  <tr key={enq.id}>
                    <td>
                      <span className="data-code-pill" style={{ color: '#4f46e5', fontWeight: 700 }}>
                        {enq.order_no}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.88rem' }}>{enq.customer_name}</strong>
                      <span style={{ fontSize: '0.74rem', color: '#64748b' }}>PO: {enq.po_number}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{enq.part_code}</span>
                    </td>
                    <td>
                      <span className="status-badge badge-slate" style={{ fontWeight: 700 }}>
                        {enq.quantity} pcs
                      </span>
                    </td>
                    <td>
                      <span className="status-badge badge-blue">
                        {enq.category}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${enq.store_status?.includes('Packed') ? 'badge-emerald' : 'badge-amber'}`}>
                        {enq.store_status || 'Pending Packing'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                      {!enq.store_status?.includes('Packed') ? (
                        <button
                          className="dash-btn"
                          onClick={() => handlePackOrder(enq.id, enq.order_no)}
                        >
                          <Boxes size={14} /> Pick & Pack
                        </button>
                      ) : (
                        <span style={{ color: '#059669', fontSize: '0.84rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={16} /> Packed & Ready
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
    </DashboardLayout>
  );
}
