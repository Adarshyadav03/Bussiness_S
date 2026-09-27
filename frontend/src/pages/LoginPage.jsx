import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Factory, Lock, Mail, UserPlus } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const successMessage = location.state?.successMessage;

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdmin ? '/admin/dashboard' : '/sales/dashboard', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      navigate(result.user?.role === 'ADMIN' ? '/admin/dashboard' : '/sales/dashboard');
    }
  };

  const handleQuickLogin = async (emailVal, passVal) => {
    setEmail(emailVal);
    setPassword(passVal);
    const result = await login(emailVal, passVal);
    if (result.success) {
      navigate(result.user?.role === 'ADMIN' ? '/admin/dashboard' : '/sales/dashboard');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Factory size={48} color="#2563eb" style={{ marginBottom: '0.5rem' }} />
          <h2 style={{ fontSize: '1.5rem', color: '#0f172a' }}>ERP SYSTEM</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Welcome Back
          </p>
        </div>

        {successMessage && (
          <div className="alert alert-success" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {successMessage}
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'LOGIN'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
            Don't have an account?
          </p>
          <Link to="/signup" className="btn btn-secondary" style={{ width: '100%', display: 'inline-block', textAlign: 'center' }}>
            SIGN UP
          </Link>
        </div>

        <div className="demo-credentials" style={{ marginTop: '1.5rem' }}>
          <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>
            Demo Credentials (Click to Quick Login):
          </h4>
          <button
            type="button"
            className="quick-btn"
            onClick={() => handleQuickLogin('sales@example.com', 'sales123')}
          >
            <strong>SALES USER:</strong> sales@example.com (sales123)
          </button>
          <button
            type="button"
            className="quick-btn"
            onClick={() => handleQuickLogin('admin@example.com', 'admin123')}
          >
            <strong>ADMIN USER:</strong> admin@example.com (admin123)
          </button>
        </div>
      </div>
    </div>
  );
};
