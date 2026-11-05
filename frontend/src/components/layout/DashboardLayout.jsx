import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Layers, User, Shield } from 'lucide-react';
import './DashboardLayout.css';

export default function DashboardLayout({ title, roleBadge, children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <div className="dash-container">
      {/* Top Navbar */}
      <header className="dash-header">
        <div className="dash-brand">
          <div className="dash-logo"><Layers size={20} color="#38bdf8" /></div>
          <div>
            <div className="dash-title">NexFlow Portal</div>
            <div className="dash-sub">B2B Order Management</div>
          </div>
        </div>

        <div className="dash-user-controls">
          <div className="role-tag">
            <Shield size={14} />
            <span>{roleBadge || user.role?.toUpperCase()}</span>
          </div>

          <div className="user-profile-pill">
            <User size={16} color="#94a3b8" />
            <span className="user-email">{user.email || 'user@company.com'}</span>
          </div>

          <button className="btn-logout" onClick={handleLogout} title="Log Out">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="dash-main animate-fade">
        <div className="page-header">
          <h1>{title}</h1>
        </div>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
