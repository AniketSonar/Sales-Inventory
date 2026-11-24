import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config/api';
import {
  X,
  Check,
  CheckCircle2,
  Clock,
  User,
  Building,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  History,
  Eye,
  Download,
  RefreshCw,
  Shield,
  Truck,
  Package,
  FileText,
  Boxes,
  FileCheck,
  Paperclip
} from 'lucide-react';
import { computeEnquiryTracking, formatDateTime } from '../../utils/enquiryTracker';
import {
  buildQuotationPdf,
  buildInvoicePdf,
  buildSalesOrderPdf,
  buildDeliveryChallanPdf,
  buildOpcPdf,
  downloadDocumentPdf
} from '../../utils/documentGenerator';
import './EnquiryTrackingModal.css';

export default function EnquiryTrackingModal({
  isOpen,
  onClose,
  enquiry,
  onOpenDocumentModal
}) {
  if (!isOpen || !enquiry) return null;

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'stages' | 'history'
  const [timelineData, setTimelineData] = useState({ enquiry, history: [], followups: [] });
  const [loading, setLoading] = useState(false);
  const [salespersonInput, setSalespersonInput] = useState(enquiry.assigned_salesperson || 'Sales Lead');
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState('');

  // Fetch live enquiry timeline data from API
  const fetchTimeline = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/enquiries/${enquiry.id}/timeline`);
      const data = await res.json();
      if (data.success && data.data) {
        setTimelineData({
          enquiry: data.data.enquiry || enquiry,
          history: data.data.history || [],
          followups: data.data.followups || []
        });
        if (data.data.enquiry?.assigned_salesperson) {
          setSalespersonInput(data.data.enquiry.assigned_salesperson);
        }
      }
    } catch (err) {
      console.error('Error fetching live timeline:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial fetch and 3-second live sync polling while modal is open
  useEffect(() => {
    fetchTimeline(false);
    const interval = setInterval(() => {
      fetchTimeline(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [enquiry.id]);

  // Compute live tracking metrics from the current live database state
  const liveEnq = timelineData.enquiry || enquiry;
  const tracking = computeEnquiryTracking(liveEnq, timelineData.history, timelineData.followups);

  // Handle Salesperson Reassignment
  const handleAssignSalesperson = async (e) => {
    e.preventDefault();
    if (!salespersonInput.trim()) return;
    setAssigning(true);
    try {
      const res = await fetch(`${API_URL}/api/enquiries/${enquiry.id}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_salesperson: salespersonInput.trim(),
          performed_by: 'System Administrator',
          notes: 'Salesperson reassigned via Live Tracking Console'
        })
      });
      const data = await res.json();
      if (data.success) {
        setAssignMsg(`Assigned to ${salespersonInput}`);
        fetchTimeline(true);
        setTimeout(() => setAssignMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAssigning(false);
    }
  };

  // 3-Milestone connector line width calculation
  const getConnectorWidth = () => {
    const { orderConfirmed, shipped, delivery } = tracking.milestones3;
    if (delivery.completed) return '100%';
    if (shipped.completed) return '50%';
    if (orderConfirmed.completed) return '20%';
    return '0%';
  };

  return (
    <div className="tracking-modal-backdrop" onClick={onClose}>
      <div className="tracking-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div className="tracking-modal-header">
          <div className="tracking-title-wrap">
            <div className="tracking-title-row">
              <h2 className="tracking-modal-title">Live Enquiry Tracking</h2>
              <span className="live-pulse-badge">
                <span className="pulse-dot"></span> Live Sync Active
              </span>
              <span className="status-badge badge-blue" style={{ fontWeight: 700 }}>
                {liveEnq.enquiry_no}
              </span>
              <span className={`status-badge ${liveEnq.status.includes('Delivered') ? 'badge-emerald' : liveEnq.status.includes('Approved') || liveEnq.status.includes('In Transit') ? 'badge-blue' : 'badge-amber'}`}>
                {liveEnq.status}
              </span>
            </div>
            <div className="tracking-subtext">
              <span><strong>Client:</strong> {liveEnq.customer_name}</span>
              <span>•</span>
              <span><strong>Category:</strong> {liveEnq.category}</span>
              <span>•</span>
              <span><strong>Part:</strong> {liveEnq.part_code} (Qty: {liveEnq.quantity})</span>
              <span>•</span>
              <span><strong>Logged:</strong> {formatDateTime(liveEnq.created_at)}</span>
            </div>
          </div>
          <button
            type="button"
            className="tracking-modal-close"
            onClick={onClose}
            title="Close Tracking Modal"
          >
            <X size={22} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="tracking-modal-body">
          {/* =========================================================================
              SECTION 1: 3-MILESTONE REFERENCE TIMELINE (Order Confirmed -> Shipped -> Delivery)
              Exact visual reproduction of reference design from attached image
              ========================================================================= */}
          <div className="ref-tracking-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#18476c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Customer Milestone Progression
              </span>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                Internal Progress: <strong style={{ color: '#00873e' }}>{tracking.progressPercent}%</strong> ({tracking.stages.filter(s => s.isCompleted).length}/15 Stages)
              </span>
            </div>

            <div className="ref-timeline-container">
              {/* Horizontal Connecting Bar */}
              <div className="ref-connector">
                <div
                  className="ref-connector-fill"
                  style={{ width: getConnectorWidth() }}
                ></div>
              </div>

              {/* Milestone 1: Order Confirmed */}
              <div className="ref-timeline-step">
                <div className={`ref-circle ${tracking.milestones3.orderConfirmed.completed ? 'completed' : tracking.milestones3.orderConfirmed.active ? 'active' : 'pending'}`}>
                  {tracking.milestones3.orderConfirmed.completed ? (
                    <Check size={16} strokeWidth={3.2} />
                  ) : tracking.milestones3.orderConfirmed.active ? (
                    <div className="active-inner-dot"></div>
                  ) : null}
                </div>
                <div className="ref-step-title">{tracking.milestones3.orderConfirmed.title}</div>
                <div className="ref-step-date" title={tracking.milestones3.orderConfirmed.fullDateText}>
                  {tracking.milestones3.orderConfirmed.dateText}
                </div>
              </div>

              {/* Milestone 2: Shipped */}
              <div className="ref-timeline-step">
                <div className={`ref-circle ${tracking.milestones3.shipped.completed ? 'completed' : tracking.milestones3.shipped.active ? 'active' : 'pending'}`}>
                  {tracking.milestones3.shipped.completed ? (
                    <Check size={16} strokeWidth={3.2} />
                  ) : tracking.milestones3.shipped.active ? (
                    <div className="active-inner-dot"></div>
                  ) : null}
                </div>
                <div className="ref-step-title">{tracking.milestones3.shipped.title}</div>
                <div className="ref-step-date" title={tracking.milestones3.shipped.fullDateText}>
                  {tracking.milestones3.shipped.dateText}
                </div>
              </div>

              {/* Milestone 3: Delivery */}
              <div className="ref-timeline-step">
                <div className={`ref-circle ${tracking.milestones3.delivery.completed ? 'completed' : tracking.milestones3.delivery.active ? 'active' : 'pending'}`}>
                  {tracking.milestones3.delivery.completed ? (
                    <Check size={16} strokeWidth={3.2} />
                  ) : tracking.milestones3.delivery.active ? (
                    <div className="active-inner-dot"></div>
                  ) : null}
                </div>
                <div className="ref-step-title">{tracking.milestones3.delivery.title}</div>
                <div className="ref-step-date" title={tracking.milestones3.delivery.fullDateText}>
                  {tracking.milestones3.delivery.dateText}
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              SECTION 2: CURRENT STAGE & RESPONSIBLE DEPARTMENT CARD
              ========================================================================= */}
          <div className="stage-summary-card">
            <div className="stage-summary-item">
              <span className="summary-label">Current Active Stage</span>
              <span className="summary-val">
                <Boxes size={16} color="#18476c" />
                {tracking.currentStageName}
              </span>
            </div>

            <div className="stage-summary-item">
              <span className="summary-label">Responsible Department</span>
              <span className="summary-val">
                <Building size={16} color="#18476c" />
                <span className={`stage-dept-tag dept-${tracking.currentDepartment.toLowerCase()}`}>
                  {tracking.currentDepartment}
                </span>
              </span>
            </div>

            <div className="stage-summary-item">
              <span className="summary-label">Assigned Representative</span>
              <span className="summary-val">
                <User size={16} color="#18476c" />
                {liveEnq.assigned_salesperson || tracking.responsibleEmployee}
              </span>
            </div>

            <div className="stage-summary-item">
              <span className="summary-label">Overall Workflow Status</span>
              <span className="summary-val">
                <CheckCircle2 size={16} color={tracking.progressPercent === 100 ? '#059669' : '#18476c'} />
                {tracking.progressPercent === 100 ? 'Fully Delivered & Closed' : `${tracking.progressPercent}% Completed`}
              </span>
            </div>
          </div>

          {/* =========================================================================
              SECTION 3: DELAYS, PENDING APPROVALS & ROADBLOCK ALERTS (Requirement 4)
              ========================================================================= */}
          {(tracking.pendingApprovals.length > 0 || tracking.blockedStages.length > 0 || tracking.isDelayed) && (
            <div className="alerts-container">
              {tracking.pendingApprovals.map((item, i) => (
                <div key={i} className="tracking-alert warning">
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Pending Approval [{item.type}]:</strong> {item.message}
                    <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '3px' }}>
                      <strong>Action Needed:</strong> {item.actionNeeded} (Responsible: {item.department})
                    </div>
                  </div>
                </div>
              ))}

              {tracking.blockedStages.map((item, i) => (
                <div key={i} className="tracking-alert info">
                  <Clock size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Stage In Progress [{item.type}]:</strong> {item.message}
                    <div style={{ fontSize: '0.78rem', color: '#1e40af', marginTop: '3px' }}>
                      <strong>Action Needed:</strong> {item.actionNeeded}
                    </div>
                  </div>
                </div>
              ))}

              {tracking.isDelayed && (
                <div className="tracking-alert danger">
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Operational Delay Detected:</strong> {tracking.delayReason}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              SECTION 4: TABS (Overview / 15-Stage Lifecycle / Full History Audit Trail)
              ========================================================================= */}
          <div className="tracking-tabs">
            <button
              type="button"
              className={`tracking-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <CheckCircle2 size={15} /> Overview & Specs
            </button>
            <button
              type="button"
              className={`tracking-tab-btn ${activeTab === 'stages' ? 'active' : ''}`}
              onClick={() => setActiveTab('stages')}
            >
              <Boxes size={15} /> Complete 15-Stage Workflow ({tracking.stages.filter(s => s.isCompleted).length}/15)
            </button>
            <button
              type="button"
              className={`tracking-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={15} /> Activity Audit Trail ({timelineData.history.length})
            </button>
          </div>

          {/* TAB 1: OVERVIEW & DOCUMENTS */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {/* Commercial Specs */}
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#18476c', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} /> Commercial & Order Details
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Quotation:</span>
                    <strong style={{ color: '#0f172a' }}>{liveEnq.quotation_no || 'Pending Creation'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Quote Amount:</span>
                    <strong style={{ color: '#18476c' }}>
                      {liveEnq.quotation_amount ? `₹${Number(liveEnq.quotation_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>OPC Number:</span>
                    <strong style={{ color: '#0d9488' }}>{liveEnq.opc_no || 'Pending Generation'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Sales Order No:</span>
                    <strong style={{ color: '#0f172a' }}>{liveEnq.order_no || '—'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>PO Reference:</span>
                    <strong style={{ color: '#0f172a' }}>{liveEnq.po_number || liveEnq.opc_order_reference || '—'}</strong>
                  </div>
                </div>
              </div>

              {/* Fulfilment & Logistics Specs */}
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#18476c', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Truck size={16} /> Warehouse & Logistics Specs
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Stock Status:</span>
                    <span className="status-badge badge-slate" style={{ fontSize: '0.7rem' }}>
                      {liveEnq.opc_status || liveEnq.store_status || 'Pending Verification'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Delivery Challan:</span>
                    <strong style={{ color: '#16a34a' }}>{liveEnq.challan_no || 'Pending Dispatch'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Transporter / Carrier:</span>
                    <strong style={{ color: '#0f172a' }}>{liveEnq.transporter || 'To be scheduled'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Consignment Tracking:</span>
                    <span className="data-code-pill">{liveEnq.tracking_no || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Invoice No:</span>
                    <strong style={{ color: '#059669' }}>{liveEnq.invoice_no || '—'}</strong>
                  </div>
                </div>
              </div>

              {/* Quick Document Links */}
              <div style={{ gridColumn: '1 / -1', background: '#ffffff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                  Generated Order Documents
                </h4>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {liveEnq.quotation_no && (
                    <button
                      type="button"
                      className="dash-btn dash-btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
                      onClick={() => onOpenDocumentModal && onOpenDocumentModal('quotation', liveEnq)}
                    >
                      <Eye size={13} color="#2563eb" /> View Quotation ({liveEnq.quotation_no})
                    </button>
                  )}
                  {liveEnq.opc_no && (
                    <button
                      type="button"
                      className="dash-btn dash-btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem', borderColor: '#99f6e4', color: '#0f766e' }}
                      onClick={() => onOpenDocumentModal && onOpenDocumentModal('opc', liveEnq)}
                    >
                      <FileCheck size={13} color="#0d9488" /> View OPC ({liveEnq.opc_no})
                    </button>
                  )}
                  {liveEnq.order_no && (
                    <button
                      type="button"
                      className="dash-btn dash-btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem', borderColor: '#fde68a', color: '#b45309' }}
                      onClick={() => onOpenDocumentModal && onOpenDocumentModal('order', liveEnq)}
                    >
                      <Eye size={13} color="#d97706" /> View Sales Order ({liveEnq.order_no})
                    </button>
                  )}
                  {liveEnq.challan_no && (
                    <button
                      type="button"
                      className="dash-btn dash-btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem', borderColor: '#bbf7d0', color: '#15803d' }}
                      onClick={() => onOpenDocumentModal && onOpenDocumentModal('challan', liveEnq)}
                    >
                      <Truck size={13} color="#16a34a" /> View Challan ({liveEnq.challan_no})
                    </button>
                  )}
                  {liveEnq.invoice_no && (
                    <button
                      type="button"
                      className="dash-btn dash-btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem', borderColor: '#a7f3d0', color: '#047857' }}
                      onClick={() => onOpenDocumentModal && onOpenDocumentModal('invoice', liveEnq)}
                    >
                      <FileText size={13} color="#059669" /> View Invoice ({liveEnq.invoice_no})
                    </button>
                  )}
                  {liveEnq.pdf_attachment && (
                    <a
                      href={liveEnq.pdf_attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={liveEnq.attachment_name || `${liveEnq.enquiry_no}_attachment.pdf`}
                      className="dash-btn dash-btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem', textDecoration: 'none' }}
                    >
                      <Paperclip size={13} /> Attached Client RFQ PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPLETE 15-STAGE INTERNAL LIFECYCLE TRACKER (Requirements 2 & 3) */}
          {activeTab === 'stages' && (
            <div className="stages-stepper-wrap">
              <div className="stages-progress-bar-row">
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#18476c' }}>
                  Progress: {tracking.progressPercent}% Completed ({tracking.stages.filter(s => s.isCompleted).length} of 15 Milestones)
                </span>
                <div className="progress-track-bg">
                  <div className="progress-track-fill" style={{ width: `${tracking.progressPercent}%` }}></div>
                </div>
              </div>

              <div className="stages-grid">
                {tracking.stages.map((stage) => {
                  const isDone = stage.isCompleted;
                  const isActive = stage.isActive;
                  return (
                    <div
                      key={stage.id}
                      className={`stage-card-node ${isDone ? 'completed' : isActive ? 'active' : 'pending'}`}
                    >
                      <div className="stage-header-row">
                        <div className={`stage-icon-circle ${isDone ? 'completed' : isActive ? 'active' : 'pending'}`}>
                          {isDone ? <Check size={13} strokeWidth={3} /> : stage.id}
                        </div>
                        <span className={`stage-dept-tag dept-${stage.department.toLowerCase()}`}>
                          {stage.department}
                        </span>
                      </div>

                      <div className="stage-name-text">{stage.name}</div>

                      <div className="stage-responsible-text">
                        <strong>Role:</strong> {stage.performedBy || stage.role}
                      </div>

                      {isDone && stage.dateFormatted ? (
                        <div className="stage-time-text">
                          <CheckCircle2 size={11} color="#00873e" style={{ display: 'inline', marginRight: '3px' }} />
                          {stage.dateFormatted}
                        </div>
                      ) : (
                        <div className="stage-time-text" style={{ color: '#94a3b8' }}>
                          <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                          {stage.expectedDate || 'Pending'}
                        </div>
                      )}

                      {stage.notes && (
                        <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '3px', background: 'rgba(255,255,255,0.7)', padding: '3px 5px', borderRadius: '4px' }}>
                          {stage.notes.length > 55 ? `${stage.notes.slice(0, 55)}...` : stage.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: COMPLETE ACTIVITY AUDIT TRAIL (Requirement 4) */}
          {activeTab === 'history' && (
            <div className="history-audit-wrap">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#64748b' }}>
                  Showing complete immutable event log from database for Enquiry <strong>{liveEnq.enquiry_no}</strong>.
                </span>
                <button
                  type="button"
                  onClick={() => fetchTimeline(false)}
                  className="dash-btn dash-btn-secondary"
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.76rem' }}
                >
                  <RefreshCw size={12} /> Refresh History
                </button>
              </div>

              {timelineData.history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  No historical activity records logged in system yet.
                </div>
              ) : (
                timelineData.history.map((h, idx) => (
                  <div key={h.id || idx} className="history-item-row">
                    <div
                      className="history-timeline-bar"
                      style={{
                        background:
                          h.department === 'Reception' ? '#0284c7' :
                          h.department === 'Sales' ? '#2563eb' :
                          h.department === 'Purchase' ? '#d97706' :
                          h.department === 'Store' ? '#7c3aed' :
                          h.department === 'Logistics' ? '#059669' : '#18476c'
                      }}
                    ></div>
                    <div className="history-content">
                      <div className="history-meta-row">
                        <span className="history-action-title">{h.action}</span>
                        <span className="history-time-stamp">
                          <Clock size={12} />
                          {formatDateTime(h.created_at)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span className={`stage-dept-tag dept-${(h.department || 'sales').toLowerCase()}`}>
                          {h.department}
                        </span>
                        <span className="history-user-pill">
                          <User size={12} /> {h.performed_by || 'Department Officer'}
                        </span>
                        {h.status_from && h.status_to && (
                          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {h.status_from} <ArrowRight size={10} style={{ display: 'inline', margin: '0 2px' }} /> <strong>{h.status_to}</strong>
                          </span>
                        )}
                      </div>

                      {h.notes && (
                        <div className="history-notes-box">
                          {h.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER - Admin Controls & Salesperson Assignment */}
        <div className="tracking-modal-footer">
          <form onSubmit={handleAssignSalesperson} className="admin-assign-box">
            <Shield size={16} color="#18476c" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
              Admin Reassign Salesperson:
            </span>
            <select
              value={salespersonInput}
              onChange={(e) => setSalespersonInput(e.target.value)}
              className="assign-select"
            >
              <option value="Sales Lead">Sales Lead</option>
              <option value="Sales Executive">Sales Executive</option>
              <option value="Senior Commercial Manager">Senior Commercial Manager</option>
              <option value="Technical Sales Rep">Technical Sales Rep</option>
            </select>
            <button
              type="submit"
              disabled={assigning}
              className="assign-btn"
            >
              {assigning ? 'Saving...' : 'Update Rep'}
            </button>
            {assignMsg && (
              <span style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 600 }}>
                ✓ {assignMsg}
              </span>
            )}
          </form>

          <button
            type="button"
            className="dash-btn dash-btn-secondary"
            onClick={onClose}
            style={{ padding: '0.45rem 1.15rem' }}
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
}
