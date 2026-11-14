import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  LogOut,
  Bell,
  Clock,
  CheckCircle2,
  ChevronDown,
  Mail,
  Briefcase,
  IdCard,
  Building2,
  X,
  ExternalLink
} from 'lucide-react';
import './css/DashboardLayout.css';

export default function DashboardTopbar({
  config = {},
  onToggleSidebar,
  sidebarCollapsed,
  onLogout
}) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const ToggleIcon = sidebarCollapsed ? ChevronRight : ChevronLeft;

  // Dropdowns & Modals state
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleKey = (user.role || config.roleLabel || 'sales').toLowerCase();

  // Role metadata configurations
  const roleMeta = {
    admin: {
      color: '#2563eb',
      bgGradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
      dept: 'Executive Management',
      empId: 'EMP-ADM-001',
      badgeColor: '#dbeafe',
      badgeText: '#1e40af'
    },
    sales: {
      color: '#059669',
      bgGradient: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
      dept: 'Sales & Commercial Operations',
      empId: 'EMP-SLS-104',
      badgeColor: '#d1fae5',
      badgeText: '#065f46'
    },
    purchase: {
      color: '#d97706',
      bgGradient: 'linear-gradient(135deg, #92400e 0%, #f59e0b 100%)',
      dept: 'Procurement & Vendor Relations',
      empId: 'EMP-PUR-208',
      badgeColor: '#fef3c7',
      badgeText: '#92400e'
    },
    store: {
      color: '#7c3aed',
      bgGradient: 'linear-gradient(135deg, #5b21b6 0%, #8b5cf6 100%)',
      dept: 'Warehouse & Logistics',
      empId: 'EMP-STR-312',
      badgeColor: '#ede9fe',
      badgeText: '#5b21b6'
    },
    receptionist: {
      color: '#0891b2',
      bgGradient: 'linear-gradient(135deg, #155e75 0%, #06b6d4 100%)',
      dept: 'Front Desk & Enquiries',
      empId: 'EMP-REC-405',
      badgeColor: '#cffafe',
      badgeText: '#155e75'
    }
  };

  const currentMeta = roleMeta[roleKey] || roleMeta.sales;

  // Initials generator
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = user.name || user.email?.split('@')[0] || config.defaultName || 'User';
  const displayRole = user.role?.toUpperCase() || config.roleLabel?.toUpperCase() || 'OFFICER';
  const displayEmail = user.email || `${roleKey}@company.com`;
  const initials = getInitials(displayName);

  // Role-specific notifications
  const notificationsList = {
    admin: [
      { id: 1, title: 'Quarterly Sales Target', desc: 'Reached 94% of Q4 target', time: '10m ago' },
      { id: 2, title: 'Database Live Sync', desc: 'All nodes synchronized smoothly', time: '1h ago' }
    ],
    sales: [
      { id: 1, title: 'Quotation Approved', desc: 'QT-2024-89 marked as Won', time: '5m ago' },
      { id: 2, title: 'New Customer PO', desc: 'Received PO for Apex Industries', time: '35m ago' }
    ],
    purchase: [
      { id: 1, title: 'Price Check Request', desc: 'Sales team requested quote on 3 items', time: '12m ago' },
      { id: 2, title: 'Vendor Updated', desc: 'Global Logistics updated rate sheet', time: '2h ago' }
    ],
    store: [
      { id: 1, title: 'Dispatch Ready', desc: 'Order #ORD-7721 ready for pickup', time: '8m ago' },
      { id: 2, title: 'Stock Low Warning', desc: '4 items nearing reorder threshold', time: '40m ago' }
    ],
    receptionist: [
      { id: 1, title: 'New Visitor Enquiry', desc: 'Assigned to Sales Team', time: '15m ago' },
      { id: 2, title: 'Catalog Updated', desc: 'Product brochures synced', time: '1h ago' }
    ]
  };

  const activeNotifs = notificationsList[roleKey] || notificationsList.sales;

  return (
    <>
      <header className="dash-topbar">
        {/* Left Section: Sidebar Toggle & Breadcrumb */}
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
            <span className="bc-active">Real-Time Portal</span>
          </div>
        </div>

        {/* Right Section: Time, Notifications & User Profile */}
        <div className="topbar-right">
          {/* Live Clock */}
          <div className="topbar-clock-chip" title="Current System Time">
            <Clock size={14} className="clock-icon" />
            <span>
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              {' • '}
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Notifications Dropdown */}
          <div className="topbar-notif-wrapper" ref={notifRef}>
            <button
              type="button"
              className="topbar-icon-btn"
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileOpen(false);
              }}
              title="Notifications"
            >
              <Bell size={17} />
              <span className="notif-badge">{activeNotifs.length}</span>
            </button>

            {notificationsOpen && (
              <div className="notif-dropdown-menu">
                <div className="notif-dropdown-header">
                  <h4>Department Notifications</h4>
                  <span className="notif-count-tag">{activeNotifs.length} New</span>
                </div>
                <div className="notif-list">
                  {activeNotifs.map((n) => (
                    <div key={n.id} className="notif-item">
                      <div className="notif-icon-circle">
                        <CheckCircle2 size={14} color="#10b981" />
                      </div>
                      <div className="notif-content">
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-desc">{n.desc}</div>
                        <div className="notif-time">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Card & Trigger */}
          <div className="topbar-profile-wrapper" ref={profileRef}>
            <button
              type="button"
              className={`topbar-profile-trigger ${profileOpen ? 'is-active' : ''}`}
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationsOpen(false);
              }}
              title="View User Profile"
            >
              <div
                className="profile-avatar-chip"
                style={{ background: currentMeta.bgGradient }}
              >
                <span>{initials}</span>
                <span className="profile-online-badge" />
              </div>
              <div className="profile-text-group">
                <span className="profile-display-name">{displayName}</span>
                <span
                  className="profile-role-tag"
                  style={{ backgroundColor: currentMeta.badgeColor, color: currentMeta.badgeText }}
                >
                  {displayRole}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`profile-chevron ${profileOpen ? 'chevron-rotated' : ''}`}
              />
            </button>

            {/* Profile Dropdown Panel */}
            {profileOpen && (
              <div className="profile-dropdown-menu">
                {/* Header Card */}
                <div className="profile-dropdown-header">
                  <div
                    className="profile-dropdown-avatar"
                    style={{ background: currentMeta.bgGradient }}
                  >
                    <span>{initials}</span>
                  </div>
                  <div className="profile-dropdown-info">
                    <h4>{displayName}</h4>
                    <span className="profile-dropdown-email">{displayEmail}</span>
                    <span
                      className="profile-dropdown-badge"
                      style={{ backgroundColor: currentMeta.badgeColor, color: currentMeta.badgeText }}
                    >
                      <Shield size={11} /> {displayRole}
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="profile-dropdown-details">
                  <div className="detail-row">
                    <span className="detail-label"><Building2 size={13} /> Department</span>
                    <span className="detail-value">{currentMeta.dept}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label"><IdCard size={13} /> Employee ID</span>
                    <span className="detail-value">{currentMeta.empId}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label"><CheckCircle2 size={13} /> Session</span>
                    <span className="detail-value text-green">Online • Active</span>
                  </div>
                </div>

                {/* Profile Actions */}
                <div className="profile-dropdown-actions">
                  <button
                    type="button"
                    className="profile-view-modal-btn"
                    onClick={() => {
                      setProfileOpen(false);
                      setProfileModalOpen(true);
                    }}
                  >
                    <User size={15} />
                    <span>View Profile Details</span>
                  </button>

                  {onLogout && (
                    <button
                      type="button"
                      className="profile-logout-btn"
                      onClick={() => {
                        setProfileOpen(false);
                        onLogout();
                      }}
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Full User Profile Modal Dialog */}
      {profileModalOpen && (
        <div className="profile-modal-overlay" onClick={() => setProfileModalOpen(false)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-head">
              <h3>User Profile & Account Info</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setProfileModalOpen(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="profile-modal-body">
              <div className="modal-hero-section">
                <div
                  className="modal-avatar-large"
                  style={{ background: currentMeta.bgGradient }}
                >
                  <span>{initials}</span>
                </div>
                <div className="modal-hero-text">
                  <h2>{displayName}</h2>
                  <p className="modal-hero-email">{displayEmail}</p>
                  <span
                    className="modal-hero-badge"
                    style={{ backgroundColor: currentMeta.badgeColor, color: currentMeta.badgeText }}
                  >
                    <Shield size={13} /> {displayRole}
                  </span>
                </div>
              </div>

              <div className="modal-info-grid">
                <div className="modal-info-card">
                  <div className="mic-label"><Building2 size={14} /> Department</div>
                  <div className="mic-val">{currentMeta.dept}</div>
                </div>
                <div className="modal-info-card">
                  <div className="mic-label"><IdCard size={14} /> Employee Code</div>
                  <div className="mic-val">{currentMeta.empId}</div>
                </div>
                <div className="modal-info-card">
                  <div className="mic-label"><Mail size={14} /> Official Email</div>
                  <div className="mic-val">{displayEmail}</div>
                </div>
                <div className="modal-info-card">
                  <div className="mic-label"><Briefcase size={14} /> System Privileges</div>
                  <div className="mic-val">Authorized {displayRole}</div>
                </div>
              </div>

              <div className="modal-security-note">
                <CheckCircle2 size={16} color="#10b981" />
                <span>
                  Authenticated via NexFlow Secure Enterprise Identity • Session Active
                </span>
              </div>
            </div>

            <div className="profile-modal-foot">
              <button
                type="button"
                className="modal-done-btn"
                onClick={() => setProfileModalOpen(false)}
              >
                Done
              </button>
              {onLogout && (
                <button
                  type="button"
                  className="modal-logout-btn"
                  onClick={() => {
                    setProfileModalOpen(false);
                    onLogout();
                  }}
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
