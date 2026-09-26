import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { EnquiriesPage } from './pages/EnquiriesPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { SalesOrdersPage } from './pages/SalesOrdersPage';
import { InventoryPage } from './pages/InventoryPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/enquiries" replace />} />
            <Route path="enquiries" element={<EnquiriesPage />} />
            <Route path="quotations" element={<QuotationsPage />} />
            <Route path="sales-orders" element={<SalesOrdersPage />} />
            <Route path="inventory" element={<InventoryPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/enquiries" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
