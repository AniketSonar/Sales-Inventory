import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { receptionistConfig } from '../../layout/dashboardConfigs';
import { 
  PlusCircle, FileText, CheckCircle2, RefreshCw, Layers, Calendar, 
  User, Phone, Mail, Box, Paperclip, X, Boxes, Edit2, Trash2, FolderPlus 
} from 'lucide-react';
import { useLiveSync } from '../../../utils/useLiveSync';
import { API_URL } from '../../../config/api';

export default function ReceptionistDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [enquiries, setEnquiries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Form state for Enquiry
  const [customer, setCustomer] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [partCode, setPartCode] = useState('');
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [pdfAttachment, setPdfAttachment] = useState('');
  const [pdfName, setPdfName] = useState('');

  // Category Management State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editingCat, setEditingCat] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

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

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories`);
      const data = await res.json();
      if (data.success && data.data) {
        setCategories(data.data);
        setCategory(prev => (prev && data.data.some(c => c.name === prev)) ? prev : (data.data[0]?.name || 'Mechanical'));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useLiveSync(() => {
    fetchEnquiries();
  }, 3000);

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        alert('Please attach a valid PDF document.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPdfAttachment(reader.result);
        setPdfName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customer,
          contact_email: email,
          contact_phone: phone,
          category: category || (categories[0]?.name || 'Mechanical'),
          part_code: partCode,
          quantity: qty,
          notes,
          pdf_attachment: pdfAttachment,
          attachment_name: pdfName
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Enquiry ${data.enquiry_no} logged successfully and routed directly to Sales Department!`);
        setCustomer('');
        setEmail('');
        setPhone('');
        setPartCode('');
        setQty(1);
        setNotes('');
        setPdfAttachment('');
        setPdfName('');
        fetchEnquiries();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Category Handler
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          description: newCatDesc.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Product category "${newCatName.trim()}" created successfully!`);
        setNewCatName('');
        setNewCatDesc('');
        fetchCategories();
        setTimeout(() => setMsg(''), 4000);
      } else {
        alert(data.message || 'Failed to add category');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Category Handler
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCat || !editName.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/categories/${editingCat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Category "${editName}" updated successfully!`);
        setEditingCat(null);
        fetchCategories();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Category Handler
  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`Are you sure you want to delete category "${catName}"?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/categories/${catId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Category "${catName}" deleted.`);
        fetchCategories();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout
      config={receptionistConfig}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      <div className="dash-view-header">
        <div>
          <h2>Reception Enquiry & Intake Desk</h2>
          <p>Capture incoming customer requirements, manage product categories, and assign enquiries to Sales.</p>
        </div>
        <button
          onClick={() => { fetchEnquiries(); fetchCategories(); }}
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

      {/* TAB 1: ALL ENQUIRIES */}
      {(activeTab === 'dashboard' || activeTab === 'all-enquiries') && (
        <div className="dash-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <FileText size={19} color="#18476c" /> Enquiries Intake Register
            </h3>
            <span className="status-badge badge-blue">
              {enquiries.length} Total Enquiries
            </span>
          </div>
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Enquiry Ref</th>
                  <th>Customer Name</th>
                  <th>Category</th>
                  <th>Part Code</th>
                  <th>Qty</th>
                  <th>Workflow Status</th>
                  <th>Attached PDF</th>
                  <th>Date Logged</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No enquiries recorded yet.
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
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{enq.contact_email || enq.contact_phone || 'Direct Walk-in'}</span>
                      </td>
                      <td>
                        <span className="status-badge badge-blue">
                          {enq.category}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{enq.part_code}</span>
                      </td>
                      <td>
                        <span className="status-badge badge-slate" style={{ fontWeight: 700 }}>{enq.quantity} pcs</span>
                      </td>
                      <td>
                        <span className={`status-badge ${
                          enq.status.includes('Delivered') ? 'badge-emerald' : 
                          enq.status.includes('Transit') ? 'badge-emerald' :
                          enq.status.includes('Approved') || enq.status.includes('Confirmed') ? 'badge-blue' : 
                          enq.status.includes('Sales') ? 'badge-amber' : 'badge-slate'
                        }`}>
                          {enq.status}
                        </span>
                      </td>
                      <td>
                        {enq.pdf_attachment ? (
                          <a
                            href={enq.pdf_attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={enq.attachment_name || `${enq.enquiry_no}_attachment.pdf`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              color: '#1e40af',
                              textDecoration: 'none',
                              fontSize: '0.78rem',
                              fontWeight: 600
                            }}
                            title={enq.attachment_name || 'Download / View PDF'}
                          >
                            <Paperclip size={13} color="#2563eb" />
                            <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {enq.attachment_name || 'View PDF'}
                            </span>
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.82rem' }}>
                        {new Date(enq.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LOG NEW ENQUIRY (ROUTED TO SALES) */}
      {activeTab === 'new-enquiry' && (
        <div className="dash-card" style={{ maxWidth: '780px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={19} color="#18476c" /> Log New Customer Enquiry
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '4px' }}>
            All new enquiries logged here route directly to the <strong>Sales Department</strong> for seriousness verification and client follow-ups.
          </p>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>Customer / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Motors Ltd"
                  value={customer}
                  onChange={e => setCustomer(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>Product Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%' }}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                  {categories.length === 0 && (
                    <option value="Mechanical">Mechanical</option>
                  )}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>Contact Email</label>
                <input
                  type="email"
                  placeholder="procurement@client.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>Part Code / SKU *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MCH-VALVE-50MM"
                  value={partCode}
                  onChange={e => setPartCode(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>Requirement Notes / Specs</label>
              <textarea
                rows="3"
                placeholder="Special technical parameters, delivery location, or timeline..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>
                Attach PDF Document (Optional)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  background: '#f8fafc',
                  border: '1.5px dashed #94a3b8',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#1e293b',
                  transition: 'background 0.15s'
                }}>
                  <Paperclip size={16} color="#18476c" />
                  {pdfName ? 'Change Attached PDF' : 'Attach PDF Document'}
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
                {pdfName && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#eff6ff', padding: '7px 12px', borderRadius: '6px', border: '1px solid #bfdbfe', fontSize: '0.84rem', color: '#1e40af' }}>
                    <FileText size={16} />
                    <span style={{ fontWeight: 600, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pdfName}</span>
                    <button
                      type="button"
                      onClick={() => { setPdfAttachment(''); setPdfName(''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px', display: 'flex' }}
                      title="Remove attached PDF"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="dash-btn" style={{ padding: '12px 20px', fontSize: '0.95rem', marginTop: '6px' }}>
              <PlusCircle size={17} /> Save Enquiry & Route Directly to Sales Department
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: MANAGE PRODUCT CATEGORIES (RECEPTIONIST REQUIREMENT) */}
      {activeTab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '22px' }}>
          {/* Add / Edit Category Form */}
          <div className="dash-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <FolderPlus size={19} color="#18476c" /> {editingCat ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={editingCat ? handleUpdateCategory : handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hydraulic & Pneumatic"
                  value={editingCat ? editName : newCatName}
                  onChange={e => editingCat ? setEditName(e.target.value) : setNewCatName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe parts, equipment, or materials classified in this division..."
                  value={editingCat ? editDesc : newCatDesc}
                  onChange={e => editingCat ? setEditDesc(e.target.value) : setNewCatDesc(e.target.value)}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" className="dash-btn" style={{ flex: 1 }}>
                  {editingCat ? 'Update Category' : 'Create Category'}
                </button>
                {editingCat && (
                  <button
                    type="button"
                    className="dash-btn dash-btn-secondary"
                    onClick={() => setEditingCat(null)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List of Product Categories */}
          <div className="dash-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Boxes size={19} color="#18476c" /> Product Categories Catalog
              </h3>
              <span className="status-badge badge-slate" style={{ fontWeight: 700 }}>
                {categories.length} Categories Active
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {categories.map(cat => (
                <div
                  key={cat.id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderTop: '3px solid #18476c'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>{cat.name}</h4>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCat(cat);
                            setEditName(cat.name);
                            setEditDesc(cat.description || '');
                          }}
                          style={{
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '5px',
                            padding: '4px 6px',
                            cursor: 'pointer',
                            color: '#1d4ed8'
                          }}
                          title="Edit Category"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '5px',
                            padding: '4px 6px',
                            cursor: 'pointer',
                            color: '#dc2626'
                          }}
                          title="Delete Category"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                      {cat.description || 'No description provided.'}
                    </p>
                  </div>

                  <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      Enquiries: <strong>{enquiries.filter(e => (e.category || '').toLowerCase() === cat.name.toLowerCase()).length}</strong>
                    </span>
                    <span className="status-badge badge-emerald" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
