import React, { useState } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { Send, CheckCircle2, Truck, FileCheck } from 'lucide-react';

export default function SalesDashboard() {
  const [pipeline, setPipeline] = useState([
    {
      id: 'ORD-101',
      customer: 'Apex Global',
      item: 'MCH-P-101 (Qty: 20)',
      vendorCost: '$120',
      quoteAmount: '$180',
      poNumber: 'PO-APEX-890',
      stage: 'Store Packing',
      invoiceNo: null,
      transporter: null
    },
    {
      id: 'ORD-102',
      customer: 'Delta Tech',
      item: 'ELE-MOD-202 (Qty: 10)',
      vendorCost: '$300',
      quoteAmount: null,
      poNumber: null,
      stage: 'Ready for Quotation',
      invoiceNo: null,
      transporter: null
    }
  ]);

  const [activeAction, setActiveAction] = useState(null);
  const [quotePrice, setQuotePrice] = useState('450');
  const [poNo, setPoNo] = useState('PO-2026-');
  const [invNo, setInvNo] = useState(`INV-${Date.now().toString().slice(-4)}`);
  const [transporter, setTransporter] = useState('Road Express Logistics');
  const [tracking, setTracking] = useState('TRK-88291');

  const handleIssueQuote = (item) => {
    setPipeline(pipeline.map(p => p.id === item.id ? { ...p, quoteAmount: `$${quotePrice}`, stage: 'Quotation Sent (Awaiting PO)' } : p));
    setActiveAction(null);
  };

  const handleConvertPO = (item) => {
    setPipeline(pipeline.map(p => p.id === item.id ? { ...p, poNumber: poNo, stage: 'Sales Order Confirmed (Sent to Store)' } : p));
    setActiveAction(null);
  };

  const handleDispatch = (item) => {
    setPipeline(pipeline.map(p => p.id === item.id ? { ...p, invoiceNo: invNo, transporter: `${transporter} (${tracking})`, stage: 'Dispatched & Closed' } : p));
    setActiveAction(null);
  };

  return (
    <DashboardLayout title="Sales & Order Management" roleBadge="SALES">
      <div className="dash-card">
        <h3>End-to-End Sales Pipeline</h3>
        <table className="dash-table">
          <thead>
            <tr>
              <th>Order Ref</th>
              <th>Customer</th>
              <th>Item / Qty</th>
              <th>Vendor Cost</th>
              <th>Quotation</th>
              <th>PO Ref</th>
              <th>Stage / Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pipeline.map(item => (
              <tr key={item.id}>
                <td><strong>{item.id}</strong></td>
                <td>{item.customer}</td>
                <td>{item.item}</td>
                <td><span style={{ color: '#38bdf8' }}>{item.vendorCost}</span></td>
                <td>{item.quoteAmount || <span style={{ color: 'var(--text-muted)' }}>Pending</span>}</td>
                <td>{item.poNumber || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                <td><span className="status-badge badge-info">{item.stage}</span></td>
                <td>
                  {!item.quoteAmount && (
                    <button className="dash-btn" onClick={() => setActiveAction({ type: 'QUOTE', item })}>Issue Quote</button>
                  )}
                  {item.quoteAmount && !item.poNumber && (
                    <button className="dash-btn" style={{ background: '#f59e0b' }} onClick={() => setActiveAction({ type: 'PO', item })}>Verify PO</button>
                  )}
                  {item.poNumber && item.stage !== 'Dispatched & Closed' && (
                    <button className="dash-btn" style={{ background: '#10b981' }} onClick={() => setActiveAction({ type: 'DISPATCH', item })}>Invoice & Dispatch</button>
                  )}
                  {item.stage === 'Dispatched & Closed' && (
                    <span style={{ color: '#34d399', fontSize: '0.85rem' }}>✓ Closed ({item.invoiceNo})</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeAction && (
        <div className="dash-card animate-fade" style={{ maxWidth: '500px' }}>
          {activeAction.type === 'QUOTE' && (
            <div>
              <h3>Generate Customer Quotation: {activeAction.item.id}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Vendor cost is {activeAction.item.vendorCost}. Set selling price below:</p>
              <input
                type="number"
                style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-card)', border: '1px solid var(--surface-border)', color: 'white', borderRadius: '6px' }}
                value={quotePrice}
                onChange={e => setQuotePrice(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="dash-btn" onClick={() => handleIssueQuote(activeAction.item)}>Send Quote</button>
                <button className="dash-btn" style={{ background: 'var(--surface-border)' }} onClick={() => setActiveAction(null)}>Cancel</button>
              </div>
            </div>
          )}

          {activeAction.type === 'PO' && (
            <div>
              <h3>Customer PO Verification: {activeAction.item.id}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Enter received Purchase Order Number:</p>
              <input
                style={{ width: '100%', padding: '0.6rem', background: 'var(--surface-card)', border: '1px solid var(--surface-border)', color: 'white', borderRadius: '6px' }}
                value={poNo}
                onChange={e => setPoNo(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="dash-btn" onClick={() => handleConvertPO(activeAction.item)}>Convert to Sales Order</button>
                <button className="dash-btn" style={{ background: 'var(--surface-border)' }} onClick={() => setActiveAction(null)}>Cancel</button>
              </div>
            </div>
          )}

          {activeAction.type === 'DISPATCH' && (
            <div>
              <h3>Invoice & Transporter Dispatch: {activeAction.item.id}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Invoice Number</label>
                  <input
                    style={{ width: '100%', padding: '0.5rem', background: 'var(--surface-card)', border: '1px solid var(--surface-border)', color: 'white', borderRadius: '6px', marginTop: '3px' }}
                    value={invNo}
                    onChange={e => setInvNo(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Transporter</label>
                  <input
                    style={{ width: '100%', padding: '0.5rem', background: 'var(--surface-card)', border: '1px solid var(--surface-border)', color: 'white', borderRadius: '6px', marginTop: '3px' }}
                    value={transporter}
                    onChange={e => setTransporter(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tracking / AWB Number</label>
                  <input
                    style={{ width: '100%', padding: '0.5rem', background: 'var(--surface-card)', border: '1px solid var(--surface-border)', color: 'white', borderRadius: '6px', marginTop: '3px' }}
                    value={tracking}
                    onChange={e => setTracking(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button className="dash-btn" onClick={() => handleDispatch(activeAction.item)}>Issue Invoice & Dispatch</button>
                  <button className="dash-btn" style={{ background: 'var(--surface-border)' }} onClick={() => setActiveAction(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
