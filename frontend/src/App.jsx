import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleGuard } from './components/RoleGuard';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { SalesDashboardPage } from './pages/SalesDashboardPage';
import { EnquiriesPage } from './pages/EnquiriesPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { SalesOrdersPage } from './pages/SalesOrdersPage';
import { InventoryPage } from './pages/InventoryPage';

// Helper component for Root "/" Redirection
const RootRedirect = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={isAdmin ? '/admin/dashboard' : '/sales/dashboard'} replace />;
};

// Helper component for Legacy Short Route Redirection (/dashboard, /enquiries, etc.)
const LegacyRedirect = ({ target }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  const prefix = isAdmin ? '/admin' : '/sales';
  return <Navigate to={`${prefix}/${target}`} replace />;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Root Route Handler */}
          <Route path="/" element={<RootRedirect />} />

          {/* Legacy / Direct Route Compatibility */}
          <Route path="/dashboard" element={<LegacyRedirect target="dashboard" />} />
          <Route path="/enquiries" element={<LegacyRedirect target="enquiries" />} />
          <Route path="/quotations" element={<LegacyRedirect target="quotations" />} />
          <Route path="/sales-orders" element={<LegacyRedirect target="sales-orders" />} />
          <Route path="/inventory" element={<LegacyRedirect target="inventory" />} />

          {/* Protected ADMIN Module Routes (/admin/*) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['ADMIN']}>
                  <Layout />
                </RoleGuard>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="enquiries" element={<EnquiriesPage />} />
            <Route path="quotations" element={<QuotationsPage />} />
            <Route path="sales-orders" element={<SalesOrdersPage />} />
            <Route path="inventory" element={<InventoryPage />} />
          </Route>

          {/* Protected SALES USER Module Routes (/sales/*) */}
          <Route
            path="/sales"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['SALES_USER']}>
                  <Layout />
                </RoleGuard>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/sales/dashboard" replace />} />
            <Route path="dashboard" element={<SalesDashboardPage />} />
            <Route path="enquiries" element={<EnquiriesPage />} />
            <Route path="quotations" element={<QuotationsPage />} />
            <Route path="sales-orders" element={<SalesOrdersPage />} />
            <Route path="inventory" element={<InventoryPage />} />
          </Route>

          {/* Wildcard Fallback Handler */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
