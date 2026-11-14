import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Box, Send, FileSpreadsheet, Truck, CheckCircle2, Layers } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="nav-brand">
          <div className="brand-icon"><Layers size={22} color="#18476c" /></div>
          <span className="brand-text">NexFlow</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <button className="btn-nav-login" onClick={() => navigate('/login')}>
            Sign In <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-banner">
        <div className="hero-badge">
          <ShieldCheck size={16} color="#18476c" />
          <span>Sales, Procurement & Logistics ERP</span>
        </div>
        <h1 className="hero-title">
          Unified Order Fulfilment from <span className="gradient-text">Enquiry to Delivery</span>
        </h1>
        <p className="hero-subtitle">
          Connect Reception, Sales, Purchase, Store & Logistics into one seamless, traceable workflow. Real-time pricing, quotation tracking, and inventory fulfillment.
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => navigate('/login')}>
            Access Portal <ArrowRight size={18} />
          </button>
          <a href="#workflow" className="btn-secondary">Explore 14-Step Flow</a>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="features-section">
        <h2 className="section-title">Engineered for Seamless Collaboration</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="f-icon bg-blue"><FileSpreadsheet size={24} /></div>
            <h3>Enquiry Categorization</h3>
            <p>Smart lead logging for Mechanical, Electrical & IT categories with auto-routing.</p>
          </div>
          <div className="feature-card">
            <div className="f-icon bg-amber"><Box size={24} /></div>
            <h3>Purchase & Costing</h3>
            <p>Instant vendor cost capture, stock availability, and lead-time estimation.</p>
          </div>
          <div className="feature-card">
            <div className="f-icon bg-cyan"><Send size={24} /></div>
            <h3>Quotation & Sales Order</h3>
            <p>Automated quotation generation with revision cycles and customer PO verification.</p>
          </div>
          <div className="feature-card">
            <div className="f-icon bg-emerald"><Truck size={24} /></div>
            <h3>Store & Dispatch</h3>
            <p>Pick-pack-reserve operations with carrier dispatch and end-to-end tracking.</p>
          </div>
        </div>
      </section>

      {/* Workflow Diagram Section */}
      <section id="workflow" className="workflow-section">
        <h2 className="section-title">The Complete 14-Step Journey</h2>
        <div className="steps-container">
          {[
            { step: '01', title: 'Customer Enquiry', desc: 'Received & recorded' },
            { step: '02', title: 'Categorization', desc: 'Mechanical, Electrical, IT' },
            { step: '03', title: 'Sales Assignment', desc: 'Assigned to specialist' },
            { step: '04', title: 'Requirements', desc: 'Specs & quantity checked' },
            { step: '05', title: 'Purchase Pricing', desc: 'Supplier cost & availability' },
            { step: '06', title: 'Quotation', desc: 'Generated & dispatched' },
            { step: '07', title: 'PO Received', desc: 'Verified vs Quotation' },
            { step: '08', title: 'Sales Order', desc: 'Confirmed internally' },
            { step: '09', title: 'Store Fulfillment', desc: 'Reserved, picked & packed' },
            { step: '10', title: 'Dispatch & Invoice', desc: 'Transporter booked & tracked' },
          ].map((item, idx) => (
            <div key={idx} className="step-card">
              <span className="step-num">{item.step}</span>
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <p>© 2026 NexFlow Systems. Secure Order Fulfilment.</p>
      </footer>
    </div>
  );
}
