import React from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { Users, TrendingUp, Layers, CheckCircle2 } from 'lucide-react';

export default function AdminDashboard() {
  const metrics = [
    { title: 'Total Enquiries', value: '48', change: '+12% this week', color: '#38bdf8' },
    { title: 'Active Quotations', value: '18', change: '$42,500 value', color: '#fbbf24' },
    { title: 'Confirmed Orders', value: '14', change: '8 in packing', color: '#34d399' },
    { title: 'Completed Dispatches', value: '31', change: 'On-time 98%', color: '#818cf8' }
  ];

  return (
    <DashboardLayout title="System Administration & Executive View" roleBadge="ADMIN">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {metrics.map((m, idx) => (
          <div key={idx} className="dash-card" style={{ padding: '1.25rem', margin: 0 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.title}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: m.color, margin: '0.4rem 0' }}>{m.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.change}</div>
          </div>
        ))}
      </div>

      <div className="dash-card">
        <h3>Connected Role Logins & Status</h3>
        <table className="dash-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Assigned Department</th>
              <th>Primary Responsibility</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Receptionist</strong></td>
              <td>Enquiry Desk</td>
              <td>Lead capture, product categorization (Mechanical / Electrical / IT)</td>
              <td><span className="status-badge badge-success">Active</span></td>
            </tr>
            <tr>
              <td><strong>Purchase</strong></td>
              <td>Procurement</td>
              <td>Supplier cost, availability and delivery lead times</td>
              <td><span className="status-badge badge-success">Active</span></td>
            </tr>
            <tr>
              <td><strong>Sales</strong></td>
              <td>Commercial</td>
              <td>Quotations, customer PO verification, Invoice & Carrier Dispatch</td>
              <td><span className="status-badge badge-success">Active</span></td>
            </tr>
            <tr>
              <td><strong>Store</strong></td>
              <td>Warehouse</td>
              <td>Stock checking, reservation, picking & packing</td>
              <td><span className="status-badge badge-success">Active</span></td>
            </tr>
            <tr>
              <td><strong>Admin</strong></td>
              <td>Management</td>
              <td>System settings, user permissions, analytics</td>
              <td><span className="status-badge badge-success">Active</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
