// LOCATION: frontend_react/src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WorkspacePage from './pages/WorkspacePage';
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import Layout from './components/Layout';
import ProfilePage from './pages/ProfilePage';
import AnalyticsPage from './pages/AnalyticsPage';
import LogsPage from './pages/LogsPage';
import EmployeesPage from './pages/EmployeesPage';
import AboutPage from './pages/AboutPage';

// Tiny helper to decode the JWT and get the current role
// Replace getUserRole and the Protected Routes inside your App.jsx with this:

const getUserRole = () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    return userInfo.current_role || null;
  } catch (e) {
    return null;
  }
};

function ProtectedRoute() {
  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
  return userInfo.user_id ? <Outlet /> : <Navigate to="/login" replace />;
}

function WorkspaceRequiredRoute() {
  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
  return userInfo.current_role ? <Layout /> : <Navigate to="/workspaces" replace />;
}

// Blocks Employees from accessing Manager/Owner routes
function ManagerRoute() {
  const role = getUserRole();
  const isPrivileged = role === 'owner' || role === 'manager';
  return isPrivileged ? <Outlet /> : <Navigate to="/products" replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/workspaces" element={<WorkspacePage />} />

            <Route element={<WorkspaceRequiredRoute />}>
              {/* Universal Routes (All Roles) */}
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/about" element={<AboutPage />} /> 

              {/* Privileged Routes (Managers & Owners Only) */}
              <Route element={<ManagerRoute />}>
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/logs" element={<LogsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/products" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}