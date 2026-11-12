import React from 'react';
import { Layers, ShieldCheck, Zap, Activity } from 'lucide-react';

export default function Hero() {
  return (
    <div className="auth-hero">
      <div className="auth-hero-header">
        <div className="brand-icon"><Layers size={26} color="#2563eb" /></div>
        <h2>NexFlow Enterprise</h2>
      </div>

      <div className="auth-hero-body">
        <h3>Connected Operations Across 5 Strategic Roles</h3>
        <p>Log in with your authorized corporate role to access your synchronized dashboard.</p>

        <div className="hero-feature-list">
          <div className="hero-feat-item">
            <ShieldCheck size={20} color="#2563eb" />
            <div>
              <strong>Role-Guarded Security</strong>
              <span>Restricted access for Receptionist, Sales, Purchase & Store.</span>
            </div>
          </div>
          <div className="hero-feat-item">
            <Zap size={20} color="#d97706" />
            <div>
              <strong>Instant Order Routing</strong>
              <span>Lead logging, pricing feedback, and picking pipeline in real time.</span>
            </div>
          </div>
          <div className="hero-feat-item">
            <Activity size={20} color="#059669" />
            <div>
              <strong>Audit & Traceability</strong>
              <span>Complete timeline tracking from enquiry to customer delivery.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-hero-footer">
        <span>Enterprise B2B Fulfillment Platform</span>
      </div>
    </div>
  );
}
