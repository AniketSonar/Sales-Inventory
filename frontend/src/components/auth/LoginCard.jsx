import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function LoginCard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeRole, setActiveRole] = useState(null);

  const quickRoles = [
    { label: 'Admin', email: 'admin@company.com' },
    { label: 'Reception', email: 'reception@company.com' },
    { label: 'Sales', email: 'sales@company.com' },
    { label: 'Purchase', email: 'purchase@company.com' },
    { label: 'Store', email: 'store@company.com' }
  ];

  const handleQuickFill = (roleObj) => {
    setEmail(roleObj.email);
    setPassword('password123');
    setActiveRole(roleObj.label);
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
        setError(data.message || 'Authentication failed. Please check credentials.');
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
      else setError('Unknown department role assigned.');
    } catch (err) {
      console.error(err);
      setError('Unable to reach server. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card">
      <div className="login-card-head">
        <h2>Welcome Back</h2>
        <p>Sign in to continue</p>
      </div>

      {error && (
        <div className="login-alert-banner">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Login Chips */}
      <div className="login-quick-row">
        <span className="login-quick-label">QUICK:</span>
        <div className="login-quick-chips">
          {quickRoles.map((r) => (
            <button
              key={r.label}
              type="button"
              className={`login-quick-pill ${activeRole === r.label ? 'active' : ''}`}
              onClick={() => handleQuickFill(r)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleLogin} className="login-form">
        <div className="login-input-group">
          <Mail size={18} className="login-input-icon" />
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setActiveRole(null);
            }}
            placeholder="name@company.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="login-input-group">
          <Lock size={18} className="login-input-icon" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setActiveRole(null);
            }}
            placeholder="Password"
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            className="login-eye-btn"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="login-options-row">
          <label className="login-remember-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Remember me</span>
          </label>
          <a
            href="#forgot"
            className="login-forgot-link"
            onClick={(e) => {
              e.preventDefault();
              alert('Please contact your administrator (admin@company.com) to reset credentials.');
            }}
          >
            Forgot Password?
          </a>
        </div>

        <button type="submit" className="login-submit-btn" disabled={loading}>
          {loading ? (
            'Signing In...'
          ) : (
            <>
              Sign In <ArrowRight size={17} />
            </>
          )}
        </button>

        <div className="login-divider">
          <span>or</span>
        </div>

        <div className="login-security-footer">
          <ShieldCheck size={16} color="#18476c" />
          <span>Secure access to your account</span>
        </div>
      </form>
    </div>
  );
}
