import React from 'react';
import { Layers, ShieldCheck, Zap, Activity, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  return (
    <div className="split-hero-side">
      {/* Brand Header */}
      <div className="split-brand-header">
        <div className="split-brand-logo">
          <Layers size={24} />
        </div>
        <div className="split-brand-title">
          <h2>NexFlow</h2>
          <span>Sales & Inventory Portal</span>
        </div>
      </div>

      {/* Main Pitch */}
      <div className="split-hero-main">
        <div className="split-badge-pill">
          <span className="pulse-dot"></span>
          <span>Core v2.4 Active</span>
        </div>

        <h1>Unified Commercial & Inventory Operations</h1>
        <p>
          Role-governed operational dashboard coordinating Sales, Stores, 
          Purchase, and Reception in real time with end-to-end traceability.
        </p>

        <div className="split-feat-list">
          <div className="split-feat-item">
            <div className="split-feat-icon-box">
              <ShieldCheck size={18} />
            </div>
            <div className="split-feat-text">
              <strong>Role-Enforced Workspaces</strong>
              <span>Dedicated dashboards tailored to your department authorization.</span>
            </div>
          </div>

          <div className="split-feat-item">
            <div className="split-feat-icon-box">
              <Zap size={18} />
            </div>
            <div className="split-feat-text">
              <strong>Instant Pipeline Routing</strong>
              <span>Lead logging, pricing feedback, stock picking, and order handoffs.</span>
            </div>
          </div>

          <div className="split-feat-item">
            <div className="split-feat-icon-box">
              <Activity size={18} />
            </div>
            <div className="split-feat-text">
              <strong>Full Audit Compliance</strong>
              <span>Complete timeline ledger from initial quotation to final delivery.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer System Badge */}
      <div className="split-hero-footer">
        <span>© 2026 NexFlow ERP</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <CheckCircle2 size={14} color="#34d399" /> 99.98% System Uptime
        </span>
      </div>
    </div>
  );
}
