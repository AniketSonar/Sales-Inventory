import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/landing/LandingPage';
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/layout/ProtectedRoute';

import AdminDashboard from './components/dashboards/admin/AdminDashboard';
import ReceptionistDashboard from './components/dashboards/receptionist/ReceptionistDashboard';
import SalesDashboard from './components/dashboards/sales/SalesDashboard';
import PurchaseDashboard from './components/dashboards/purchase/PurchaseDashboard';
import StoreDashboard from './components/dashboards/store/StoreDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Public Marketing Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* 2. Authentication Login Page */}
        <Route path="/login" element={<LoginPage />} />

        {/* 3. Role-Guarded Dashboards */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/receptionist-dashboard"
          element={
            <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
              <ReceptionistDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sales-dashboard"
          element={
            <ProtectedRoute allowedRoles={['sales', 'admin']}>
              <SalesDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/purchase-dashboard"
          element={
            <ProtectedRoute allowedRoles={['purchase', 'admin']}>
              <PurchaseDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/store-dashboard"
          element={
            <ProtectedRoute allowedRoles={['store', 'admin']}>
              <StoreDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
