import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User, ShieldAlert } from 'lucide-react';

export default function AuthPage({ onLoginSuccess, backendUrl }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed. Please check your credentials.');
      }

      onLoginSuccess(data.token, data.user, data.account);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass-panel" style={styles.card}>
        <div style={styles.header}>
          <div className="animate-float" style={styles.logoBadge}>
            $
          </div>
          <h1 style={styles.title}>
            <span className="gradient-text">BnK</span> SYS
          </h1>
          <p style={styles.subtitle}>Secure Full-Stack Banking Platform</p>
        </div>

        <div style={styles.tabContainer}>
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            style={{
              ...styles.tabButton,
              borderBottom: isLogin ? '2px solid var(--primary)' : '2px solid transparent',
              color: isLogin ? 'var(--text-main)' : 'var(--text-muted)'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            style={{
              ...styles.tabButton,
              borderBottom: !isLogin ? '2px solid var(--primary)' : '2px solid transparent',
              color: !isLogin ? 'var(--text-main)' : 'var(--text-muted)'
            }}
          >
            Register
          </button>
        </div>

        {error && (
          <div style={styles.errorBanner}>
            <ShieldAlert size={18} color="var(--danger)" />
            <span style={{ fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div className="inputWrapper" style={styles.inputWrapper}>
              <User size={18} style={styles.inputIcon} />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="inputWrapper" style={styles.inputWrapper}>
            <Mail size={18} style={styles.inputIcon} />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="inputWrapper" style={styles.inputWrapper}>
            <Lock size={18} style={styles.inputIcon} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={styles.submitBtn}
          >
            {loading ? 'Processing...' : isLogin ? 'Access System' : 'Create Account'}
          </button>
        </form>

        <div style={styles.footerText}>
          {isLogin ? (
            <p>
              Demo credentials: <br />
              Customer: <code style={styles.code}>john@bank.com</code> / <code style={styles.code}>customer123</code> <br />
              Admin: <code style={styles.code}>admin@bank.com</code> / <code style={styles.code}>admin123</code>
            </p>
          ) : (
            <p>Registration creates a new customer account and deposits a welcome balance of $1,000.00.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px'
  },
  card: {
    width: '100%',
    maxWidth: '450px',
    padding: '40px 30px',
    animation: 'slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  logoBadge: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    background: 'var(--primary-glow)',
    color: '#030712',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: '800',
    marginBottom: '15px'
  },
  title: {
    fontSize: '2.2rem',
    fontWeight: '800',
    letterSpacing: '-1px',
    marginBottom: '5px'
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem'
  },
  tabContainer: {
    display: 'flex',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    marginBottom: '25px'
  },
  tabButton: {
    flex: 1,
    padding: '12px',
    background: 'none',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition)'
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'var(--danger-bg)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '12px',
    borderRadius: '10px',
    marginBottom: '20px',
    color: 'var(--text-main)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px'
  },
  inputWrapper: {
    position: 'relative'
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)'
  },
  eyeBtn: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitBtn: {
    width: '100%',
    marginTop: '10px'
  },
  footerText: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    marginTop: '25px',
    lineHeight: '1.6',
    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
    paddingTop: '20px'
  },
  code: {
    background: 'rgba(255,255,255,0.06)',
    padding: '2px 6px',
    borderRadius: '4px',
    color: 'var(--primary)',
    fontFamily: 'monospace'
  }
};

// Insert inputs custom styles dynamically
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .inputWrapper input {
      padding-left: 48px !important;
      padding-right: 48px !important;
    }
  `;
  document.head.appendChild(style);
}
