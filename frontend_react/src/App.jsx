import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WorkspacePage from './pages/WorkspacePage';
import ProductsPage from './pages/ProductsPage';
import Layout from './components/Layout';

// Security Gate 1: Enforce Active Sessions
function ProtectedRoute() {
  const hasGlobalToken = !!localStorage.getItem('global_token');
  return hasGlobalToken ? <Outlet /> : <Navigate to="/login" replace />;
}

// Security Gate 2: Enforce Tenant Workspace Binding
function WorkspaceRequiredRoute() {
  const hasOrgToken = !!localStorage.getItem('org_token');
  return hasOrgToken ? <Layout /> : <Navigate to="/workspaces" replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Gateways */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Core Guarded Route Tree */}
          <Route element={<ProtectedRoute />}>
            <Route path="/workspaces" element={<WorkspacePage />} />
            
            {/* Scoped Tenant Domain Workspace */}
            <Route element={<WorkspaceRequiredRoute />}>
              <Route path="/products" element={<ProductsPage />} />
              {/* Future paths like /sales and /analytics mount directly here */}
              <Route path="*" element={<Navigate to="/products" replace />} />
            </Route>
          </Route>

          {/* Catch-all entry baseline fallback redirection */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}