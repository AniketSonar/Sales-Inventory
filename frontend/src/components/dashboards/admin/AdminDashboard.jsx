import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { adminConfig } from '../../layout/dashboardConfigs';
import { BarChart3, Users, FileText, CheckCircle2, RefreshCw, Shield, Layers, TrendingUp, Clock, PackageCheck } from 'lucide-react';
import { useLiveSync } from '../../../utils/useLiveSync';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ enquiries: 0, quotations: 0, orders: 0, dispatches: 0 });
  const [enquiries, setEnquiries] = useState([]);

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
    { title: 'Total Enquiries Logged', value: stats.enquiries, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: FileText, label: 'Enquiry Desk Leadhub' },
    { title: 'Quotations Created', value: stats.quotations, color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: TrendingUp, label: 'Commercial Sales Desk' },
    { title: 'Confirmed Sales Orders', value: stats.orders, color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe', icon: PackageCheck, label: 'Warehouse Fulfilment' },
    { title: 'Completed Dispatches', value: stats.dispatches, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: CheckCircle2, label: 'Carrier Invoiced & Closed' }
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

      {/* TAB 1: EXECUTIVE DASHBOARD / PIPELINE */}
      {(activeTab === 'dashboard' || activeTab === 'pipeline') && (
        <div className="dash-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={19} color="#2563eb" /> End-to-End Enterprise Order Traceability
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
                          <span style={{ fontWeight: 700, color: '#2563eb' }}>${Number(enq.supplier_cost).toFixed(2)}</span>
                        ) : (
                          <span className="status-badge badge-amber" style={{ fontSize: '0.74rem' }}>Awaiting Cost</span>
                        )}
                      </td>
                      <td>
                        {enq.quotation_no ? (
                          <div>
                            <strong style={{ color: '#059669', fontSize: '0.92rem' }}>${Number(enq.quotation_amount).toFixed(2)}</strong>
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{enq.quotation_no}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td>
                        {enq.order_no ? (
                          <span style={{ color: '#4f46e5', fontWeight: 700 }}>{enq.order_no}</span>
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
            <Users size={19} color="#2563eb" /> Configured Corporate Logins
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
        <div className="dash-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={19} color="#2563eb" /> Category Breakdown
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #2563eb' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Division 1</div>
              <h4 style={{ color: '#2563eb', fontSize: '1.1rem', margin: '4px 0' }}>Mechanical</h4>
              <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>
                {enquiries.filter(e => e.category === 'Mechanical').length} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>Enquiries</span>
              </p>
            </div>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #d97706' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Division 2</div>
              <h4 style={{ color: '#d97706', fontSize: '1.1rem', margin: '4px 0' }}>Electrical</h4>
              <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>
                {enquiries.filter(e => e.category === 'Electrical').length} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>Enquiries</span>
              </p>
            </div>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #059669' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Division 3</div>
              <h4 style={{ color: '#059669', fontSize: '1.1rem', margin: '4px 0' }}>Computer / IT</h4>
              <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>
                {enquiries.filter(e => e.category === 'Computer / IT').length} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>Enquiries</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
