import React from 'react';
import { Layers, LogOut } from 'lucide-react';
import './css/DashboardLayout.css';

export default function DashboardSidebar({
  config,
  activeTab,
  setActiveTab,
  onLogout,
  collapsed,
  mobileOpen
}) {
  return (
    <aside className={`dash-sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}>
      {/* Brand Monogram */}
      <div className="dash-brand">
        <div className="dash-brand-emblem-wrap">
          <Layers size={26} color="#38bdf8" />
        </div>
        {!collapsed && (
          <div className="dash-brand-text">
            <h3>NexFlow B2B</h3>
            <span>{config.brandSubtitle || 'ENTERPRISE ERP'}</span>
          </div>
        )}
      </div>

      {/* Menu Label */}
      {!collapsed && (
        <div className="sidebar-section-title">
          <span>NAVIGATION</span>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="dash-sidebar-nav">
        {config.menu.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`dash-nav-item ${isActive ? 'is-active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
            >
              <span className="dash-nav-icon"><Icon size={19} /></span>
              {!collapsed && <span className="dash-nav-label">{item.label}</span>}
              {isActive && !collapsed && <span className="active-dot" />}
            </button>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="dash-sidebar-footer">
        <button
          type="button"
          className="dash-logout-btn"
          onClick={onLogout}
          title="Sign Out"
        >
          <LogOut size={18} color="#ef4444" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
