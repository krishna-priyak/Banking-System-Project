import React, { useState, useEffect } from 'react';
import { 
  Users, Activity, DollarSign, UserPlus, ShieldAlert, 
  CheckCircle, FileText, ArrowRight, RefreshCw, LogOut,
  Search, Lock, Unlock, TrendingUp
} from 'lucide-react';

export default function AdminDashboard({ token, user, onLogout, backendUrl }) {
  const [stats, setStats] = useState({
    totalDeposits: 0,
    activeAccountsCount: 0,
    frozenAccountsCount: 0,
    totalTransactionsCount: 0,
    transfersCount: 0,
    depositsCount: 0,
    withdrawalsCount: 0
  });
  
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // Form Create Customer
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [initialBalance, setInitialBalance] = useState('');

  // UI States
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, customers, transactions, reports
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [txSearch, setTxSearch] = useState('');

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchTransactions();
  }, []);

  const triggerAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: 'success' });
    }, 5000);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/admin/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data.reports);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/admin/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error('Failed to fetch admin transactions:', err);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return;
    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/admin/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          initial_balance: initialBalance || '0'
        })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Creation failed');

      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setInitialBalance('');
      triggerAlert(data.message, 'success');
      
      // Refresh statistics and lists
      fetchStats();
      fetchUsers();
      fetchTransactions();
    } catch (err) {
      triggerAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFreeze = async (userId, currentStatus) => {
    const action = currentStatus === 'active' ? 'freeze' : 'activate';
    
    try {
      const res = await fetch(`${backendUrl}/api/admin/toggle-freeze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: userId, action })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Action failed');

      triggerAlert(data.message, 'success');
      
      // Refresh data
      fetchStats();
      fetchUsers();
    } catch (err) {
      triggerAlert(err.message, 'error');
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  // Filter lists
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.account_no && u.account_no.includes(userSearch))
  );

  const filteredTransactions = transactions.filter(t => 
    (t.sender_account && t.sender_account.includes(txSearch)) ||
    (t.receiver_account && t.receiver_account.includes(txSearch)) ||
    t.transaction_type.toLowerCase().includes(txSearch.toLowerCase())
  );

  return (
    <div style={styles.dashboardContainer}>
      {/* Alert toast */}
      {alert.show && (
        <div style={{
          ...styles.alertToast,
          backgroundColor: alert.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
          borderColor: alert.type === 'success' ? 'var(--success)' : 'var(--danger)',
        }}>
          {alert.type === 'success' ? (
            <CheckCircle size={20} color="var(--success)" />
          ) : (
            <ShieldAlert size={20} color="var(--danger)" />
          )}
          <span style={{ fontWeight: '500' }}>{alert.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="glass-panel" style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIndicator}>$</div>
          <span style={styles.logoText}><span className="gradient-text">BnK</span> SYS</span>
          <span className="badge badge-danger" style={{ marginLeft: '10px' }}>Admin Panel</span>
        </div>
        <nav style={styles.nav}>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            style={{ ...styles.navLink, color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-muted)' }}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('customers')} 
            style={{ ...styles.navLink, color: activeTab === 'customers' ? 'var(--primary)' : 'var(--text-muted)' }}
          >
            Manage Users
          </button>
          <button 
            onClick={() => setActiveTab('transactions')} 
            style={{ ...styles.navLink, color: activeTab === 'transactions' ? 'var(--primary)' : 'var(--text-muted)' }}
          >
            Transactions Log
          </button>
          <button 
            onClick={() => setActiveTab('reports')} 
            style={{ ...styles.navLink, color: activeTab === 'reports' ? 'var(--primary)' : 'var(--text-muted)' }}
          >
            Reports
          </button>
        </nav>
        <div style={styles.userInfo}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Admin: <strong>{user.name}</strong></span>
          <button onClick={onLogout} className="btn btn-secondary" style={styles.logoutBtn}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={styles.mainContent}>
        {activeTab === 'dashboard' && (
          <div style={styles.dashboardGrid}>
            {/* Stats Cards Row */}
            <div style={styles.statsRow}>
              <div className="glass-panel" style={styles.statCard}>
                <div style={styles.statIconContainer}><DollarSign size={20} color="var(--primary)" /></div>
                <div>
                  <span style={styles.statLabel}>Total System Deposits</span>
                  <h3 style={styles.statValue}>${stats.totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                </div>
              </div>
              <div className="glass-panel" style={styles.statCard}>
                <div style={styles.statIconContainer}><Users size={20} color="var(--success)" /></div>
                <div>
                  <span style={styles.statLabel}>Active Customers</span>
                  <h3 style={styles.statValue}>{stats.activeAccountsCount}</h3>
                </div>
              </div>
              <div className="glass-panel" style={styles.statCard}>
                <div style={styles.statIconContainer}><ShieldAlert size={20} color="var(--danger)" /></div>
                <div>
                  <span style={styles.statLabel}>Frozen Accounts</span>
                  <h3 style={styles.statValue}>{stats.frozenAccountsCount}</h3>
                </div>
              </div>
              <div className="glass-panel" style={styles.statCard}>
                <div style={styles.statIconContainer}><Activity size={20} color="var(--warning)" /></div>
                <div>
                  <span style={styles.statLabel}>Total Transactions Logged</span>
                  <h3 style={styles.statValue}>{stats.totalTransactionsCount}</h3>
                </div>
              </div>
            </div>

            {/* Split layout: Create customer on left, mini user list on right */}
            <div style={styles.splitRow}>
              {/* Form Card */}
              <div className="glass-panel" style={styles.formCard}>
                <h3 style={styles.cardTitle}><UserPlus size={18} /> Create Customer Account</h3>
                <form onSubmit={handleCreateCustomer} style={styles.form}>
                  <div className="inputWrapper">
                    <input 
                      type="text" 
                      placeholder="Customer Full Name" 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)} 
                      required
                    />
                  </div>
                  <div className="inputWrapper">
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      value={newEmail} 
                      onChange={(e) => setNewEmail(e.target.value)} 
                      required
                    />
                  </div>
                  <div className="inputWrapper">
                    <input 
                      type="password" 
                      placeholder="Temporary Password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      required
                    />
                  </div>
                  <div className="inputWrapper">
                    <input 
                      type="number" 
                      placeholder="Initial Opening Balance ($)" 
                      value={initialBalance} 
                      onChange={(e) => setInitialBalance(e.target.value)} 
                      min="0"
                      step="any"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
                    Create Account
                  </button>
                </form>
              </div>

              {/* Quick User List Card */}
              <div className="glass-panel" style={styles.listCard}>
                <div style={styles.cardHeaderSection}>
                  <h3 style={styles.cardTitle}><Users size={18} /> Active Customers</h3>
                  <button onClick={() => setActiveTab('customers')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    Manage Users
                  </button>
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <table className="custom-table" style={{ width: '100%', minWidth: 'auto' }}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Account</th>
                        <th>Balance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.role !== 'admin').slice(0, 5).map(u => (
                        <tr key={u.user_id}>
                          <td>{u.name}</td>
                          <td><code>{u.account_no || 'None'}</code></td>
                          <td style={{ fontWeight: '600' }}>${(u.balance || 0).toFixed(2)}</td>
                          <td>
                            <span className={`badge ${u.account_status === 'active' ? 'badge-success' : 'badge-frozen'}`}>
                              {u.account_status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="glass-panel" style={styles.tableCard}>
            <div style={styles.tableHeaderSection}>
              <h3 style={styles.tableTitle}><Users size={18} /> User Accounts Management</h3>
              <div style={styles.searchWrapper}>
                <Search size={16} style={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Search by name, email, or account no..." 
                  value={userSearch} 
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
            </div>
            <div className="custom-table-container">
              {filteredUsers.length === 0 ? (
                <p style={styles.emptyTableText}>No users matched your search criteria.</p>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>UID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Account Number</th>
                      <th>Role</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.user_id}>
                        <td>#{u.user_id}</td>
                        <td><strong>{u.name}</strong></td>
                        <td>{u.email}</td>
                        <td><code>{u.account_no || 'N/A'}</code></td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'badge-danger' : 'badge-warning'}`}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontWeight: '700' }}>
                          {u.role === 'admin' ? '-' : `$${(u.balance || 0).toFixed(2)}`}
                        </td>
                        <td>
                          <span className={`badge ${u.account_status === 'active' ? 'badge-success' : 'badge-frozen'}`}>
                            {u.account_status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {u.role !== 'admin' ? (
                            u.account_status === 'active' ? (
                              <button 
                                onClick={() => handleToggleFreeze(u.user_id, u.account_status)} 
                                className="btn btn-danger"
                                style={styles.actionBtn}
                              >
                                <Lock size={12} /> Freeze
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleToggleFreeze(u.user_id, u.account_status)} 
                                className="btn btn-success"
                                style={styles.actionBtn}
                              >
                                <Unlock size={12} /> Activate
                              </button>
                            )
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>System Protected</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="glass-panel" style={styles.tableCard}>
            <div style={styles.tableHeaderSection}>
              <h3 style={styles.tableTitle}><Activity size={18} /> Global System Transaction Logs</h3>
              <div style={styles.searchWrapper}>
                <Search size={16} style={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Filter by account no or type..." 
                  value={txSearch} 
                  onChange={(e) => setTxSearch(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
            </div>
            <div className="custom-table-container">
              {filteredTransactions.length === 0 ? (
                <p style={styles.emptyTableText}>No transactions logged in the system.</p>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>TXID</th>
                      <th>Type</th>
                      <th>Sender Account</th>
                      <th>Receiver Account</th>
                      <th>Amount</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map(tx => (
                      <tr key={tx.transaction_id}>
                        <td>#{tx.transaction_id}</td>
                        <td>
                          <span className={`badge ${
                            tx.transaction_type === 'deposit' ? 'badge-success' :
                            tx.transaction_type === 'withdrawal' ? 'badge-danger' : 'badge-warning'
                          }`}>
                            {tx.transaction_type.toUpperCase()}
                          </span>
                        </td>
                        <td><code>{tx.sender_account || 'System/External'}</code></td>
                        <td><code>{tx.receiver_account || 'System/External'}</code></td>
                        <td style={{ fontWeight: '700', color: tx.transaction_type === 'deposit' ? 'var(--success)' : tx.transaction_type === 'withdrawal' ? 'var(--danger)' : 'var(--text-main)' }}>
                          ${tx.amount.toFixed(2)}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{new Date(tx.date_time).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="glass-panel" style={styles.reportPanel}>
            <div style={styles.reportHeader}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>System Audit & Analytics Report</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Generated: {new Date().toLocaleString()}</p>
              </div>
              <button onClick={handlePrintReport} className="btn btn-primary">
                <FileText size={16} /> Print/Save PDF Report
              </button>
            </div>

            <hr style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '20px 0' }} />

            <div style={styles.reportContent}>
              <div style={styles.reportSection}>
                <h4>System Account Ratios</h4>
                <div style={styles.ratioGrid}>
                  <div style={styles.ratioBox}>
                    <span style={styles.ratioLabel}>Active Users</span>
                    <span style={styles.ratioValue}>{stats.activeAccountsCount}</span>
                  </div>
                  <div style={styles.ratioBox}>
                    <span style={styles.ratioLabel}>Frozen Users</span>
                    <span style={styles.ratioValue}>{stats.frozenAccountsCount}</span>
                  </div>
                  <div style={styles.ratioBox}>
                    <span style={styles.ratioLabel}>Total Users</span>
                    <span style={styles.ratioValue}>{stats.activeAccountsCount + stats.frozenAccountsCount}</span>
                  </div>
                </div>
              </div>

              <div style={styles.reportSection}>
                <h4>Transaction Type Distributions</h4>
                <div style={styles.distributionList}>
                  <div style={styles.distRow}>
                    <span>Deposits Simulation</span>
                    <strong>{stats.depositsCount} transactions</strong>
                  </div>
                  <div style={styles.distRow}>
                    <span>Withdrawals Simulation</span>
                    <strong>{stats.withdrawalsCount} transactions</strong>
                  </div>
                  <div style={styles.distRow}>
                    <span>Account-to-Account Transfers</span>
                    <strong>{stats.transfersCount} transactions</strong>
                  </div>
                  <hr style={{ borderColor: 'rgba(255,255,255,0.04)', margin: '10px 0' }} />
                  <div style={styles.distRow}>
                    <strong>Total Transactions Logged</strong>
                    <strong>{stats.totalTransactionsCount} transactions</strong>
                  </div>
                </div>
              </div>

              <div style={styles.reportSection}>
                <h4>Financial Health Overview</h4>
                <div style={styles.reportStats}>
                  <div style={styles.reportStatRow}>
                    <span>Total Deposit Hold (Sum of all balances)</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)' }}>
                      ${stats.totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div style={styles.reportStatRow}>
                    <span>Average Customer Balance</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--success)' }}>
                      ${(stats.activeAccountsCount + stats.frozenAccountsCount > 0 
                        ? stats.totalDeposits / (stats.activeAccountsCount + stats.frozenAccountsCount) 
                        : 0
                      ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  dashboardContainer: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  alertToast: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '16px 24px',
    borderRadius: '12px',
    border: '1px solid',
    color: 'var(--text-main)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
    animation: 'slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
  },
  logoIndicator: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'var(--primary-glow)',
    color: '#030712',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    marginRight: '10px'
  },
  logoText: {
    fontSize: '1.4rem',
    fontWeight: '800',
    letterSpacing: '-0.5px'
  },
  nav: {
    display: 'flex',
    gap: '15px'
  },
  navLink: {
    background: 'none',
    border: 'none',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '6px',
    transition: 'var(--transition)'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  logoutBtn: {
    padding: '8px 14px',
    fontSize: '0.85rem'
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  dashboardGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px'
  },
  statCard: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  statIconContainer: {
    width: '45px',
    height: '45px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statLabel: {
    display: 'block',
    fontSize: '0.8rem',
    color: 'var(--text-muted)'
  },
  statValue: {
    fontSize: '1.4rem',
    fontWeight: '800',
    marginTop: '2px'
  },
  splitRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.3fr',
    gap: '20px'
  },
  formCard: {
    padding: '24px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  cardTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  listCard: {
    padding: '24px'
  },
  cardHeaderSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  tableCard: {
    padding: '24px'
  },
  tableHeaderSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  tableTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  searchWrapper: {
    position: 'relative',
    width: '300px'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)'
  },
  searchInput: {
    paddingLeft: '38px',
    fontSize: '0.85rem'
  },
  emptyTableText: {
    textAlign: 'center',
    padding: '40px',
    color: 'var(--text-muted)',
    fontSize: '0.9rem'
  },
  actionBtn: {
    padding: '6px 12px',
    fontSize: '0.8rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  },
  reportPanel: {
    padding: '40px'
  },
  reportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  reportContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px'
  },
  reportSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  ratioGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px'
  },
  ratioBox: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '10px',
    padding: '15px 20px',
    display: 'flex',
    flexDirection: 'column'
  },
  ratioLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)'
  },
  ratioValue: {
    fontSize: '1.3rem',
    fontWeight: '700',
    marginTop: '4px'
  },
  distributionList: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '10px',
    padding: '20px'
  },
  distRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '0.95rem'
  },
  reportStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  reportStatRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '10px',
    padding: '15px 20px'
  }
};
