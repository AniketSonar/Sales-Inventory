import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem('access_token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || !user.role) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role.toLowerCase();
  const isAllowed = allowedRoles.map(r => r.toLowerCase()).includes(role) || role === 'admin';

  if (!isAllowed) {
    // Redirect to their own dashboard
    if (role === 'receptionist') return <Navigate to="/receptionist-dashboard" replace />;
    if (role === 'sales') return <Navigate to="/sales-dashboard" replace />;
    if (role === 'purchase') return <Navigate to="/purchase-dashboard" replace />;
    if (role === 'store') return <Navigate to="/store-dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
