import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { storeConfig } from '../../layout/dashboardConfigs';
import { 
  Package, CheckCircle2, Clock, RefreshCw, Boxes, Check, 
  ArrowRight, Eye, Download, ShieldCheck, BellRing, PackageCheck, AlertCircle 
} from 'lucide-react';
import { useLiveSync } from '../../../utils/useLiveSync';
import DocumentModal from '../../common/DocumentModal';
import { buildSalesOrderPdf, downloadDocumentPdf } from '../../../utils/documentGenerator';

export default function StoreDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [enquiries, setEnquiries] = useState([]);
  const [msg, setMsg] = useState('');
  const [previewModal, setPreviewModal] = useState({ isOpen: false, type: 'order', data: null });
  const [packingNotes, setPackingNotes] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/enquiries');
      const data = await res.json();
      if (data.success) {
        // Filter orders that have been approved and forwarded to Store (have order_no or approved status)
        setEnquiries(data.data.filter(e => e.order_no || e.status?.includes('Store')));
      }
    } catch (err) {
      console.error('Error fetching store orders:', err);
    }
  };

  useLiveSync(fetchOrders, 3000);

  const handlePackOrder = async (enquiryId, orderNo) => {
    try {
      const res = await fetch('http://localhost:5000/api/store/pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          enquiry_id: enquiryId,
          stock_notes: 'All products and components checked against PO specifications, packed securely, and staged in outbound bay.',
          performed_by: 'Store Warehouse Team'
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Order ${orderNo} marked as Packed! Stock readiness status updated & Salesperson notified for inspection.`);
        fetchOrders();
        setTimeout(() => setMsg(''), 5000);
      }
    } catch (err) {
      console.error('Error packing order:', err);
    }
  };

  // Filter based on active tab
  const displayedOrders = enquiries.filter(e => {
    if (activeTab === 'packing') {
      return !e.store_status?.includes('Packed');
    }
    if (activeTab === 'ready-inspection') {
      return e.store_status?.includes('Packed');
    }
    return true; // 'dashboard': all
  });

  return (
    <DashboardLayout
      config={storeConfig}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      <div className="dash-view-header">
        <div>
          <h2>Store & Warehouse Fulfillment</h2>
          <p>Receive approved enquiries, check parts availability, pack available stock, and notify Sales for readiness inspection.</p>
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

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="dash-card" style={{ padding: '16px', borderTop: '3px solid #7c3aed', margin: 0 }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Approved Enquiries Received</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
            {enquiries.length}
          </div>
          <span style={{ fontSize: '0.74rem', color: '#7c3aed' }}>From Sales Department</span>
        </div>
        <div className="dash-card" style={{ padding: '16px', borderTop: '3px solid #f59e0b', margin: 0 }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Awaiting Pick & Pack</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#b45309', margin: '4px 0' }}>
            {enquiries.filter(e => !e.store_status?.includes('Packed')).length}
          </div>
          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Pending warehouse action</span>
        </div>
        <div className="dash-card" style={{ padding: '16px', borderTop: '3px solid #10b981', margin: 0 }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Packed & Sales Notified</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', margin: '4px 0' }}>
            {enquiries.filter(e => e.store_status?.includes('Packed')).length}
          </div>
          <span style={{ fontSize: '0.74rem', color: '#059669' }}>Ready for Sales inspection</span>
        </div>
      </div>

      <div className="dash-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Package size={19} color="#18476c" /> Approved Store Orders & Packing Queue
          </h3>
          <span className="status-badge badge-slate" style={{ fontSize: '0.76rem', fontWeight: 700 }}>
            {displayedOrders.length} Orders
          </span>
        </div>

        <div className="dash-table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th style={{ width: '140px' }}>Sales Order No</th>
                <th>Customer</th>
                <th>Item Code</th>
                <th>Qty to Pack</th>
                <th>Category</th>
                <th>Stock Readiness</th>
                <th>Inspection Notification</th>
                <th style={{ textAlign: 'right', paddingRight: '20px' }}>Store Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No approved orders in this queue.
                  </td>
                </tr>
              ) : (
                displayedOrders.map(enq => (
                  <tr key={enq.id}>
                    <td>
                      <span className="data-code-pill" style={{ color: '#18476c', fontWeight: 700 }}>
                        {enq.order_no}
                      </span>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => setPreviewModal({ isOpen: true, type: 'order', data: enq })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '2px 6px',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: '#b45309'
                          }}
                          title="View Sales Order Pick-List"
                        >
                          <Eye size={10} color="#d97706" /> View SO
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadDocumentPdf(buildSalesOrderPdf(enq), `SalesOrder-${enq.order_no}.pdf`)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 5px',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            color: '#b45309'
                          }}
                          title="Download Sales Order PDF"
                        >
                          <Download size={10} />
                        </button>
                      </div>
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
                        {enq.stock_readiness || enq.store_status || 'Pending Packing'}
                      </span>
                    </td>
                    <td>
                      {enq.store_status?.includes('Packed') ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: '#059669', fontWeight: 600 }}>
                          <BellRing size={12} /> Salesperson Notified
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Awaiting Pack</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                      {!enq.store_status?.includes('Packed') ? (
                        <button
                          className="dash-btn"
                          onClick={() => handlePackOrder(enq.id, enq.order_no)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Boxes size={14} /> Pack & Notify Sales
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

      {/* Dynamic Document Preview Modal */}
      <DocumentModal
        isOpen={previewModal.isOpen}
        type={previewModal.type}
        data={previewModal.data}
        onClose={() => setPreviewModal({ isOpen: false, type: 'order', data: null })}
      />
    </DashboardLayout>
  );
}
