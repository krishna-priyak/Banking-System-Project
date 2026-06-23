import React, { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import CustomerDashboard from './components/CustomerDashboard';
import AdminDashboard from './components/AdminDashboard';

const BACKEND_URL = `http://${window.location.hostname}:5000`;

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedAccount = localStorage.getItem('account');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      if (savedAccount) {
        setAccount(JSON.parse(savedAccount));
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (newToken, newUser, newAccount) => {
    setToken(newToken);
    setUser(newUser);
    setAccount(newAccount);

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    if (newAccount) {
      localStorage.setItem('account', JSON.stringify(newAccount));
    } else {
      localStorage.removeItem('account');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setAccount(null);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('account');
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="animate-float" style={styles.spinner}>$</div>
        <h2 style={{ marginTop: '20px', color: 'var(--text-muted)' }}>Loading BnK SYS...</h2>
      </div>
    );
  }

  if (!token) {
    return (
      <AuthPage 
        onLoginSuccess={handleLoginSuccess} 
        backendUrl={BACKEND_URL} 
      />
    );
  }

  if (user.role === 'admin') {
    return (
      <AdminDashboard 
        token={token} 
        user={user} 
        onLogout={handleLogout} 
        backendUrl={BACKEND_URL} 
      />
    );
  }

  return (
    <CustomerDashboard 
      token={token} 
      user={user} 
      account={account} 
      onLogout={handleLogout} 
      backendUrl={BACKEND_URL} 
    />
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'var(--bg-color)'
  },
  spinner: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'var(--primary-glow)',
    color: '#030712',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: '800',
    boxShadow: '0 0 30px rgba(0, 242, 254, 0.3)'
  }
};
