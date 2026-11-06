import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import DashboardTopbar from './DashboardTopbar';
import './css/DashboardLayout.css';

export default function DashboardLayout({
  config,
  activeTab,
  setActiveTab,
  children
}) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <div className={`dash-app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <DashboardSidebar
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        collapsed={collapsed}
      />
      <div className="dash-body-wrapper">
        <DashboardTopbar
          config={config}
          onToggleSidebar={() => setCollapsed(!collapsed)}
          sidebarCollapsed={collapsed}
        />
        <main className="dash-main-scroll">
          <div className="dash-content-inner">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
