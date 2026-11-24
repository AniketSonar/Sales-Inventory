import React, { useState, useEffect, useMemo } from 'react';
import { API_URL } from '../../../config/api';
import DashboardLayout from '../../layout/DashboardLayout';
import { salesConfig } from '../../layout/dashboardConfigs';
import {
  Send,
  FileText,
  Truck,
  CheckCircle2,
  RefreshCw,
  DollarSign,
  Clock,
  ShieldCheck,
  ArrowRight,
  X,
  Wrench,
  Zap,
  Monitor,
  Layers,
  Search,
  Filter,
  Check,
  Paperclip,
  Eye,
  Download,
  PhoneCall,
  Calendar,
  AlertCircle,
  FileCheck,
  PackageCheck,
  History,
  Navigation,
  CheckSquare,
  Edit3
} from 'lucide-react';
import { useLiveSync } from '../../../utils/useLiveSync';

// WhatsApp URL helper
const getWhatsAppUrl = (phone, message) => {
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};
import DocumentModal from '../../common/DocumentModal';
import OpcModal from '../../common/OpcModal';
import {
  buildQuotationPdf,
  buildInvoicePdf,
  buildSalesOrderPdf,
  buildDeliveryChallanPdf,
  buildOpcPdf,
  downloadDocumentPdf
} from '../../../utils/documentGenerator';

export default function SalesDashboard() {
  const [activeTab, setActiveTab] = useState('enquiries');
  const [enquiries, setEnquiries] = useState([]);
  const [msg, setMsg] = useState('');

  // Active Action Modal state
  const [activeAction, setActiveAction] = useState(null); // { type, item }

  // Action form fields
  // 1. Followup / Call Schedule
  const [followupType, setFollowupType] = useState('Call');
  const [scheduledAt, setScheduledAt] = useState('');
  const [seriousness, setSeriousness] = useState('High');
  const [followupNotes, setFollowupNotes] = useState('');

  // 2. Verification & Forward to Purchase
  const [verifyNotes, setVerifyNotes] = useState('');

  // 3. Quotation
  const [sellingPrice, setSellingPrice] = useState('');
  const [discount, setDiscount] = useState('0');

  // 4. Customer PO & Store Handover
  const [poNumber, setPoNumber] = useState('');

  // 5. Stock Inspection
  const [inspectionNotes, setInspectionNotes] = useState('');

  // 6. Transport & Delivery Challan
  const [transportMode, setTransportMode] = useState('Road'); // Road | Air | Water
  const [transporter, setTransporter] = useState('Roadways Express Cargo');
  const [trackingNo, setTrackingNo] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [challanNo, setChallanNo] = useState('');

  // 7. Delivery Confirmation
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Success popup after Quotation / Invoice generated (for WhatsApp share in modal)
  const [successWhatsApp, setSuccessWhatsApp] = useState(null); // { type, phone, message }

  // Document Preview Modal
  const [previewModal, setPreviewModal] = useState({ isOpen: false, type: 'quotation', data: null });

  // OPC Modal state
  const [opcModal, setOpcModal] = useState({ isOpen: false, enquiry: null });

  // Timeline / History Modal
  const [timelineModal, setTimelineModal] = useState({ isOpen: false, item: null, history: [], followups: [], loading: false });

  // Search & Compartment Filter
  const [selectedCompartment, setSelectedCompartment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEnquiries = async () => {
    try {
      const res = await fetch(`${API_URL}/api/enquiries`);
      const data = await res.json();
      if (data.success) {
        setEnquiries(data.data);
      }
    } catch (err) {
      console.error('Error fetching enquiries:', err);
    }
  };

  useLiveSync(fetchEnquiries, 3000);

  // Open Timeline Modal
  const handleOpenTimeline = async (enq) => {
    setTimelineModal({ isOpen: true, item: enq, history: [], followups: [], loading: true });
    try {
      const res = await fetch(`${API_URL}/api/enquiries/${enq.id}/timeline`);
      const data = await res.json();
      if (data.success) {
        setTimelineModal({
          isOpen: true,
          item: enq,
          history: data.data.history || [],
          followups: data.data.followups || [],
          loading: false
        });
      } else {
        setTimelineModal(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error(err);
      setTimelineModal(prev => ({ ...prev, loading: false }));
    }
  };

  // 1. Schedule Call / Meeting and Maintain Client Follow-ups
  const handleScheduleFollowup = async (e) => {
    e.preventDefault();
    if (!activeAction?.item) return;

    try {
      const res = await fetch(`${API_URL}/api/sales/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enquiry_id: activeAction.item.id,
          followup_type: followupType,
          scheduled_at: scheduledAt,
          seriousness,
          notes: followupNotes,
          performed_by: 'Sales Executive'
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Client follow-up & schedule recorded for ${activeAction.item.enquiry_no}!`);
        setActiveAction(null);
        fetchEnquiries();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Verify Client Seriousness & Confirm Requirements -> Forward to Purchase
  const handleVerifyAndForward = async (e) => {
    e.preventDefault();
    if (!activeAction?.item) return;

    try {
      const res = await fetch(`${API_URL}/api/sales/verify-forward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enquiry_id: activeAction.item.id,
          seriousness,
          verification_notes: verifyNotes,
          performed_by: 'Sales Executive'
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Enquiry ${activeAction.item.enquiry_no} verified and forwarded to Purchase Department!`);
        setActiveAction(null);
        fetchEnquiries();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Issue Quotation to Client
  const handleIssueQuotation = async (e) => {
    e.preventDefault();
    if (!activeAction?.item) return;

    try {
      const res = await fetch(`${API_URL}/api/sales/quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enquiry_id: activeAction.item.id,
          selling_price: sellingPrice,
          discount_percent: discount,
          performed_by: 'Sales Executive'
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Quotation ${data.quotation_no} generated and sent to client!`);
        const enq = activeAction.item;
        if (enq.contact_phone) {
          setSuccessWhatsApp({
            type: 'quotation',
            phone: enq.contact_phone,
            message: `Dear ${enq.customer_name}, please find your Quotation *${data.quotation_no}* from NexFlow Systems. Total Amount: ₹${Number(sellingPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}. Please review and confirm at your earliest convenience. Contact: sales@nexflowsystems.com`,
            label: `Quotation ${data.quotation_no}`
          });
        }
        setActiveAction(null);
        fetchEnquiries();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Confirm Customer PO & Forward to Store
  const handleConvertPO = async (e) => {
    e.preventDefault();
    if (!activeAction?.item) return;

    try {
      const res = await fetch(`${API_URL}/api/sales/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enquiry_id: activeAction.item.id,
          po_number: poNumber,
          performed_by: 'Sales Executive'
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Sales Order ${data.order_no} created and approved! Forwarded to Store for Packing.`);
        setActiveAction(null);
        fetchEnquiries();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Verify Stock Readiness
  const handleInspectStock = async (e) => {
    e.preventDefault();
    if (!activeAction?.item) return;

    try {
      const res = await fetch(`${API_URL}/api/sales/inspect-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enquiry_id: activeAction.item.id,
          inspection_notes: inspectionNotes || 'Stock quality, packaging and part quantities verified and approved by Sales.',
          performed_by: 'Sales Executive'
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Stock readiness verified and approved for transportation!`);
        setActiveAction(null);
        fetchEnquiries();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Arrange Transportation (Road/Air/Water) & Issue Delivery Challan
  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!activeAction?.item) return;

    try {
      const res = await fetch(`${API_URL}/api/sales/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enquiry_id: activeAction.item.id,
          invoice_no: invoiceNo,
          transporter,
          tracking_no: trackingNo,
          transport_mode: transportMode,
          challan_no: challanNo,
          performed_by: 'Sales Logistics Desk'
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Transportation arranged via ${data.transport_mode}! Delivery Challan ${data.challan_no} & Invoice ${data.invoice_no} issued.`);
        const enq = activeAction.item;
        if (enq.contact_phone) {
          setSuccessWhatsApp({
            type: 'invoice',
            phone: enq.contact_phone,
            message: `Dear ${enq.customer_name}, your Invoice *${data.invoice_no}* for Order *${enq.order_no}* has been generated by NexFlow Systems. Amount: ₹${Number(enq.quotation_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}. Transport: ${data.transport_mode} | Tracking: ${data.tracking_no || trackingNo}. Delivery Challan: ${data.challan_no}. Thank you for your business!`,
            label: `Invoice ${data.invoice_no}`
          });
        }
        setActiveAction(null);
        fetchEnquiries();
        setTimeout(() => setMsg(''), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 7. Confirm Delivery
  const handleConfirmDelivery = async (e) => {
    e.preventDefault();
    if (!activeAction?.item) return;

    try {
      const res = await fetch(`${API_URL}/api/sales/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enquiry_id: activeAction.item.id,
          delivery_notes: deliveryNotes || 'Consignment delivered to client destination. Goods accepted in full.',
          performed_by: 'Sales Executive'
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Shipment delivered successfully! Order closed in database.`);
        setActiveAction(null);
        fetchEnquiries();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return <span className="status-badge badge-slate">Pending</span>;
    if (status.includes('Delivered')) {
      return <span className="status-badge badge-emerald"><CheckCircle2 size={13} /> Delivered & Closed</span>;
    }
    if (status.includes('Transit') || status.includes('Dispatched')) {
      return <span className="status-badge badge-blue"><Truck size={13} /> {status}</span>;
    }
    if (status.includes('Stock Inspected')) {
      return <span className="status-badge badge-emerald"><CheckSquare size={13} /> Stock Inspected</span>;
    }
    if (status.includes('Ready for Sales Inspection')) {
      return <span className="status-badge badge-amber"><PackageCheck size={13} /> Store Packed - Inspect Stock</span>;
    }
    if (status.includes('Approved - Forwarded to Store')) {
      return <span className="status-badge badge-blue"><FileCheck size={13} /> OPC Sent to Store</span>;
    }
    if (status.includes('OPC Stock Verified')) {
      return <span className="status-badge badge-blue"><ShieldCheck size={13} /> OPC Stock Verified</span>;
    }
    if (status.includes('OPC Pending Approval')) {
      return <span className="status-badge badge-amber"><Clock size={13} /> OPC Pending Approval</span>;
    }
    if (status.includes('OPC Draft')) {
      return <span className="status-badge badge-slate"><FileText size={13} /> OPC Draft</span>;
    }
    if (status.includes('Quotation Sent')) {
      return <span className="status-badge badge-blue"><Send size={13} /> Quote Sent</span>;
    }
    if (status.includes('Cost Estimated')) {
      return <span className="status-badge badge-emerald"><DollarSign size={13} /> Cost Received</span>;
    }
    if (status.includes('Forwarded to Purchase')) {
      return <span className="status-badge badge-slate"><Clock size={13} /> At Purchase</span>;
    }
    if (status.includes('Follow-up')) {
      return <span className="status-badge badge-amber"><PhoneCall size={13} /> Sales Follow-up</span>;
    }
    if (status.includes('New -')) {
      return <span className="status-badge badge-amber" style={{ fontWeight: 700 }}><AlertCircle size={13} /> New Lead</span>;
    }
    return <span className="status-badge badge-slate">{status}</span>;
  };

  // Compartment Configurations
  const compartments = [
    {
      id: 'mechanical',
      name: 'Mechanical',
      fullTitle: 'Mechanical Compartment Requirements',
      shortTitle: 'Mechanical',
      description: 'Valves, actuators, industrial pumps, gearboxes, bearings, flanges & hardware',
      icon: Wrench,
      matcher: (category) => (category || '').toLowerCase().includes('mech')
    },
    {
      id: 'electrical',
      name: 'Electrical',
      fullTitle: 'Electrical Compartment Requirements',
      shortTitle: 'Electrical',
      description: 'Transformers, switchgear, relays, power distribution panels, cables & sensors',
      icon: Zap,
      matcher: (category) => (category || '').toLowerCase().includes('elect')
    },
    {
      id: 'computer',
      name: 'Computer / IT',
      fullTitle: 'Computer / IT Compartment Requirements',
      shortTitle: 'Computer / IT',
      description: 'Rack servers, enterprise storage, network switches, routers & workstation parts',
      icon: Monitor,
      matcher: (category) => {
        const c = (category || '').toLowerCase();
        return c.includes('comp') || c.includes('it');
      }
    }
  ];

  // Lifecycle stage filtering from navbar activeTab
  const lifecycleFilteredEnquiries = useMemo(() => {
    let list = enquiries;

    if (activeTab === 'enquiries') {
      // 1. All new enquiries received directly from reception, scheduling follow-ups, seriousness verification
      list = list.filter(e => 
        e.status?.includes('New -') || 
        e.status?.includes('Follow-up') || 
        e.status?.includes('Verified - Forwarded') ||
        !e.supplier_cost
      );
    } else if (activeTab === 'quotations') {
      // 2. Cost quotes received from purchase -> quotation generation and client approval follow-up
      list = list.filter(e => e.supplier_cost && !e.order_no);
    } else if (activeTab === 'customer-pos') {
      // 3. Customer POs, OPCs, and forwarding approved enquiries to Store
      list = list.filter(e => (e.quotation_no || e.opc_no) && !e.dispatch_status?.includes('Delivered'));
    } else if (activeTab === 'transport') {
      // 4. Transportation (Road, Air, Water), Delivery Challan, and tracking until delivery
      list = list.filter(e => e.order_no || e.store_status?.includes('Packed') || e.challan_no);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        (e.enquiry_no && e.enquiry_no.toLowerCase().includes(q)) ||
        (e.customer_name && e.customer_name.toLowerCase().includes(q)) ||
        (e.part_code && e.part_code.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q)) ||
        (e.challan_no && e.challan_no.toLowerCase().includes(q)) ||
        (e.opc_no && e.opc_no.toLowerCase().includes(q))
      );
    }

    return list;
  }, [enquiries, activeTab, searchQuery]);

  // Grouped by Compartment
  const compartmentData = useMemo(() => {
    const mechanicalList = lifecycleFilteredEnquiries.filter(e => compartments[0].matcher(e.category));
    const electricalList = lifecycleFilteredEnquiries.filter(e => compartments[1].matcher(e.category));
    const computerList = lifecycleFilteredEnquiries.filter(e => compartments[2].matcher(e.category));
    const otherList = lifecycleFilteredEnquiries.filter(e =>
      !compartments[0].matcher(e.category) &&
      !compartments[1].matcher(e.category) &&
      !compartments[2].matcher(e.category)
    );

    return {
      mechanical: mechanicalList,
      electrical: electricalList,
      computer: computerList,
      other: otherList
    };
  }, [lifecycleFilteredEnquiries]);

  // Render Table for a Compartment
  const renderCompartmentTable = (items, compartmentInfo) => {
    const IconComponent = compartmentInfo.icon;
    return (
      <div className="dash-card" key={compartmentInfo.id} style={{ padding: '22px', marginBottom: '24px' }}>
        {/* Compartment Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#edf4f9',
                border: '1px solid #cbdce8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#18476c'
              }}
            >
              <IconComponent size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, padding: 0, border: 'none', fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>
                {compartmentInfo.fullTitle}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                {compartmentInfo.description}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="status-badge"
              style={{
                background: '#edf4f9',
                border: '1px solid #cbdce8',
                color: '#18476c',
                fontWeight: 700,
                fontSize: '0.78rem',
                padding: '4px 10px'
              }}
            >
              {items.length} {items.length === 1 ? 'Requirement' : 'Requirements'}
            </span>
          </div>
        </div>

        {/* Compartment Table */}
        <div className="dash-table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Enquiry Ref</th>
                <th>Customer & Seriousness</th>
                <th>Item / Part Code</th>
                <th>Purchase Cost</th>
                <th>Quotation Total</th>
                <th>Order & Transport</th>
                <th>Workflow Status</th>
                <th style={{ textAlign: 'right', paddingRight: '20px' }}>Sales Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No {compartmentInfo.name} requirements in this stage.
                  </td>
                </tr>
              ) : (
                items.map(enq => (
                  <tr key={enq.id}>
                    <td>
                      <span className="data-code-pill">{enq.enquiry_no}</span>
                      <button
                        type="button"
                        onClick={() => handleOpenTimeline(enq)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          marginTop: '4px',
                          padding: '2px 6px',
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          color: '#18476c',
                          cursor: 'pointer'
                        }}
                        title="View Full Handover Audit Trail"
                      >
                        <History size={11} /> Trail
                      </button>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.88rem' }}>{enq.customer_name}</strong>
                      <span style={{ fontSize: '0.74rem', color: '#64748b' }}>{enq.contact_email || enq.contact_phone || 'Direct Lead'}</span>
                      <div style={{ marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span className={`status-badge ${
                          enq.client_seriousness === 'High' || enq.client_seriousness === 'Verified' ? 'badge-emerald' : 'badge-amber'
                        }`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                          Seriousness: {enq.client_seriousness || 'Pending'}
                        </span>
                        {enq.meeting_schedule && (
                          <span style={{ fontSize: '0.68rem', color: '#0369a1', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <Calendar size={10} /> {enq.meeting_schedule}
                          </span>
                        )}
                      </div>
                      {enq.pdf_attachment && (
                        <div style={{ marginTop: '3px' }}>
                          <a
                            href={enq.pdf_attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={enq.attachment_name || `${enq.enquiry_no}_attachment.pdf`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 7px',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '4px',
                              color: '#1d4ed8',
                              textDecoration: 'none',
                              fontSize: '0.72rem',
                              fontWeight: 600
                            }}
                          >
                            <Paperclip size={11} /> {enq.attachment_name || 'Attached PDF'}
                          </a>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{enq.part_code}</span>
                        <span className="status-badge badge-slate" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>×{enq.quantity}</span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#18476c', fontWeight: 600 }}>{enq.category}</span>
                    </td>
                    <td>
                      {enq.supplier_cost ? (
                        <div>
                          <span style={{ color: '#18476c', fontWeight: 700, fontSize: '0.92rem' }}>
                            ₹{Number(enq.supplier_cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>
                            {enq.availability || 'Available'} ({enq.lead_time_days || 3}d)
                          </div>
                        </div>
                      ) : (
                        <span className="status-badge badge-slate" style={{ fontSize: '0.72rem' }}>Awaiting Cost</span>
                      )}
                    </td>
                    <td>
                      {enq.quotation_amount ? (
                        <div>
                          <strong style={{ color: '#18476c', fontSize: '0.92rem' }}>₹{Number(enq.quotation_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{enq.quotation_no}</div>
                          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
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
                            >
                              <Eye size={10} color="#2563eb" /> View
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadDocumentPdf(buildQuotationPdf(enq), `Quotation-${enq.quotation_no}.pdf`)}
                              style={{
                                padding: '2px 5px',
                                background: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                cursor: 'pointer'
                              }}
                            >
                              <Download size={10} />
                            </button>
                            {enq.contact_phone && (
                              <a
                                href={getWhatsAppUrl(enq.contact_phone, `Dear ${enq.customer_name}, please find your Quotation *${enq.quotation_no}* from NexFlow Systems. Total Amount: ₹${Number(enq.quotation_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}. Please review and confirm at your earliest convenience. Contact: sales@nexflowsystems.com`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Send Quotation on WhatsApp"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  padding: '2px 6px',
                                  background: '#dcfce7',
                                  border: '1px solid #86efac',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  color: '#15803d',
                                  textDecoration: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                💬 WA
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td>
                      {enq.order_no || enq.opc_no ? (
                        <div>
                          {enq.order_no && (
                            <>
                              <span style={{ color: '#18476c', fontWeight: 700, fontSize: '0.85rem' }}>{enq.order_no}</span>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>PO: {enq.po_number || enq.opc_order_reference}</div>
                            </>
                          )}
                          {enq.opc_no && (
                            <div style={{ marginTop: '4px', padding: '4px 6px', background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                                <span style={{ color: '#0f766e', fontWeight: 700, fontSize: '0.74rem' }}>{enq.opc_no}</span>
                                <span className={`status-badge ${
                                  enq.opc_status === 'Draft' ? 'badge-slate' :
                                  enq.opc_status === 'Pending Approval' ? 'badge-amber' :
                                  enq.opc_status === 'Approved' || enq.opc_status === 'Sent to Store' ? 'badge-blue' :
                                  'badge-emerald'
                                }`} style={{ fontSize: '0.62rem', padding: '1px 4px' }}>
                                  {enq.opc_status}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: '3px', marginTop: '3px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => setPreviewModal({ isOpen: true, type: 'opc', data: enq })}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                    padding: '1px 5px',
                                    background: '#ffffff',
                                    border: '1px solid #99f6e4',
                                    borderRadius: '3px',
                                    fontSize: '0.66rem',
                                    fontWeight: 600,
                                    color: '#0f766e',
                                    cursor: 'pointer'
                                  }}
                                  title="View OPC Document"
                                >
                                  <Eye size={9} /> View OPC
                                </button>
                                <button
                                  type="button"
                                  onClick={() => downloadDocumentPdf(buildOpcPdf(enq), `OPC-${enq.opc_no}.pdf`)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '1px 4px',
                                    background: '#ffffff',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '3px',
                                    fontSize: '0.66rem',
                                    cursor: 'pointer'
                                  }}
                                  title="Download OPC PDF"
                                >
                                  <Download size={9} />
                                </button>
                                {(enq.opc_status === 'Draft' || enq.opc_status === 'Pending Approval') && (
                                  <button
                                    type="button"
                                    onClick={() => setOpcModal({ isOpen: true, enquiry: enq })}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                      padding: '1px 5px',
                                      background: '#fffbeb',
                                      border: '1px solid #fde68a',
                                      borderRadius: '3px',
                                      fontSize: '0.66rem',
                                      fontWeight: 600,
                                      color: '#b45309',
                                      cursor: 'pointer'
                                    }}
                                    title="Edit OPC Details"
                                  >
                                    <Edit3 size={9} /> Edit
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                          {enq.transport_mode && (
                            <div style={{ marginTop: '2px' }}>
                              <span className="status-badge badge-blue" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                                Mode: {enq.transport_mode}
                              </span>
                            </div>
                          )}
                          {enq.challan_no && (
                            <div style={{ display: 'flex', gap: '3px', marginTop: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => setPreviewModal({ isOpen: true, type: 'challan', data: enq })}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  padding: '2px 6px',
                                  background: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  borderRadius: '4px',
                                  fontSize: '0.68rem',
                                  color: '#15803d',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                                title="View Delivery Challan"
                              >
                                <Truck size={10} /> Challan: {enq.challan_no}
                              </button>
                              {enq.contact_phone && (
                                <a
                                  href={getWhatsAppUrl(enq.contact_phone, `Dear ${enq.customer_name}, your Invoice *${enq.invoice_no || ''}* for Order *${enq.order_no}* has been generated by NexFlow Systems. Amount: ₹${Number(enq.quotation_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}. Transport: ${enq.transport_mode || 'Road'} | Tracking: ${enq.tracking_no || 'N/A'}. Delivery Challan: ${enq.challan_no}. Thank you for your business!`)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Send Invoice on WhatsApp"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: '2px 6px',
                                    background: '#dcfce7',
                                    border: '1px solid #86efac',
                                    borderRadius: '4px',
                                    fontSize: '0.68rem',
                                    fontWeight: 600,
                                    color: '#15803d',
                                    textDecoration: 'none',
                                    cursor: 'pointer'
                                  }}
                                >
                                  💬 WA Invoice
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td>
                      {getStatusBadge(enq.status)}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                        {/* 1. Schedule Call / Followup */}
                        {(!enq.order_no && !enq.status?.includes('Dispatched') && !enq.status?.includes('Delivered')) && (
                          <button
                            className="dash-btn dash-btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => {
                              setActiveAction({ type: 'FOLLOWUP', item: enq });
                              setFollowupType('Call');
                              setSeriousness(enq.client_seriousness || 'High');
                              setScheduledAt(enq.meeting_schedule || '');
                              setFollowupNotes(enq.verification_notes || '');
                            }}
                          >
                            <PhoneCall size={12} /> Schedule / Follow-up
                          </button>
                        )}

                        {/* 2. Verify Seriousness & Forward to Purchase */}
                        {(!enq.supplier_cost && !enq.status?.includes('Forwarded to Purchase')) && (
                          <button
                            className="dash-btn"
                            style={{ padding: '4px 8px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#0284c7', borderColor: '#0284c7' }}
                            onClick={() => {
                              setActiveAction({ type: 'VERIFY_FORWARD', item: enq });
                              setSeriousness('High');
                              setVerifyNotes('Client seriousness confirmed via technical review. Forwarding to Purchase.');
                            }}
                          >
                            <ShieldCheck size={12} /> Verify & Forward to Purchase
                          </button>
                        )}

                        {/* 3. Issue Quotation (Once cost estimated by Purchase) */}
                        {enq.supplier_cost && !enq.quotation_no && (
                          <button
                            className="dash-btn"
                            style={{ padding: '4px 8px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => {
                              setActiveAction({ type: 'QUOTE', item: enq });
                              setSellingPrice(Number(enq.supplier_cost * 1.3).toFixed(2));
                            }}
                          >
                            <Send size={12} /> Generate Quotation
                          </button>
                        )}

                        {/* 4. Client Confirmed Quotation -> Generate / Manage OPC before Forwarding to Store */}
                        {enq.quotation_no && !enq.opc_no && (
                          <button
                            className="dash-btn"
                            style={{ padding: '4px 8px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#0d9488', borderColor: '#0d9488', color: '#ffffff' }}
                            onClick={() => setOpcModal({ isOpen: true, enquiry: enq })}
                          >
                            <FileText size={12} /> Client Approved → Generate OPC
                          </button>
                        )}

                        {enq.opc_no && (enq.opc_status === 'Draft' || enq.opc_status === 'Pending Approval') && (
                          <button
                            className="dash-btn dash-btn-amber"
                            style={{ padding: '4px 8px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => setOpcModal({ isOpen: true, enquiry: enq })}
                          >
                            <ShieldCheck size={12} /> {enq.opc_status === 'Draft' ? 'Review & Submit OPC' : 'Approve OPC & Forward to Store'}
                          </button>
                        )}

                        {/* 5. Store Packed -> Verify Stock Readiness */}
                        {enq.order_no && enq.store_status?.includes('Packed') && enq.inspection_status !== 'Stock Inspected & Approved' && (
                          <button
                            className="dash-btn"
                            style={{ padding: '4px 8px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#7c3aed', borderColor: '#7c3aed' }}
                            onClick={() => {
                              setActiveAction({ type: 'INSPECT', item: enq });
                              setInspectionNotes('Physical warehouse inspection passed. Stock verified and ready for transport.');
                            }}
                          >
                            <CheckSquare size={12} /> Inspect Stock Readiness
                          </button>
                        )}

                        {/* 6. Arrange Transportation & Delivery Challan */}
                        {enq.order_no && enq.inspection_status === 'Stock Inspected & Approved' && !enq.status?.includes('Transit') && !enq.status?.includes('Delivered') && (
                          <button
                            className="dash-btn dash-btn-emerald"
                            style={{ padding: '4px 8px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => {
                              setActiveAction({ type: 'DISPATCH', item: enq });
                              setTransportMode('Road');
                              setInvoiceNo(`INV-${Math.floor(10000 + Math.random() * 90000)}`);
                              setTrackingNo(`TRK-EXP-${Math.floor(100000 + Math.random() * 900000)}`);
                              setChallanNo(`DC-${Math.floor(1000 + Math.random() * 9000)}`);
                            }}
                          >
                            <Truck size={12} /> Arrange Transport & Challan
                          </button>
                        )}

                        {/* 7. Confirm Delivery */}
                        {enq.status?.includes('Transit') && (
                          <button
                            className="dash-btn"
                            style={{ padding: '4px 8px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#059669', borderColor: '#059669' }}
                            onClick={() => {
                              setActiveAction({ type: 'DELIVER', item: enq });
                              setDeliveryNotes('Delivered to client dock. Receipt confirmed by client.');
                            }}
                          >
                            <CheckCircle2 size={12} /> Confirm Delivery
                          </button>
                        )}

                        {enq.status?.includes('Delivered') && (
                          <span style={{ color: '#059669', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={14} /> Completed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout
      config={salesConfig}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {/* Header */}
      <div className="dash-view-header">
        <div>
          <h2>Sales Commercial & Fulfilment Hub</h2>
          <p>End-to-end sales lifecycle: Client meetings, verification, cost quotations, store order handover, transport & delivery challans.</p>
        </div>
        <button
          onClick={fetchEnquiries}
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

      {/* WhatsApp Share Popup after Quotation / Invoice generated */}
      {successWhatsApp && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#14532d', padding: '14px 18px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            💬 {successWhatsApp.label} generated!
          </span>
          <span style={{ fontSize: '0.84rem', color: '#166534' }}>Send it to the client on WhatsApp?</span>
          <a
            href={getWhatsAppUrl(successWhatsApp.phone, successWhatsApp.message)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '6px 14px', background: '#16a34a', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 700, fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            💬 Send on WhatsApp
          </a>
          <button
            type="button"
            onClick={() => setSuccessWhatsApp(null)}
            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '1rem', padding: '2px 6px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* TOP COMPARTMENT KPI OVERVIEW ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '22px' }}>
        {/* Mechanical KPI */}
        <div
          onClick={() => setSelectedCompartment(selectedCompartment === 'mechanical' ? 'all' : 'mechanical')}
          className="dash-card"
          style={{
            padding: '18px 20px',
            margin: 0,
            cursor: 'pointer',
            border: selectedCompartment === 'mechanical' ? '1px solid #18476c' : '1px solid #cbdce8',
            borderTop: '4px solid #18476c',
            background: selectedCompartment === 'mechanical' ? '#edf4f9' : '#ffffff',
            transition: 'all 0.18s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#edf4f9', border: '1px solid #cbdce8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#18476c' }}>
                <Wrench size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Mechanical</span>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Industrial Valves, Pumps & Parts</div>
              </div>
            </div>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#18476c' }}>
              {compartmentData.mechanical.length}
            </span>
          </div>
        </div>

        {/* Electrical KPI */}
        <div
          onClick={() => setSelectedCompartment(selectedCompartment === 'electrical' ? 'all' : 'electrical')}
          className="dash-card"
          style={{
            padding: '18px 20px',
            margin: 0,
            cursor: 'pointer',
            border: selectedCompartment === 'electrical' ? '1px solid #18476c' : '1px solid #cbdce8',
            borderTop: '4px solid #334155',
            background: selectedCompartment === 'electrical' ? '#edf4f9' : '#ffffff',
            transition: 'all 0.18s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                <Zap size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Electrical</span>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Transformers & Switchgear</div>
              </div>
            </div>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#334155' }}>
              {compartmentData.electrical.length}
            </span>
          </div>
        </div>

        {/* Computer / IT KPI */}
        <div
          onClick={() => setSelectedCompartment(selectedCompartment === 'computer' ? 'all' : 'computer')}
          className="dash-card"
          style={{
            padding: '18px 20px',
            margin: 0,
            cursor: 'pointer',
            border: selectedCompartment === 'computer' ? '1px solid #18476c' : '1px solid #cbdce8',
            borderTop: '4px solid #0f172a',
            background: selectedCompartment === 'computer' ? '#edf4f9' : '#ffffff',
            transition: 'all 0.18s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
                <Monitor size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Computer / IT</span>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Servers, Storage & Switches</div>
              </div>
            </div>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
              {compartmentData.computer.length}
            </span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 600 }}>Filter Compartment:</span>
          {['all', 'mechanical', 'electrical', 'computer'].map(comp => (
            <button
              key={comp}
              type="button"
              onClick={() => setSelectedCompartment(comp)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: selectedCompartment === comp ? '1px solid #18476c' : '1px solid #cbd5e1',
                background: selectedCompartment === comp ? '#18476c' : '#ffffff',
                color: selectedCompartment === comp ? '#ffffff' : '#334155'
              }}
            >
              {comp.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: '260px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search part code, customer, challan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: '32px',
              paddingRight: '12px',
              fontSize: '0.84rem',
              width: '100%',
              borderRadius: '8px'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* COMPARTMENTS LIST SECTIONS */}
      {selectedCompartment === 'all' && (
        <div className="compartments-separated-wrapper">
          {renderCompartmentTable(compartmentData.mechanical, compartments[0])}
          {renderCompartmentTable(compartmentData.electrical, compartments[1])}
          {renderCompartmentTable(compartmentData.computer, compartments[2])}
          {compartmentData.other.length > 0 && (
            renderCompartmentTable(compartmentData.other, {
              id: 'other',
              name: 'General',
              fullTitle: 'General / Other Requirements',
              shortTitle: 'General',
              description: 'Custom products and general engineering items',
              icon: Layers
            })
          )}
        </div>
      )}

      {selectedCompartment === 'mechanical' && renderCompartmentTable(compartmentData.mechanical, compartments[0])}
      {selectedCompartment === 'electrical' && renderCompartmentTable(compartmentData.electrical, compartments[1])}
      {selectedCompartment === 'computer' && renderCompartmentTable(compartmentData.computer, compartments[2])}

      {/* ACTION MODALS */}
      {activeAction && (
        <div className="modal-backdrop">
          <div className="modal-dialog animate-fade" style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {activeAction.type === 'FOLLOWUP' && <PhoneCall size={20} color="#18476c" />}
                {activeAction.type === 'VERIFY_FORWARD' && <ShieldCheck size={20} color="#0284c7" />}
                {activeAction.type === 'QUOTE' && <Send size={20} color="#18476c" />}
                {activeAction.type === 'PO' && <FileCheck size={20} color="#d97706" />}
                {activeAction.type === 'INSPECT' && <CheckSquare size={20} color="#7c3aed" />}
                {activeAction.type === 'DISPATCH' && <Truck size={20} color="#059669" />}
                {activeAction.type === 'DELIVER' && <CheckCircle2 size={20} color="#059669" />}
                <h3 style={{ margin: 0, padding: 0, border: 'none', fontSize: '1.15rem' }}>
                  {activeAction.type === 'FOLLOWUP' && `Schedule Call / Follow-up: ${activeAction.item.enquiry_no}`}
                  {activeAction.type === 'VERIFY_FORWARD' && `Verify Seriousness & Forward to Purchase`}
                  {activeAction.type === 'QUOTE' && `Issue Quotation: ${activeAction.item.enquiry_no}`}
                  {activeAction.type === 'PO' && `Confirm PO & Forward to Store`}
                  {activeAction.type === 'INSPECT' && `Verify Stock Readiness`}
                  {activeAction.type === 'DISPATCH' && `Arrange Transport & Issue Delivery Challan`}
                  {activeAction.type === 'DELIVER' && `Confirm Shipment Delivery`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveAction(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 1. Schedule Call / Followup Form */}
            {activeAction.type === 'FOLLOWUP' && (
              <form onSubmit={handleScheduleFollowup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.86rem' }}>
                  Client: <strong>{activeAction.item.customer_name}</strong> | Item: <strong>{activeAction.item.part_code}</strong> ({activeAction.item.category})
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Follow-up Type</label>
                    <select value={followupType} onChange={e => setFollowupType(e.target.value)} style={{ width: '100%' }}>
                      <option value="Phone Call">Phone Call</option>
                      <option value="Client Meeting (In-Person)">Client Meeting (In-Person)</option>
                      <option value="Video Conference">Video Conference</option>
                      <option value="Email Communication">Email Communication</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Client Seriousness</label>
                    <select value={seriousness} onChange={e => setSeriousness(e.target.value)} style={{ width: '100%' }}>
                      <option value="High (Ready to Order)">High (Ready to Order)</option>
                      <option value="Medium (Evaluating Options)">Medium (Evaluating Options)</option>
                      <option value="Low (Casual Enquiry)">Low (Casual Enquiry)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Schedule Date / Time</label>
                  <input
                    type="text"
                    placeholder="e.g. Tomorrow 11:30 AM or 18-Nov-2026"
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Follow-up Discussion Notes</label>
                  <textarea
                    rows="3"
                    placeholder="Discussed requirements, technical constraints, timeline..."
                    value={followupNotes}
                    onChange={e => setFollowupNotes(e.target.value)}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button type="submit" className="dash-btn" style={{ flex: 1 }}>
                    Save Follow-up & Schedule
                  </button>
                  <button type="button" className="dash-btn dash-btn-secondary" onClick={() => setActiveAction(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* 2. Verify Seriousness & Forward to Purchase */}
            {activeAction.type === 'VERIFY_FORWARD' && (
              <form onSubmit={handleVerifyAndForward} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '0.86rem', color: '#64748b', background: '#f0f9ff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  Confirming requirements for <strong style={{ color: '#0369a1' }}>{activeAction.item.customer_name}</strong> ({activeAction.item.part_code} × {activeAction.item.quantity}). Once confirmed, the enquiry will be routed to the <strong>Purchase Department</strong> for cost calculation.
                </p>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Client Seriousness Level *</label>
                  <select value={seriousness} onChange={e => setSeriousness(e.target.value)} style={{ width: '100%' }}>
                    <option value="High (Verified Serious Buyer)">High (Verified Serious Buyer)</option>
                    <option value="Confirmed Budgeted Project">Confirmed Budgeted Project</option>
                    <option value="Urgent Procurement Requirement">Urgent Procurement Requirement</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Technical & Requirement Verification Notes *</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Client specifications confirmed, delivery location verified, ready for vendor cost estimation..."
                    value={verifyNotes}
                    onChange={e => setVerifyNotes(e.target.value)}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button type="submit" className="dash-btn" style={{ flex: 1, background: '#0284c7', borderColor: '#0284c7' }}>
                    <ShieldCheck size={16} /> Confirm Requirements & Forward to Purchase
                  </button>
                  <button type="button" className="dash-btn dash-btn-secondary" onClick={() => setActiveAction(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* 3. Issue Quotation Form */}
            {activeAction.type === 'QUOTE' && (
              <form onSubmit={handleIssueQuotation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.88rem', color: '#64748b', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  Customer: <strong>{activeAction.item.customer_name}</strong> | Supplier Cost: <strong style={{ color: '#059669' }}>₹{activeAction.item.supplier_cost}</strong> | Lead time: <strong>{activeAction.item.lead_time_days || 3} days</strong>.
                </p>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Selling Price per Unit (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={sellingPrice}
                    onChange={e => setSellingPrice(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Discount Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={e => setDiscount(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewModal({
                      isOpen: true,
                      type: 'quotation',
                      data: {
                        ...activeAction.item,
                        selling_price: parseFloat(sellingPrice) || 0,
                        discount_percent: parseFloat(discount) || 0,
                        quotation_no: `QT-PREVIEW-${activeAction.item.enquiry_no ? activeAction.item.enquiry_no.replace('ENQ-', '') : '001'}`
                      }
                    })}
                    className="dash-btn dash-btn-secondary"
                  >
                    <Eye size={15} /> Preview PDF
                  </button>
                  <button type="submit" className="dash-btn" style={{ flex: 1 }}>
                    Send Quotation to Client
                  </button>
                  <button type="button" className="dash-btn dash-btn-secondary" onClick={() => setActiveAction(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* 4. PO Verification & Store Forwarding */}
            {activeAction.type === 'PO' && (
              <form onSubmit={handleConvertPO} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.88rem', color: '#64748b', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  Client <strong>{activeAction.item.customer_name}</strong> approved quotation <strong>{activeAction.item.quotation_no}</strong>. Confirming order will route it directly to <strong>Store Department</strong> for picking and packing.
                </p>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Customer Purchase Order (PO) Number *</label>
                  <input
                    type="text"
                    required
                    value={poNumber}
                    onChange={e => setPoNumber(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" className="dash-btn dash-btn-amber" style={{ flex: 1 }}>
                    <FileCheck size={16} /> Confirm & Forward to Store
                  </button>
                  <button type="button" className="dash-btn dash-btn-secondary" onClick={() => setActiveAction(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* 5. Stock Readiness Inspection */}
            {activeAction.type === 'INSPECT' && (
              <form onSubmit={handleInspectStock} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.88rem', color: '#64748b', background: '#faf5ff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                  Store Department has packed the goods for Order <strong>{activeAction.item.order_no}</strong>. Verify physical stock readiness prior to arranging carrier transport.
                </p>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Inspection Verification Notes</label>
                  <textarea
                    rows="3"
                    value={inspectionNotes}
                    onChange={e => setInspectionNotes(e.target.value)}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button type="submit" className="dash-btn" style={{ flex: 1, background: '#7c3aed', borderColor: '#7c3aed' }}>
                    <CheckSquare size={16} /> Approve Stock for Transportation
                  </button>
                  <button type="button" className="dash-btn dash-btn-secondary" onClick={() => setActiveAction(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* 6. Arrange Transportation (Road, Air, Water) & Delivery Challan */}
            {activeAction.type === 'DISPATCH' && (
              <form onSubmit={handleDispatch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: '#ecfdf5', padding: '10px 14px', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '0.86rem', color: '#065f46' }}>
                  Arrange transportation according to client requirements (<strong>Road, Air, Water</strong>) and generate official Delivery Challan.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Transportation Mode * (Required)
                    </label>
                    <select
                      value={transportMode}
                      onChange={e => {
                        setTransportMode(e.target.value);
                        if (e.target.value === 'Air') setTransporter('Air Cargo Freight Direct');
                        else if (e.target.value === 'Water') setTransporter('Maritime Coastal Logistics');
                        else setTransporter('Roadways Express Cargo');
                      }}
                      style={{ width: '100%', fontWeight: 700, color: '#18476c' }}
                    >
                      <option value="Road">Road (Truck / Surface Cargo)</option>
                      <option value="Air">Air (Air Freight Express)</option>
                      <option value="Water">Water (Coastal / Inland Waterways)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Delivery Challan No *
                    </label>
                    <input
                      type="text"
                      required
                      value={challanNo}
                      onChange={e => setChallanNo(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Transporter / Carrier *
                    </label>
                    <input
                      type="text"
                      required
                      value={transporter}
                      onChange={e => setTransporter(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Tracking / Consignment No *
                    </label>
                    <input
                      type="text"
                      required
                      value={trackingNo}
                      onChange={e => setTrackingNo(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNo}
                    onChange={e => setInvoiceNo(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewModal({
                      isOpen: true,
                      type: 'challan',
                      data: {
                        ...activeAction.item,
                        transport_mode: transportMode,
                        challan_no: challanNo,
                        transporter,
                        tracking_no: trackingNo,
                        invoice_no: invoiceNo
                      }
                    })}
                    className="dash-btn dash-btn-secondary"
                  >
                    <Eye size={15} /> Preview Delivery Challan PDF
                  </button>
                  <button type="submit" className="dash-btn dash-btn-emerald" style={{ flex: 1 }}>
                    <Truck size={15} /> Dispatch Shipment & Issue Challan
                  </button>
                  <button type="button" className="dash-btn dash-btn-secondary" onClick={() => setActiveAction(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* 7. Confirm Delivery Form */}
            {activeAction.type === 'DELIVER' && (
              <form onSubmit={handleConfirmDelivery} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '0.88rem', color: '#64748b', background: '#ecfdf5', padding: '10px 14px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  Confirming delivery for Order <strong>{activeAction.item.order_no}</strong> shipped via <strong>{activeAction.item.transport_mode || 'Road'}</strong> (Challan #{activeAction.item.challan_no}).
                </p>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Delivery Confirmation & Acknowledgment Notes
                  </label>
                  <textarea
                    rows="3"
                    value={deliveryNotes}
                    onChange={e => setDeliveryNotes(e.target.value)}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button type="submit" className="dash-btn" style={{ flex: 1, background: '#059669', borderColor: '#059669' }}>
                    <CheckCircle2 size={16} /> Confirm Delivery & Close Order
                  </button>
                  <button type="button" className="dash-btn dash-btn-secondary" onClick={() => setActiveAction(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FULL ENQUIRY HANDOVER AUDIT TRAIL MODAL */}
      {timelineModal.isOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog animate-fade" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={20} color="#18476c" />
                <h3 style={{ margin: 0, padding: 0, border: 'none', fontSize: '1.15rem' }}>
                  Audit Trail & History: {timelineModal.item?.enquiry_no}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTimelineModal({ isOpen: false, item: null, history: [], followups: [], loading: false })}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
              {timelineModal.loading ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Loading history trail...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {timelineModal.history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No history records logged yet.</div>
                  ) : (
                    timelineModal.history.map((h, i) => (
                      <div
                        key={h.id || i}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '12px 14px',
                          borderLeft: `4px solid ${
                            h.department === 'Reception' ? '#0891b2' :
                            h.department === 'Purchase' ? '#d97706' :
                            h.department === 'Store' ? '#7c3aed' : '#059669'
                          }`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{h.action}</span>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {new Date(h.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                          <span className="status-badge badge-slate" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                            Dept: {h.department}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#475569' }}>By: {h.performed_by}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155' }}>{h.notes}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
              <button
                type="button"
                className="dash-btn dash-btn-secondary"
                onClick={() => setTimelineModal({ isOpen: false, item: null, history: [], followups: [], loading: false })}
              >
                Close Trail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Document Preview Modal */}
      <DocumentModal
        isOpen={previewModal.isOpen}
        type={previewModal.type}
        data={previewModal.data}
        onClose={() => setPreviewModal({ isOpen: false, type: 'quotation', data: null })}
      />

      {/* Order Processing Confirmation (OPC) Modal */}
      <OpcModal
        isOpen={opcModal.isOpen}
        enquiry={opcModal.enquiry}
        onClose={() => setOpcModal({ isOpen: false, enquiry: null })}
        onSaved={fetchEnquiries}
      />
    </DashboardLayout>
  );
}
