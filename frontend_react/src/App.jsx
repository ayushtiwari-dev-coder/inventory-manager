import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { CacheProvider } from './context/CacheContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WorkspacePage from './pages/WorkspacePage';
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import Layout from './components/Layout';
// import AnalyticsPage from './pages/AnalyticsPage';

// Verifies global login token state
function ProtectedRoute() {
  const hasGlobalToken = !!localStorage.getItem('global_token');
  return hasGlobalToken ? <Outlet /> : <Navigate to="/login" replace />;
}

// Intercepts and renders the common Layout view with navigation elements
function WorkspaceRequiredRoute() {
  const hasOrgToken = !!localStorage.getItem('org_token');
  return hasOrgToken ? <Layout /> : <Navigate to="/workspaces" replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <CacheProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Global Session Protected Group */}
            <Route element={<ProtectedRoute />}>
              <Route path="/workspaces" element={<WorkspacePage />} />
              
              {/* Active Organization Tenant Namespace Scope */}
              <Route element={<WorkspaceRequiredRoute />}>
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/sales" element={<SalesPage />} />
                {/* <Route path="/analytics" element={<AnalyticsPage/>} /> */}
                <Route path="*" element={<Navigate to="/products" replace />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </CacheProvider>
    </ToastProvider>
  );
}