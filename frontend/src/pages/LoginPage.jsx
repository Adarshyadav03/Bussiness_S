import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Factory, Lock, Mail, Shield, UserCheck } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      navigate('/enquiries');
    }
  };

  const handleQuickLogin = (emailVal, passVal) => {
    setEmail(emailVal);
    setPassword(passVal);
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Factory size={48} color="#2563eb" style={{ marginBottom: '0.5rem' }} />
          <h2 style={{ fontSize: '1.5rem', color: '#0f172a' }}>Manufacturing ERP</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Sign in to access your dashboard
          </p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
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
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-credentials">
          <h4>Demo Credentials (Click to Autofill):</h4>
          <button
            className="quick-btn"
            onClick={() => handleQuickLogin('sales@example.com', 'sales123')}
          >
            <strong>SALES USER:</strong> sales@example.com (sales123)
          </button>
          <button
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
