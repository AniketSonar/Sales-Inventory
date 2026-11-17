import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { storeConfig } from '../../layout/dashboardConfigs';
import { 
  Package, CheckCircle2, Clock, RefreshCw, Boxes, Check, 
  ArrowRight, Eye, Download, ShieldCheck, BellRing, PackageCheck, AlertCircle, FileText, CheckCheck, X
} from 'lucide-react';
import { useLiveSync } from '../../../utils/useLiveSync';
import DocumentModal from '../../common/DocumentModal';
import { buildSalesOrderPdf, buildOpcPdf, downloadDocumentPdf } from '../../../utils/documentGenerator';

export default function StoreDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [enquiries, setEnquiries] = useState([]);
  const [msg, setMsg] = useState('');
  const [previewModal, setPreviewModal] = useState({ isOpen: false, type: 'opc', data: null });
  const [notesModal, setNotesModal] = useState({ isOpen: false, type: null, enquiry: null, notes: '' });

  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/enquiries');
      const data = await res.json();
      if (data.success) {
        // Filter orders that have been approved and forwarded to Store
        setEnquiries(data.data.filter(e => 
          (e.opc_status && e.opc_status !== 'Draft' && e.opc_status !== 'Pending Approval') || 
          e.order_no || 
          e.status?.includes('Store')
        ));
      }
    } catch (err) {
      console.error('Error fetching store orders:', err);
    }
  };

  useLiveSync(fetchOrders, 3000);

  // Store action: Verify Stock
  const handleVerifyStock = async (e) => {
    e.preventDefault();
    if (!notesModal.enquiry) return;
    try {
      const opcId = notesModal.enquiry.opc_id;
      const res = await fetch(`http://localhost:5000/api/opc/${opcId}/store-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_verification_notes: notesModal.notes || 'Warehouse verified item stock availability and specifications matched against OPC.',
          performed_by: 'Store Keeper'
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Stock verified for OPC #${notesModal.enquiry.opc_no}! Item marked ready for packing.`);
        setNotesModal({ isOpen: false, type: null, enquiry: null, notes: '' });
        fetchOrders();
        setTimeout(() => setMsg(''), 5000);
      }
    } catch (err) {
      console.error('Error verifying stock:', err);
    }
  };

  // Store action: Complete Packing
  const handleCompletePacking = async (e) => {
    e.preventDefault();
    if (!notesModal.enquiry) return;
    try {
      const opcId = notesModal.enquiry.opc_id;
      if (opcId) {
        const res = await fetch(`http://localhost:5000/api/opc/${opcId}/store-pack`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packing_notes: notesModal.notes || 'All items packed into heavy-duty containers, barcoded, and placed in staging bay for Sales inspection.',
            performed_by: 'Store Warehouse Team'
          })
        });
        const data = await res.json();
        if (data.success) {
          setMsg(`Packing completed for OPC #${notesModal.enquiry.opc_no}! Salesperson notified for inspection.`);
          setNotesModal({ isOpen: false, type: null, enquiry: null, notes: '' });
          fetchOrders();
          setTimeout(() => setMsg(''), 5000);
        }
      } else {
        // Fallback for orders without OPC ID
        await handleLegacyPackOrder(notesModal.enquiry.id, notesModal.enquiry.order_no);
        setNotesModal({ isOpen: false, type: null, enquiry: null, notes: '' });
      }
    } catch (err) {
      console.error('Error completing packing:', err);
    }
  };

  const handleLegacyPackOrder = async (enquiryId, orderNo) => {
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
    const isPacked = e.opc_status === 'Packing Completed' || e.store_status?.includes('Packed');
    if (activeTab === 'packing') {
      return !isPacked;
    }
    if (activeTab === 'ready-inspection') {
      return isPacked;
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
          <h2>Store &amp; Warehouse Fulfillment</h2>
          <p>Receive approved Order Processing Confirmations (OPC), verify warehouse stock, pack items securely, and notify Sales for readiness inspection.</p>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="dash-card" style={{ padding: '16px', borderTop: '3px solid #0d9488', margin: 0 }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Approved OPCs Received</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
            {enquiries.length}
          </div>
          <span style={{ fontSize: '0.74rem', color: '#0d9488' }}>Forwarded from Sales</span>
        </div>

        <div className="dash-card" style={{ padding: '16px', borderTop: '3px solid #3b82f6', margin: 0 }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Awaiting Stock Verification</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1d4ed8', margin: '4px 0' }}>
            {enquiries.filter(e => e.opc_status === 'Sent to Store' || (!e.opc_status && !e.store_status?.includes('Packed'))).length}
          </div>
          <span style={{ fontSize: '0.74rem', color: '#3b82f6' }}>Pending stock check</span>
        </div>

        <div className="dash-card" style={{ padding: '16px', borderTop: '3px solid #f59e0b', margin: 0 }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Stock Verified / In Packing</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#b45309', margin: '4px 0' }}>
            {enquiries.filter(e => e.opc_status === 'Stock Verified').length}
          </div>
          <span style={{ fontSize: '0.74rem', color: '#b45309' }}>Warehouse packing in progress</span>
        </div>

        <div className="dash-card" style={{ padding: '16px', borderTop: '3px solid #10b981', margin: 0 }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Packing Completed</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', margin: '4px 0' }}>
            {enquiries.filter(e => e.opc_status === 'Packing Completed' || e.store_status?.includes('Packed')).length}
          </div>
          <span style={{ fontSize: '0.74rem', color: '#059669' }}>Ready for Sales inspection</span>
        </div>
      </div>

      <div className="dash-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Package size={19} color="#0d9488" /> Approved Store Orders &amp; OPC Fulfillment Queue
          </h3>
          <span className="status-badge badge-slate" style={{ fontSize: '0.76rem', fontWeight: 700 }}>
            {displayedOrders.length} Orders
          </span>
        </div>

        <div className="dash-table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th style={{ width: '160px' }}>OPC &amp; Sales Order</th>
                <th>Customer &amp; PO</th>
                <th>Item Code &amp; Specs</th>
                <th>Qty</th>
                <th>Category</th>
                <th>OPC Status</th>
                <th>Warehouse Readiness</th>
                <th style={{ textAlign: 'right', paddingRight: '20px' }}>Store Department Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No approved orders or OPCs in this queue.
                  </td>
                </tr>
              ) : (
                displayedOrders.map(enq => {
                  const isStockVerified = enq.opc_status === 'Stock Verified' || enq.opc_status === 'Packing Completed';
                  const isPackingDone = enq.opc_status === 'Packing Completed' || enq.store_status?.includes('Packed');

                  return (
                    <tr key={enq.id}>
                      <td>
                        {enq.opc_no ? (
                          <div style={{ marginBottom: '4px' }}>
                            <span className="data-code-pill" style={{ color: '#0d9488', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <FileText size={11} /> {enq.opc_no}
                            </span>
                            <div style={{ display: 'flex', gap: '3px', marginTop: '3px' }}>
                              <button
                                type="button"
                                onClick={() => setPreviewModal({ isOpen: true, type: 'opc', data: enq })}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  padding: '2px 5px',
                                  background: '#f0fdfa',
                                  border: '1px solid #99f6e4',
                                  borderRadius: '3px',
                                  fontSize: '0.68rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  color: '#0f766e'
                                }}
                                title="View OPC Document Preview"
                              >
                                <Eye size={10} color="#0d9488" /> View OPC
                              </button>
                              <button
                                type="button"
                                onClick={() => downloadDocumentPdf(buildOpcPdf(enq), `OPC-${enq.opc_no}.pdf`)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '2px 5px',
                                  background: '#f8fafc',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '3px',
                                  fontSize: '0.68rem',
                                  cursor: 'pointer',
                                  color: '#334155'
                                }}
                                title="Download OPC PDF"
                              >
                                <Download size={10} />
                              </button>
                            </div>
                          </div>
                        ) : null}

                        {enq.order_no && (
                          <div style={{ marginTop: '2px' }}>
                            <span style={{ color: '#18476c', fontWeight: 600, fontSize: '0.78rem' }}>{enq.order_no}</span>
                            <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
                              <button
                                type="button"
                                onClick={() => setPreviewModal({ isOpen: true, type: 'order', data: enq })}
                                style={{
                                  padding: '1px 4px',
                                  background: '#fffbeb',
                                  border: '1px solid #fde68a',
                                  borderRadius: '3px',
                                  fontSize: '0.65rem',
                                  color: '#b45309',
                                  cursor: 'pointer'
                                }}
                                title="View Sales Order"
                              >
                                SO
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.88rem' }}>
                          {enq.opc_company_name || enq.customer_name}
                        </strong>
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          PO / Ref: {enq.opc_order_reference || enq.po_number || 'Direct Ref'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>
                          {enq.opc_product_name || enq.part_code}
                        </span>
                        {enq.opc_description && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {enq.opc_description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="status-badge badge-slate" style={{ fontWeight: 700 }}>
                          {enq.opc_quantity || enq.quantity} pcs
                        </span>
                      </td>
                      <td>
                        <span className="status-badge badge-blue">
                          {enq.opc_category || enq.category}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${
                          enq.opc_status === 'Packing Completed' ? 'badge-emerald' :
                          enq.opc_status === 'Stock Verified' ? 'badge-blue' :
                          'badge-amber'
                        }`} style={{ fontWeight: 600 }}>
                          {enq.opc_status || 'Sent to Store'}
                        </span>
                      </td>
                      <td>
                        {isPackingDone ? (
                          <div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: '#059669', fontWeight: 700 }}>
                              <CheckCircle2 size={13} /> Packed &amp; Staged
                            </span>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Sales Notified</div>
                          </div>
                        ) : isStockVerified ? (
                          <div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: '#0284c7', fontWeight: 600 }}>
                              <ShieldCheck size={13} /> Stock Verified
                            </span>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Packing In Progress</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 600 }}>
                            Awaiting Stock Check
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                        {!isStockVerified ? (
                          <button
                            className="dash-btn"
                            style={{ background: '#0d9488', borderColor: '#0d9488', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => setNotesModal({
                              isOpen: true,
                              type: 'VERIFY_STOCK',
                              enquiry: enq,
                              notes: 'Physical warehouse stock verified. Component specifications and quantities confirmed against OPC.'
                            })}
                          >
                            <ShieldCheck size={14} /> Verify Stock
                          </button>
                        ) : !isPackingDone ? (
                          <button
                            className="dash-btn"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => setNotesModal({
                              isOpen: true,
                              type: 'COMPLETE_PACK',
                              enquiry: enq,
                              notes: 'All items packed securely in heavy duty boxes, barcoded, and staged for Sales inspection.'
                            })}
                          >
                            <Boxes size={14} /> Complete Packing
                          </button>
                        ) : (
                          <span style={{ color: '#059669', fontSize: '0.84rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCheck size={16} /> Packing Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Store Verification & Packing Notes Modal */}
      {notesModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            width: '100%',
            maxWidth: '520px',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid #cbd5e1'
          }}>
            <div style={{ padding: '16px 20px', background: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.96rem' }}>
                {notesModal.type === 'VERIFY_STOCK' ? (
                  <>
                    <ShieldCheck size={18} color="#2dd4bf" />
                    <span>Store Stock Verification: {notesModal.enquiry?.opc_no || 'OPC'}</span>
                  </>
                ) : (
                  <>
                    <Boxes size={18} color="#2dd4bf" />
                    <span>Complete Order Packing: {notesModal.enquiry?.opc_no || 'OPC'}</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setNotesModal({ isOpen: false, type: null, enquiry: null, notes: '' })}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={notesModal.type === 'VERIFY_STOCK' ? handleVerifyStock : handleCompletePacking} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '14px', background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                <div><strong>Client:</strong> {notesModal.enquiry?.opc_company_name || notesModal.enquiry?.customer_name}</div>
                <div><strong>Item / Code:</strong> {notesModal.enquiry?.opc_product_name || notesModal.enquiry?.part_code} ({notesModal.enquiry?.opc_quantity || notesModal.enquiry?.quantity} units)</div>
                <div><strong>Category:</strong> {notesModal.enquiry?.opc_category || notesModal.enquiry?.category}</div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  {notesModal.type === 'VERIFY_STOCK' ? 'Warehouse Stock Verification Remarks *' : 'Warehouse Packing & Staging Notes *'}
                </label>
                <textarea
                  className="dash-input"
                  rows="3"
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.84rem' }}
                  value={notesModal.notes}
                  onChange={(e) => setNotesModal(prev => ({ ...prev, notes: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="dash-btn dash-btn-secondary"
                  onClick={() => setNotesModal({ isOpen: false, type: null, enquiry: null, notes: '' })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dash-btn"
                  style={{
                    background: notesModal.type === 'VERIFY_STOCK' ? '#0d9488' : '#2563eb',
                    borderColor: notesModal.type === 'VERIFY_STOCK' ? '#0d9488' : '#2563eb',
                    color: '#ffffff'
                  }}
                >
                  {notesModal.type === 'VERIFY_STOCK' ? 'Confirm Stock Verified' : 'Confirm Packing Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Document Preview Modal */}
      <DocumentModal
        isOpen={previewModal.isOpen}
        type={previewModal.type}
        data={previewModal.data}
        onClose={() => setPreviewModal({ isOpen: false, type: 'opc', data: null })}
      />
    </DashboardLayout>
  );
}
