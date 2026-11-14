import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { adminConfig } from '../../layout/dashboardConfigs';
import { BarChart3, Users, FileText, CheckCircle2, RefreshCw, Shield, Layers, TrendingUp, Clock, PackageCheck, DollarSign, Paperclip, Eye, Download } from 'lucide-react';
import { useLiveSync } from '../../../utils/useLiveSync';
import SalesGraphicalAnalysis from './SalesGraphicalAnalysis';
import DocumentModal from '../../common/DocumentModal';
import { buildQuotationPdf, buildInvoicePdf, buildSalesOrderPdf, downloadDocumentPdf } from '../../../utils/documentGenerator';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ enquiries: 0, quotations: 0, orders: 0, dispatches: 0 });
  const [enquiries, setEnquiries] = useState([]);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, type: 'quotation', data: null });

  const loadData = async () => {
    try {
      const [resStats, resEnq] = await Promise.all([
        fetch('http://localhost:5000/api/stats'),
        fetch('http://localhost:5000/api/enquiries')
      ]);
      const dataStats = await resStats.json();
      const dataEnq = await resEnq.json();

      if (dataStats.success) setStats(dataStats.stats);
      if (dataEnq.success) setEnquiries(dataEnq.data);
    } catch (err) {
      console.error(err);
    }
  };

  useLiveSync(loadData, 3000);

  const statCards = [
    { title: 'Total Enquiries Logged', value: stats.enquiries, color: '#18476c', bg: '#edf4f9', border: '#cbdce8', icon: FileText, label: 'Enquiry Desk Leadhub' },
    { title: 'Quotations Created', value: stats.quotations, color: '#475569', bg: '#f1f5f9', border: '#cbd5e1', icon: TrendingUp, label: 'Commercial Sales Desk' },
    { title: 'Confirmed Sales Orders', value: stats.orders, color: '#0f172a', bg: '#edf4f9', border: '#cbdce8', icon: PackageCheck, label: 'Warehouse Fulfilment' },
    { title: 'Completed Dispatches', value: stats.dispatches, color: '#18476c', bg: '#f8fafc', border: '#cbdce8', icon: CheckCircle2, label: 'Carrier Invoiced & Closed' }
  ];

  return (
    <DashboardLayout
      config={adminConfig}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      <div className="dash-view-header">
        <div>
          <h2>Executive Management Console</h2>
          <p>Real-time database analytics and cross-department pipeline visibility.</p>
        </div>
        <button
          onClick={loadData}
          className="dash-btn dash-btn-secondary"
        >
          <RefreshCw size={15} /> Refresh Analytics
        </button>
      </div>

      {/* Analytics KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '24px' }}>
        {statCards.map((card, idx) => {
          const IconComponent = card.icon;
          return (
            <div key={idx} className="dash-card" style={{ padding: '20px', margin: 0, borderTop: `4px solid ${card.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>{card.title}</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: card.bg, border: `1px solid ${card.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                  <IconComponent size={16} />
                </div>
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 4px', letterSpacing: '-0.02em' }}>
                {card.value}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {activeTab === 'dashboard' && (
        <>
          {/* Graphical Sales Analysis Component */}
          <SalesGraphicalAnalysis enquiries={enquiries} />

          {/* End-to-End Order Traceability Table */}
          <div className="dash-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={19} color="#18476c" /> End-to-End Order Traceability
            </h3>
            <div className="dash-table-wrapper">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th style={{ width: '130px' }}>Enquiry No</th>
                    <th>Customer</th>
                    <th>Category</th>
                    <th>Part Code & Qty</th>
                    <th>Purchase Cost</th>
                    <th>Quote Ref</th>
                    <th>Order Ref</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        No data available in system register.
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
                          {enq.pdf_attachment && (
                            <a
                              href={enq.pdf_attachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={enq.attachment_name || `${enq.enquiry_no}_attachment.pdf`}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: '#2563eb', textDecoration: 'none', marginTop: '3px', fontWeight: 600 }}
                              title="Download / View Attached PDF"
                            >
                              <Paperclip size={12} /> {enq.attachment_name || 'Attached PDF'}
                            </a>
                          )}
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
                          {enq.supplier_cost ? (
                            <span style={{ fontWeight: 700, color: '#18476c' }}>₹{Number(enq.supplier_cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          ) : (
                            <span className="status-badge badge-amber" style={{ fontSize: '0.74rem' }}>Awaiting Cost</span>
                          )}
                        </td>
                        <td>
                          {enq.quotation_no ? (
                            <div>
                              <strong style={{ color: '#18476c', fontSize: '0.92rem' }}>₹{Number(enq.quotation_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{enq.quotation_no}</div>
                              <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
                                <button
                                  type="button"
                                  onClick={() => setPreviewModal({ isOpen: true, type: 'quotation', data: enq })}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: '2px 6px',
                                    background: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    color: '#1e40af'
                                  }}
                                  title="View Quotation"
                                >
                                  <Eye size={10} color="#2563eb" /> View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => downloadDocumentPdf(buildQuotationPdf(enq), `Quotation-${enq.quotation_no}.pdf`)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '2px 5px',
                                    background: '#f8fafc',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    cursor: 'pointer',
                                    color: '#475569'
                                  }}
                                  title="Download Quotation PDF"
                                >
                                  <Download size={10} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>
                        <td>
                          {enq.order_no ? (
                            <div>
                              <span style={{ color: '#18476c', fontWeight: 700 }}>{enq.order_no}</span>
                              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>PO: {enq.po_number}</div>
                              <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
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
                                  title="View Sales Order"
                                >
                                  <Eye size={10} color="#d97706" /> SO
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
                              {enq.invoice_no && (
                                <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
                                  <button
                                    type="button"
                                    onClick={() => setPreviewModal({ isOpen: true, type: 'invoice', data: enq })}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      padding: '2px 6px',
                                      background: '#ecfdf5',
                                      border: '1px solid #a7f3d0',
                                      borderRadius: '4px',
                                      fontSize: '0.7rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      color: '#047857'
                                    }}
                                    title="View Invoice"
                                  >
                                    <Eye size={10} color="#059669" /> Invoice
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => downloadDocumentPdf(buildInvoicePdf(enq), `Invoice-${enq.invoice_no}.pdf`)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      padding: '2px 5px',
                                      background: '#ecfdf5',
                                      border: '1px solid #a7f3d0',
                                      borderRadius: '4px',
                                      fontSize: '0.7rem',
                                      cursor: 'pointer',
                                      color: '#047857'
                                    }}
                                    title="Download Invoice PDF"
                                  >
                                    <Download size={10} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${enq.status.includes('Dispatched') ? 'badge-emerald' : enq.status.includes('Confirmed') ? 'badge-blue' : 'badge-amber'}`}>
                            {enq.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB: PIPELINE */}
      {activeTab === 'pipeline' && (
        <div className="dash-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={19} color="#18476c" /> End-to-End Order Traceability
          </h3>
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Enquiry No</th>
                  <th>Customer</th>
                  <th>Category</th>
                  <th>Part Code & Qty</th>
                  <th>Purchase Cost</th>
                  <th>Quote Ref</th>
                  <th>Order Ref</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No data available in system register.
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
                        {enq.supplier_cost ? (
                          <span style={{ fontWeight: 700, color: '#18476c' }}>₹{Number(enq.supplier_cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span className="status-badge badge-amber" style={{ fontSize: '0.74rem' }}>Awaiting Cost</span>
                        )}
                      </td>
                      <td>
                        {enq.quotation_no ? (
                          <div>
                            <strong style={{ color: '#18476c', fontSize: '0.92rem' }}>₹{Number(enq.quotation_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{enq.quotation_no}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td>
                        {enq.order_no ? (
                          <span style={{ color: '#18476c', fontWeight: 700 }}>{enq.order_no}</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${enq.status.includes('Dispatched') ? 'badge-emerald' : enq.status.includes('Confirmed') ? 'badge-blue' : 'badge-amber'}`}>
                          {enq.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES */}
      {activeTab === 'roles' && (
        <div className="dash-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={19} color="#18476c" /> Configured Corporate Logins
          </h3>
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Role ID</th>
                  <th>Login Email</th>
                  <th>Department</th>
                  <th>Core Permissions</th>
                  <th>Access Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong style={{ color: '#0f172a' }}>1. Admin</strong></td>
                  <td><span className="data-code-pill">admin@company.com</span></td>
                  <td>Executive Management</td>
                  <td>Full system settings, analytics & user access</td>
                  <td><span className="status-badge badge-emerald"><CheckCircle2 size={13} /> Active</span></td>
                </tr>
                <tr>
                  <td><strong style={{ color: '#0f172a' }}>2. Receptionist</strong></td>
                  <td><span className="data-code-pill">reception@company.com</span></td>
                  <td>Enquiry Desk</td>
                  <td>Log customer leads, category tagging (Mechanical/Electrical/IT)</td>
                  <td><span className="status-badge badge-emerald"><CheckCircle2 size={13} /> Active</span></td>
                </tr>
                <tr>
                  <td><strong style={{ color: '#0f172a' }}>3. Sales</strong></td>
                  <td><span className="data-code-pill">sales@company.com</span></td>
                  <td>Commercial</td>
                  <td>Quotation creation, PO verification, Sales Orders, Invoice & Dispatch</td>
                  <td><span className="status-badge badge-emerald"><CheckCircle2 size={13} /> Active</span></td>
                </tr>
                <tr>
                  <td><strong style={{ color: '#0f172a' }}>4. Purchase</strong></td>
                  <td><span className="data-code-pill">purchase@company.com</span></td>
                  <td>Procurement</td>
                  <td>Supplier costs, stock availability checks, procurement lead times</td>
                  <td><span className="status-badge badge-emerald"><CheckCircle2 size={13} /> Active</span></td>
                </tr>
                <tr>
                  <td><strong style={{ color: '#0f172a' }}>5. Store</strong></td>
                  <td><span className="data-code-pill">store@company.com</span></td>
                  <td>Warehouse / Inventory</td>
                  <td>Stock checking, picking, packing, stock reservation</td>
                  <td><span className="status-badge badge-emerald"><CheckCircle2 size={13} /> Active</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REPORTS */}
      {activeTab === 'reports' && (
        <>
          <SalesGraphicalAnalysis enquiries={enquiries} />

          <div className="dash-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={19} color="#18476c" /> Departmental Division Registers
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #cbdce8', borderLeft: '4px solid #18476c' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Division 1</div>
                <h4 style={{ color: '#18476c', fontSize: '1.1rem', margin: '4px 0' }}>Mechanical</h4>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>
                  {enquiries.filter(e => e.category === 'Mechanical').length} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>Enquiries</span>
                </p>
              </div>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #cbd5e1', borderLeft: '4px solid #475569' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Division 2</div>
                <h4 style={{ color: '#334155', fontSize: '1.1rem', margin: '4px 0' }}>Electrical</h4>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>
                  {enquiries.filter(e => e.category === 'Electrical').length} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>Enquiries</span>
                </p>
              </div>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #cbd5e1', borderLeft: '4px solid #0f172a' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Division 3</div>
                <h4 style={{ color: '#0f172a', fontSize: '1.1rem', margin: '4px 0' }}>Computer / IT</h4>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>
                  {enquiries.filter(e => e.category === 'Computer / IT').length} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>Enquiries</span>
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Dynamic Document Preview Modal */}
      <DocumentModal
        isOpen={previewModal.isOpen}
        type={previewModal.type}
        data={previewModal.data}
        onClose={() => setPreviewModal({ isOpen: false, type: 'quotation', data: null })}
      />
    </DashboardLayout>
  );
}
