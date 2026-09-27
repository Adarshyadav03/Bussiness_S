import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Factory, User, Mail, Lock, ShieldCheck, ArrowLeft } from 'lucide-react';

export const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState(null);

  const { signup, loading, error, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdmin ? '/admin/dashboard' : '/sales/dashboard', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('Name is required.');
      return;
    }
    if (!email.trim()) {
      setValidationError('Valid email address is required.');
      return;
    }
    if (password.length < 4) {
      setValidationError('Password must be at least 4 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Password confirmation does not match.');
      return;
    }

    const result = await signup(name, email, password);
    if (result.success) {
      navigate('/login', {
        state: { successMessage: 'Account created successfully. Please login.' },
      });
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Factory size={48} color="#2563eb" style={{ marginBottom: '0.5rem' }} />
          <h2 style={{ fontSize: '1.5rem', color: '#0f172a' }}>ERP System Registration</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Create a new Sales User account
          </p>
        </div>

        {(validationError || error) && (
          <div className="alert alert-danger">{validationError || error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
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

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Registering Account...' : 'SIGN UP'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
            Already have an account?
          </p>
          <Link to="/login" className="btn btn-secondary" style={{ width: '100%', display: 'inline-block', textAlign: 'center' }}>
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
