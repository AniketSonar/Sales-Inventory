import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginCard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const quickRoles = [
    { label: 'Admin', email: 'admin@company.com' },
    { label: 'Receptionist', email: 'reception@company.com' },
    { label: 'Sales', email: 'sales@company.com' },
    { label: 'Purchase', email: 'purchase@company.com' },
    { label: 'Store', email: 'store@company.com' }
  ];

  const handleQuickFill = (targetEmail) => {
    setEmail(targetEmail);
    setPassword('password123');
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Login failed. Check your credentials.');
        setLoading(false);
        return;
      }

      // Save session & user
      localStorage.setItem('access_token', data.session.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect by role
      const role = data.user.role?.toLowerCase();
      if (role === 'admin') navigate('/admin-dashboard', { replace: true });
      else if (role === 'receptionist') navigate('/receptionist-dashboard', { replace: true });
      else if (role === 'sales') navigate('/sales-dashboard', { replace: true });
      else if (role === 'purchase') navigate('/purchase-dashboard', { replace: true });
      else if (role === 'store') navigate('/store-dashboard', { replace: true });
      else setError('Unknown user role assigned.');
    } catch (err) {
      console.error(err);
      setError('Unable to reach server. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card-box">
      <div className="login-header">
        <h2>Sign In</h2>
        <p>Access your department dashboard</p>
      </div>

      {error && (
        <div className="login-error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Role Fillers for seamless testing */}
      <div className="demo-roles-banner">
        <div className="demo-badge">
          <Sparkles size={14} color="#2563eb" />
          <span>Quick Login:</span>
        </div>
        <div className="demo-btns">
          {quickRoles.map(r => (
            <button
              key={r.label}
              type="button"
              className="demo-btn"
              onClick={() => handleQuickFill(r.email)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleLogin} className="login-form">
        <div className="form-group">
          <label>Email Address</label>
          <div className="input-icon-wrap">
            <Mail size={18} className="input-icon" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sales@company.com"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Password</label>
          <div className="input-icon-wrap">
            <Lock size={18} className="input-icon" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button type="submit" className="btn-login-submit" disabled={loading}>
          {loading ? 'Authenticating...' : <>Log In to Dashboard <ArrowRight size={18} /></>}
        </button>
      </form>
    </div>
  );
}
