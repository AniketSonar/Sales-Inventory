import React from 'react';
import { ChevronLeft, ChevronRight, User, Shield } from 'lucide-react';
import './css/DashboardLayout.css';

export default function DashboardTopbar({
  config,
  onToggleSidebar,
  sidebarCollapsed
}) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const ToggleIcon = sidebarCollapsed ? ChevronRight : ChevronLeft;

  return (
    <header className="dash-topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-toggle-btn"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ToggleIcon size={18} />
        </button>
        <div className="topbar-breadcrumb">
          <span className="bc-dept">{config.roleLabel || 'Operations'}</span>
          <span className="bc-sep">/</span>
          <span className="bc-active">Real-Time Database Portal</span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-role-badge">
          <Shield size={14} />
          <span>{user.role?.toUpperCase() || config.roleLabel?.toUpperCase()}</span>
        </div>

        <div className="topbar-user-chip">
          <User size={15} color="#475569" />
          <span>{user.name || user.email || config.defaultName}</span>
        </div>
      </div>
    </header>
  );
}
