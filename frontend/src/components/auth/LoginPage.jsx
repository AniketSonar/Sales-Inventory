import React from 'react';
import LoginCard from './LoginCard';
import './Auth.css';

export default function LoginPage() {
  return (
    <div className="login-viewport">
      {/* Top Header: Brand Aligned at top-left */}
      <header className="login-top-header">
        <div className="login-brand-header">
          <img
            src="/b2b-logo-transparent.png"
            alt="NexFlow"
            className="login-brand-logo"
          />
          <div className="login-brand-divider" />
          <span className="login-brand-name">NexFlow</span>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <main className="login-container">
        {/* Left Column: Bold, Left-Aligned Hero Section */}
        <div className="login-brand-col">
          <div className="login-hero-text">
            <h1 className="login-title">
              Smarter Business<br />
              <span className="login-title-highlight">Management</span>
            </h1>
            <p className="login-subtitle">Connect. Manage. Grow.</p>
          </div>
        </div>

        {/* Right Column: Clean Floating Login Card in Right Workspace */}
        <div className="login-card-col">
          <LoginCard />
        </div>
      </main>

      {/* Clean Bottom Copyright Note */}
      <footer className="login-bottom-footer">
        <span>&copy; {new Date().getFullYear()} NexFlow Systems. Enterprise Security &amp; Data Isolation.</span>
      </footer>
    </div>
  );
}
