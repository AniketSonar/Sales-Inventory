import React from 'react';
import Hero from './Hero';
import LoginCard from './LoginCard';
import './Auth.css';

export default function LoginPage() {
  return (
    <div className="auth-shell">
      <div className="auth-container">
        <section className="auth-hero-section">
          <Hero />
        </section>
        <section className="auth-card-section">
          <LoginCard />
        </section>
      </div>
    </div>
  );
}
