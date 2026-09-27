import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldAlert } from 'lucide-react';

export const RoleGuard = ({ allowedRoles, children }) => {
  const { user, isAdmin } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center', maxWidth: '500px', margin: '3rem auto' }} className="card">
        <ShieldAlert size={56} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.5rem', color: '#991b1b', marginBottom: '0.5rem' }}>Access Denied</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
          You do not have permission to access this page. Required role: <strong>{allowedRoles.join(', ')}</strong>.
        </p>
        <Link
          to={isAdmin ? '/admin/dashboard' : '/sales/dashboard'}
          className="btn btn-primary"
        >
          Return to My Dashboard
        </Link>
      </div>
    );
  }

  return children;
};
