import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { adminConfig } from '../../layout/dashboardConfigs';
import { BarChart3, Users, FileText, CheckCircle2, RefreshCw, Shield, Layers } from 'lucide-react';

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

  useEffect(() => {
    loadData();
  }, []);

  const statCards = [
    { title: 'Total Enquiries Logged', value: stats.enquiries, color: '#38bdf8', label: 'From Reception' },
    { title: 'Quotations Created', value: stats.quotations, color: '#fbbf24', label: 'By Sales Team' },
    { title: 'Confirmed Sales Orders', value: stats.orders, color: '#818cf8', label: 'Store Fulfillment' },
    { title: 'Completed Dispatches', value: stats.dispatches, color: '#34d399', label: 'Carrier Invoiced' }
  ];

  return (
    <DashboardLayout
      config={adminConfig}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      <div className="dash-view-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Executive Management Console</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>Real-time database analytics and cross-department pipeline visibility.</p>
        </div>
        <button
          onClick={loadData}
          className="dash-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e293b' }}
        >
          <RefreshCw size={15} /> Refresh Analytics
        </button>
      </div>

      {/* Analytics KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {statCards.map((card, idx) => (
          <div key={idx} className="dash-card" style={{ padding: '20px', margin: 0 }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{card.title}</div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: card.color, margin: '8px 0' }}>{card.value}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* TAB 1: EXECUTIVE DASHBOARD / PIPELINE */}
      {(activeTab === 'dashboard' || activeTab === 'pipeline') && (
        <div className="dash-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#38bdf8" /> End-to-End Enterprise Order Traceability
          </h3>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Enquiry No</th>
                <th>Customer</th>
                <th>Category</th>
                <th>Part Code</th>
                <th>Purchase Cost</th>
                <th>Quote Ref</th>
                <th>Order Ref</th>
                <th>Dispatch</th>
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
                  <td>{enq.part_code} (×{enq.quantity})</td>
                  <td>{enq.supplier_cost ? `$${enq.supplier_cost}` : <span style={{ color: '#94a3b8' }}>—</span>}</td>
                  <td>{enq.quotation_no ? `$${enq.quotation_amount}` : <span style={{ color: '#94a3b8' }}>—</span>}</td>
                  <td>{enq.order_no || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                  <td>
                    <span className={`status-badge ${enq.status.includes('Dispatched') ? 'badge-success' : 'badge-warning'}`}>
                      {enq.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: ROLES */}
      {activeTab === 'roles' && (
        <div className="dash-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="#38bdf8" /> Configured Corporate Logins
          </h3>
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
                <td><strong>1. Admin</strong></td>
                <td>admin@company.com</td>
                <td>Executive Management</td>
                <td>Full system settings, analytics & user access</td>
                <td><span className="status-badge badge-success">Active</span></td>
              </tr>
              <tr>
                <td><strong>2. Receptionist</strong></td>
                <td>reception@company.com</td>
                <td>Enquiry Desk</td>
                <td>Log customer leads, category tagging (Mechanical/Electrical/IT)</td>
                <td><span className="status-badge badge-success">Active</span></td>
              </tr>
              <tr>
                <td><strong>3. Sales</strong></td>
                <td>sales@company.com</td>
                <td>Commercial</td>
                <td>Quotation creation, PO verification, Sales Orders, Invoice & Dispatch</td>
                <td><span className="status-badge badge-success">Active</span></td>
              </tr>
              <tr>
                <td><strong>4. Purchase</strong></td>
                <td>purchase@company.com</td>
                <td>Procurement</td>
                <td>Supplier costs, stock availability checks, procurement lead times</td>
                <td><span className="status-badge badge-success">Active</span></td>
              </tr>
              <tr>
                <td><strong>5. Store</strong></td>
                <td>store@company.com</td>
                <td>Warehouse / Inventory</td>
                <td>Stock checking, picking, packing, stock reservation</td>
                <td><span className="status-badge badge-success">Active</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: REPORTS */}
      {activeTab === 'reports' && (
        <div className="dash-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="#38bdf8" /> Category Breakdown
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
            <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <h4 style={{ color: '#38bdf8' }}>Mechanical</h4>
              <p style={{ fontSize: '1.4rem', fontWeight: 700, margin: '8px 0' }}>
                {enquiries.filter(e => e.category === 'Mechanical').length} Enquiries
              </p>
            </div>
            <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <h4 style={{ color: '#fbbf24' }}>Electrical</h4>
              <p style={{ fontSize: '1.4rem', fontWeight: 700, margin: '8px 0' }}>
                {enquiries.filter(e => e.category === 'Electrical').length} Enquiries
              </p>
            </div>
            <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <h4 style={{ color: '#34d399' }}>Computer / IT</h4>
              <p style={{ fontSize: '1.4rem', fontWeight: 700, margin: '8px 0' }}>
                {enquiries.filter(e => e.category === 'Computer / IT').length} Enquiries
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
