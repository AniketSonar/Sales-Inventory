import React, { useState, useMemo } from 'react';
import { API_URL } from '../../../config/api';
import DashboardLayout from '../../layout/DashboardLayout';
import { adminConfig } from '../../layout/dashboardConfigs';
import {
  BarChart3,
  Users,
  FileText,
  CheckCircle2,
  RefreshCw,
  Shield,
  Layers,
  TrendingUp,
  Clock,
  PackageCheck,
  DollarSign,
  Paperclip,
  Eye,
  Download,
  Activity,
  Search,
  Filter,
  Building,
  User,
  AlertCircle,
  X,
  Boxes,
  Truck
} from 'lucide-react';
import { useLiveSync } from '../../../utils/useLiveSync';
import SalesGraphicalAnalysis from './SalesGraphicalAnalysis';
import DocumentModal from '../../common/DocumentModal';
import EnquiryTrackingModal from '../../common/EnquiryTrackingModal';
import { computeEnquiryTracking, formatDateTime } from '../../../utils/enquiryTracker';
import {
  buildQuotationPdf,
  buildInvoicePdf,
  buildSalesOrderPdf,
  buildDeliveryChallanPdf,
  buildOpcPdf,
  downloadDocumentPdf
} from '../../../utils/documentGenerator';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'tracking' | 'pipeline' | 'roles' | 'reports'
  const [stats, setStats] = useState({ enquiries: 0, quotations: 0, orders: 0, dispatches: 0 });
  const [enquiries, setEnquiries] = useState([]);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, type: 'quotation', data: null });
  const [trackingModal, setTrackingModal] = useState({ isOpen: false, enquiry: null });

  // Filters for Live Enquiry Tracking System
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [salespersonFilter, setSalespersonFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = async () => {
    try {
      const [resStats, resEnq] = await Promise.all([
        fetch(`${API_URL}/api/stats`),
        fetch(`${API_URL}/api/enquiries`)
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

  // Compute enquiry tracking metadata map for all enquiries
  const enquiryMetaMap = useMemo(() => {
    const map = {};
    enquiries.forEach(enq => {
      map[enq.id] = computeEnquiryTracking(enq, []);
    });
    return map;
  }, [enquiries]);

  // Extract unique salespersons for filter dropdown
  const uniqueSalespersons = useMemo(() => {
    const set = new Set();
    enquiries.forEach(e => {
      const sp = e.assigned_salesperson || e.opc_salesperson_name || 'Sales Lead';
      if (sp) set.add(sp);
    });
    return Array.from(set);
  }, [enquiries]);

  // Filtered Enquiries
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter(enq => {
      const meta = enquiryMetaMap[enq.id] || {};
      const dept = meta.currentDepartment || 'Sales';
      const sp = enq.assigned_salesperson || enq.opc_salesperson_name || 'Sales Lead';
      const st = (enq.status || '').toLowerCase();

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesEnqNo = (enq.enquiry_no || '').toLowerCase().includes(q);
        const matchesCust = (enq.customer_name || '').toLowerCase().includes(q);
        const matchesPart = (enq.part_code || '').toLowerCase().includes(q);
        const matchesStatus = (enq.status || '').toLowerCase().includes(q);
        if (!matchesEnqNo && !matchesCust && !matchesPart && !matchesStatus) return false;
      }

      // Department filter
      if (departmentFilter !== 'all' && dept.toLowerCase() !== departmentFilter.toLowerCase()) {
        return false;
      }

      // Salesperson filter
      if (salespersonFilter !== 'all' && sp !== salespersonFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending_approval' && !st.includes('pending approval')) return false;
        if (statusFilter === 'in_progress' && (st.includes('delivered') || st.includes('closed'))) return false;
        if (statusFilter === 'in_transit' && !st.includes('transit') && !st.includes('dispatched')) return false;
        if (statusFilter === 'delivered' && !st.includes('delivered') && !st.includes('closed')) return false;
      }

      return true;
    });
  }, [enquiries, enquiryMetaMap, searchQuery, departmentFilter, salespersonFilter, statusFilter]);

  // Handle open live tracking modal
  const handleOpenTracking = (enq) => {
    setTrackingModal({ isOpen: true, enquiry: enq });
  };

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
          <p>Real-time database analytics and live cross-department enquiry tracking.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`dash-btn ${activeTab === 'tracking' ? 'dash-btn-primary' : 'dash-btn-secondary'}`}
          >
            <Activity size={15} /> Live Enquiry Tracking
          </button>
          <button
            onClick={loadData}
            className="dash-btn dash-btn-secondary"
          >
            <RefreshCw size={15} /> Refresh Analytics
          </button>
        </div>
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

      {/* =========================================================================
          TAB: LIVE ENQUIRY TRACKING SYSTEM (Core Requirement 1, 2, 3, 4)
          ========================================================================= */}
      {activeTab === 'tracking' && (
        <div className="dash-card animate-fade">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={22} color="#00873e" />
              <div>
                <h3 style={{ margin: 0, padding: 0, border: 'none', fontSize: '1.2rem', color: '#0f172a' }}>
                  Live Enquiry Tracking System
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                  Real-time status, department handovers, and milestone progress for every customer enquiry.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="live-pulse-badge">
                <span className="pulse-dot"></span> Auto-Syncing (3s)
              </span>
              <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                Showing {filteredEnquiries.length} of {enquiries.length} enquiries
              </span>
            </div>
          </div>

          {/* Real-time Filter Bar (Requirement 4) */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Search enquiry, client, part..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none' }}
              />
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none', background: '#ffffff' }}
              >
                <option value="all">🏢 All Departments</option>
                <option value="Reception">Enquiry Desk (Reception)</option>
                <option value="Sales">Sales & Commercial</option>
                <option value="Purchase">Purchase & Procurement</option>
                <option value="Store">Store & Warehouse</option>
                <option value="Logistics">Logistics & Dispatch</option>
              </select>
            </div>

            {/* Salesperson Filter */}
            <div>
              <select
                value={salespersonFilter}
                onChange={(e) => setSalespersonFilter(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none', background: '#ffffff' }}
              >
                <option value="all">👤 All Salespersons</option>
                {uniqueSalespersons.map(sp => (
                  <option key={sp} value={sp}>{sp}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', outline: 'none', background: '#ffffff' }}
              >
                <option value="all">📊 All Lifecycle Statuses</option>
                <option value="in_progress">Active / In Progress</option>
                <option value="pending_approval">Pending Approvals</option>
                <option value="in_transit">In Transit / Dispatched</option>
                <option value="delivered">Delivered & Closed</option>
              </select>
            </div>

            {/* Reset Filters */}
            {(searchQuery || departmentFilter !== 'all' || salespersonFilter !== 'all' || statusFilter !== 'all') && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setDepartmentFilter('all');
                    setSalespersonFilter('all');
                    setStatusFilter('all');
                  }}
                  className="dash-btn dash-btn-secondary"
                  style={{ width: '100%', padding: '6px 12px', fontSize: '0.78rem', justifyContent: 'center' }}
                >
                  <X size={13} /> Reset Filters
                </button>
              </div>
            )}
          </div>

          {/* Real-time Tracking Table */}
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th style={{ width: '135px' }}>Enquiry No</th>
                  <th>Client / Company</th>
                  <th>Assigned Salesperson</th>
                  <th>Current Dept</th>
                  <th>Lifecycle Status</th>
                  <th style={{ width: '220px' }}>Progress Indicator</th>
                  <th style={{ textAlign: 'center', width: '120px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnquiries.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No enquiries match the current filter selection.
                    </td>
                  </tr>
                ) : (
                  filteredEnquiries.map(enq => {
                    const meta = enquiryMetaMap[enq.id] || {};
                    const pct = meta.progressPercent || 0;
                    const completedCount = meta.stages ? meta.stages.filter(s => s.isCompleted).length : 0;
                    const dept = meta.currentDepartment || 'Sales';
                    const sp = enq.assigned_salesperson || enq.opc_salesperson_name || 'Sales Lead';

                    return (
                      <tr
                        key={enq.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleOpenTracking(enq)}
                      >
                        <td>
                          <span
                            className="data-code-pill"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#edf4f9', borderColor: '#cbdce8', color: '#18476c', fontWeight: 700 }}
                            title="Click to Live Track"
                          >
                            <Activity size={12} color="#00873e" />
                            {enq.enquiry_no}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.88rem' }}>
                            {enq.customer_name}
                          </strong>
                          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {enq.part_code} (Qty: {enq.quantity})
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                            <User size={13} color="#18476c" />
                            {sp}
                          </span>
                        </td>
                        <td>
                          <span className={`stage-dept-tag dept-${dept.toLowerCase()}`} style={{ fontWeight: 700 }}>
                            {dept}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${enq.status.includes('Delivered') ? 'badge-emerald' : enq.status.includes('Approved') || enq.status.includes('In Transit') ? 'badge-blue' : 'badge-amber'}`}>
                            {enq.status}
                          </span>
                          {meta.isDelayed && (
                            <span style={{ display: 'block', fontSize: '0.68rem', color: '#dc2626', fontWeight: 700, marginTop: '2px' }}>
                              ⚠️ Delayed
                            </span>
                          )}
                        </td>
                        {/* Progress Indicator (Requirement 1 & 3) */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 600 }}>
                              <span style={{ color: '#18476c' }}>
                                Stage {completedCount}/15
                              </span>
                              <strong style={{ color: pct === 100 ? '#00873e' : '#18476c' }}>
                                {pct}%
                              </strong>
                            </div>
                            <div style={{ height: '7px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${pct}%`,
                                  background: pct === 100 ? '#00873e' : 'linear-gradient(90deg, #18476c, #00873e)',
                                  borderRadius: '9999px',
                                  transition: 'width 0.4s ease'
                                }}
                              ></div>
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              Next: <strong>{meta.currentStageName || 'Enquiry Received'}</strong>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTracking(enq);
                            }}
                            className="dash-btn dash-btn-primary"
                            style={{
                              padding: '5px 12px',
                              fontSize: '0.76rem',
                              background: '#18476c',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Open Live Tracking & Detailed Timeline"
                          >
                            <Activity size={13} color="#a7f3d0" /> Track Live
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 1: EXECUTIVE DASHBOARD
          ========================================================================= */}
      {activeTab === 'dashboard' && (
        <>
          {/* Graphical Sales Analysis Component */}
          <SalesGraphicalAnalysis enquiries={enquiries} />

          {/* End-to-End Order Traceability Table with Live Tracking Integration */}
          <div className="dash-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, padding: 0, border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={19} color="#18476c" /> End-to-End Order Traceability
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('tracking')}
                className="dash-btn dash-btn-secondary"
                style={{ fontSize: '0.78rem', padding: '4px 10px', color: '#00873e', borderColor: '#a7f3d0' }}
              >
                <Activity size={13} /> View in Live Tracker
              </button>
            </div>
            <div className="dash-table-wrapper">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th style={{ width: '130px' }}>Enquiry No</th>
                    <th>Customer</th>
                    <th>Category</th>
                    <th>Part Code & Qty</th>
                    <th>Progress Indicator</th>
                    <th>Purchase Cost</th>
                    <th>Quote Ref</th>
                    <th>Order Ref</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Live Track</th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        No data available in system register.
                      </td>
                    </tr>
                  ) : (
                    enquiries.map(enq => {
                      const meta = enquiryMetaMap[enq.id] || {};
                      const pct = meta.progressPercent || 0;
                      return (
                        <tr key={enq.id}>
                          <td>
                            <span
                              className="data-code-pill"
                              style={{ cursor: 'pointer', color: '#18476c', fontWeight: 700 }}
                              onClick={() => handleOpenTracking(enq)}
                              title="Click to Open Live Tracker"
                            >
                              {enq.enquiry_no}
                            </span>
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
                          {/* Progress Indicator Column (Requirement 1) */}
                          <td style={{ minWidth: '150px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${pct}%`,
                                    background: pct === 100 ? '#00873e' : '#18476c',
                                    borderRadius: '9999px'
                                  }}
                                ></div>
                              </div>
                              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: pct === 100 ? '#00873e' : '#18476c' }}>
                                {pct}%
                              </span>
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                              Dept: <strong>{meta.currentDepartment || 'Sales'}</strong>
                            </div>
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
                            {enq.order_no || enq.opc_no ? (
                              <div>
                                {enq.opc_no && (
                                  <div style={{ marginBottom: '3px' }}>
                                    <span style={{ color: '#0d9488', fontWeight: 700, fontSize: '0.8rem' }}>{enq.opc_no}</span>
                                    <span className="status-badge badge-slate" style={{ fontSize: '0.64rem', padding: '1px 4px', marginLeft: '3px' }}>
                                      {enq.opc_status || 'OPC'}
                                    </span>
                                    <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
                                      <button
                                        type="button"
                                        onClick={() => setPreviewModal({ isOpen: true, type: 'opc', data: enq })}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '2px',
                                          padding: '1px 5px',
                                          background: '#f0fdfa',
                                          border: '1px solid #99f6e4',
                                          borderRadius: '3px',
                                          fontSize: '0.68rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          color: '#0f766e'
                                        }}
                                        title="View Order Processing Confirmation"
                                      >
                                        <Eye size={10} color="#0d9488" /> OPC
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => downloadDocumentPdf(buildOpcPdf(enq), `OPC-${enq.opc_no}.pdf`)}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          padding: '1px 4px',
                                          background: '#f8fafc',
                                          border: '1px solid #cbd5e1',
                                          borderRadius: '3px',
                                          fontSize: '0.68rem',
                                          cursor: 'pointer'
                                        }}
                                        title="Download OPC PDF"
                                      >
                                        <Download size={10} />
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {enq.order_no && (
                                  <>
                                    <span style={{ color: '#18476c', fontWeight: 700 }}>{enq.order_no}</span>
                                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>PO: {enq.po_number || enq.opc_order_reference}</div>
                                  </>
                                )}
                                <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
                                  {enq.order_no && (
                                    <>
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
                                    </>
                                  )}
                                </div>
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
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenTracking(enq)}
                              style={{
                                background: '#edf4f9',
                                border: '1px solid #cbdce8',
                                color: '#18476c',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              title="Live Track Timeline"
                            >
                              <Activity size={11} color="#00873e" /> Track
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          TAB: PIPELINE (All Orders Pipeline)
          ========================================================================= */}
      {activeTab === 'pipeline' && (
        <div className="dash-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, padding: 0, border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={19} color="#18476c" /> All Orders Pipeline
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('tracking')}
              className="dash-btn dash-btn-secondary"
              style={{ fontSize: '0.78rem', padding: '4px 10px', color: '#00873e', borderColor: '#a7f3d0' }}
            >
              <Activity size={13} /> Open Live Tracker
            </button>
          </div>
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Enquiry No</th>
                  <th>Customer</th>
                  <th>Category</th>
                  <th>Assigned Rep</th>
                  <th>Current Dept</th>
                  <th>Progress</th>
                  <th>Purchase Cost</th>
                  <th>Quote Ref</th>
                  <th>Order Ref</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Live Track</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No data available in system register.
                    </td>
                  </tr>
                ) : (
                  enquiries.map(enq => {
                    const meta = enquiryMetaMap[enq.id] || {};
                    const pct = meta.progressPercent || 0;
                    return (
                      <tr key={enq.id}>
                        <td>
                          <span
                            className="data-code-pill"
                            style={{ cursor: 'pointer', color: '#18476c', fontWeight: 700 }}
                            onClick={() => handleOpenTracking(enq)}
                          >
                            {enq.enquiry_no}
                          </span>
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
                          <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
                            {enq.assigned_salesperson || 'Sales Lead'}
                          </span>
                        </td>
                        <td>
                          <span className={`stage-dept-tag dept-${(meta.currentDepartment || 'sales').toLowerCase()}`}>
                            {meta.currentDepartment || 'Sales'}
                          </span>
                        </td>
                        <td style={{ minWidth: '130px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${pct}%`,
                                  background: pct === 100 ? '#00873e' : '#18476c',
                                  borderRadius: '9999px'
                                }}
                              ></div>
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: pct === 100 ? '#00873e' : '#18476c' }}>
                              {pct}%
                            </span>
                          </div>
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
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenTracking(enq)}
                            style={{
                              background: '#edf4f9',
                              border: '1px solid #cbdce8',
                              color: '#18476c',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <Activity size={11} color="#00873e" /> Track
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ROLES
          ========================================================================= */}
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
                  <td>Full system settings, live enquiry tracking & user access</td>
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

      {/* =========================================================================
          TAB 3: REPORTS
          ========================================================================= */}
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

      {/* Live Enquiry Tracking Modal (Reference UI Design) */}
      <EnquiryTrackingModal
        isOpen={trackingModal.isOpen}
        enquiry={trackingModal.enquiry}
        onClose={() => setTrackingModal({ isOpen: false, enquiry: null })}
        onOpenDocumentModal={(type, data) => setPreviewModal({ isOpen: true, type, data })}
      />
    </DashboardLayout>
  );
}
