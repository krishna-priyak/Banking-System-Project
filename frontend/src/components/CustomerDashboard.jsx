import React, { useState, useEffect, useRef } from 'react';
import { 
  DollarSign, ArrowUpRight, ArrowDownLeft, Send, 
  History, Key, LogOut, MessageSquare, X, Play, 
  CheckCircle, AlertTriangle, ArrowRight, ShieldAlert, Cpu
} from 'lucide-react';

export default function CustomerDashboard({ token, user, account, onLogout, backendUrl }) {
  const [balance, setBalance] = useState(account?.balance || 0);
  const [accountNo] = useState(account?.account_no || '');
  const [transactions, setTransactions] = useState([]);
  
  // Transaction Forms
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  
  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // UI States
  const [activeTab, setActiveTab] = useState('overview'); // overview, history, settings
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  
  // Chatbot State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: `Hi ${user.name}! Welcome to **BnK SYS** AI Assistant. Ask me anything about your account, transactions, or banking queries. Try clicking one of the suggestions below!` }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  const chatBottomRef = useRef(null);

  // Suggestions for Chatbot
  const chatbotSuggestions = [
    "Check my balance",
    "Show my last 5 transactions",
    "How much did I spend this month?",
    "Show my account details",
    "How do I transfer money?"
  ];

  useEffect(() => {
    fetchTransactions();
    fetchAccountData();
  }, []);

  useEffect(() => {
    if (chatOpen) {
      scrollToBottom();
    }
  }, [chatMessages, chatOpen, chatLoading]);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const triggerAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: 'success' });
    }, 5000);
  };

  const fetchAccountData = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/customer/account`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.account.balance);
      }
    } catch (err) {
      console.error('Failed to fetch account status:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/customer/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  // Transaction Actions
  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/customer/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: depositAmount })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Deposit failed');

      setBalance(data.balance);
      setDepositAmount('');
      triggerAlert(data.message, 'success');
      fetchTransactions();
    } catch (err) {
      triggerAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/customer/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: withdrawAmount })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Withdrawal failed');

      setBalance(data.balance);
      setWithdrawAmount('');
      triggerAlert(data.message, 'success');
      fetchTransactions();
    } catch (err) {
      triggerAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferRecipient || !transferAmount || parseFloat(transferAmount) <= 0) return;
    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/customer/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiver_account_no: transferRecipient,
          amount: transferAmount
        })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Transfer failed');

      setBalance(data.balance);
      setTransferRecipient('');
      setTransferAmount('');
      triggerAlert(data.message, 'success');
      fetchTransactions();
    } catch (err) {
      triggerAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/customer/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Password update failed');

      setCurrentPassword('');
      setNewPassword('');
      triggerAlert(data.message, 'success');
    } catch (err) {
      triggerAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Chatbot Send message
  const handleChatSubmit = async (msgText) => {
    const textToSend = msgText || chatInput;
    if (!textToSend.trim()) return;

    if (!msgText) setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    setChatLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/customer/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: textToSend })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'AI failed to reply');

      // Check if the AI returned structured transaction data that might imply our balance updated, we sync balance
      if (data.data && (textToSend.toLowerCase().includes('spend') || textToSend.toLowerCase().includes('deposit') || textToSend.toLowerCase().includes('balance'))) {
        fetchAccountData();
      }

      setChatMessages(prev => [...prev, { sender: 'bot', text: data.text }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'bot', text: `Sorry, I'm having trouble connecting to the system right now. Details: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Helper formatting for markdown in chatbot (bold, lists)
  const formatChatMessage = (text) => {
    return text.split('\n').map((line, idx) => {
      let formattedLine = line;
      // Bold **text**
      formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Inline code `code`
      formattedLine = formattedLine.replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.08); padding: 2px 4px; border-radius: 4px; color: var(--primary); font-family: monospace;">$1</code>');
      // Bullet points
      if (line.startsWith('* ')) {
        return <li key={idx} dangerouslySetInnerHTML={{ __html: formattedLine.substring(2) }} style={{ marginLeft: '20px', marginY: '4px' }}></li>;
      }
      return <p key={idx} dangerouslySetInnerHTML={{ __html: formattedLine }} style={{ marginBottom: '8px' }}></p>;
    });
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* Alert Toast Banner */}
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

      {/* Navigation Header */}
      <header className="glass-panel" style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIndicator}>$</div>
          <span style={styles.logoText}><span className="gradient-text">BnK</span> SYS</span>
          <span className="badge badge-success" style={{ marginLeft: '10px' }}>Customer Portal</span>
        </div>
        <nav style={styles.nav}>
          <button 
            onClick={() => setActiveTab('overview')} 
            style={{ ...styles.navLink, color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text-muted)' }}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('history')} 
            style={{ ...styles.navLink, color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-muted)' }}
          >
            Transaction History
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            style={{ ...styles.navLink, color: activeTab === 'settings' ? 'var(--primary)' : 'var(--text-muted)' }}
          >
            Security Settings
          </button>
        </nav>
        <div style={styles.userInfo}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Welcome, <strong>{user.name}</strong></span>
          <button onClick={onLogout} className="btn btn-secondary" style={styles.logoutBtn}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Main Content Areas */}
      <main style={styles.mainContent}>
        {activeTab === 'overview' && (
          <div style={styles.overviewGrid}>
            {/* Account Card (Glowing Glassmorphism) */}
            <div className="glass-panel" style={styles.accountCard}>
              <div style={styles.cardHeader}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Available Balance</span>
                <span className="badge badge-success">ACTIVE</span>
              </div>
              <h2 style={styles.balanceDisplay}>${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
              <div style={styles.cardFooter}>
                <div>
                  <span style={styles.cardFooterLabel}>ACCOUNT NO</span>
                  <span style={styles.cardFooterValue}>{accountNo}</span>
                </div>
                <div>
                  <span style={styles.cardFooterLabel}>HOLDER</span>
                  <span style={styles.cardFooterValue}>{user.name}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div style={styles.actionsGrid}>
              {/* Deposit Simulation */}
              <div className="glass-panel" style={styles.actionCard}>
                <h3 style={styles.cardTitle}><ArrowDownLeft color="var(--success)" size={20} /> Deposit Simulation</h3>
                <form onSubmit={handleDeposit} style={styles.actionForm}>
                  <div className="inputWrapper">
                    <input 
                      type="number" 
                      placeholder="Amount to Deposit" 
                      value={depositAmount} 
                      onChange={(e) => setDepositAmount(e.target.value)} 
                      min="1"
                      step="any"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-success" disabled={loading} style={{ width: '100%' }}>
                    Deposit Funds
                  </button>
                </form>
              </div>

              {/* Withdraw Simulation */}
              <div className="glass-panel" style={styles.actionCard}>
                <h3 style={styles.cardTitle}><ArrowUpRight color="var(--danger)" size={20} /> Withdraw Simulation</h3>
                <form onSubmit={handleWithdraw} style={styles.actionForm}>
                  <div className="inputWrapper">
                    <input 
                      type="number" 
                      placeholder="Amount to Withdraw" 
                      value={withdrawAmount} 
                      onChange={(e) => setWithdrawAmount(e.target.value)} 
                      min="1"
                      step="any"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-danger" disabled={loading} style={{ width: '100%' }}>
                    Withdraw Funds
                  </button>
                </form>
              </div>

              {/* Transfer Money */}
              <div className="glass-panel" style={{ ...styles.actionCard, gridColumn: 'span 2' }}>
                <h3 style={styles.cardTitle}><Send color="var(--primary)" size={18} /> Transfer Money</h3>
                <form onSubmit={handleTransfer} style={styles.transferForm}>
                  <div className="inputWrapper" style={{ flex: 2 }}>
                    <input 
                      type="text" 
                      placeholder="Recipient Account Number (e.g. 1009873421)" 
                      value={transferRecipient} 
                      onChange={(e) => setTransferRecipient(e.target.value)} 
                      required
                    />
                  </div>
                  <div className="inputWrapper" style={{ flex: 1 }}>
                    <input 
                      type="number" 
                      placeholder="Amount ($)" 
                      value={transferAmount} 
                      onChange={(e) => setTransferAmount(e.target.value)} 
                      min="1"
                      step="any"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ flexShrink: 0 }}>
                    Execute Transfer
                  </button>
                </form>
              </div>
            </div>

            {/* Mini History Table */}
            <div className="glass-panel" style={{ ...styles.tableCard, gridColumn: 'span 2' }}>
              <div style={styles.tableHeaderSection}>
                <h3 style={styles.tableTitle}><History size={18} /> Recent Activity</h3>
                <button onClick={() => setActiveTab('history')} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  View Full History
                </button>
              </div>
              <div className="custom-table-container">
                {transactions.length === 0 ? (
                  <p style={styles.emptyTableText}>No transaction history available yet.</p>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Sender</th>
                        <th>Receiver</th>
                        <th>Amount</th>
                        <th>Date Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 5).map((tx) => {
                        const isSender = tx.sender_account === accountNo;
                        const isReceiver = tx.receiver_account === accountNo;
                        let amountColor = 'var(--text-main)';
                        let typeSign = '';
                        
                        if (tx.transaction_type === 'deposit') {
                          amountColor = 'var(--success)';
                          typeSign = '+';
                        } else if (tx.transaction_type === 'withdrawal') {
                          amountColor = 'var(--danger)';
                          typeSign = '-';
                        } else if (tx.transaction_type === 'transfer') {
                          amountColor = isSender ? 'var(--danger)' : 'var(--success)';
                          typeSign = isSender ? '-' : '+';
                        }

                        return (
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
                            <td>{tx.sender_account || 'External'}</td>
                            <td>{tx.receiver_account || 'External'}</td>
                            <td style={{ color: amountColor, fontWeight: '700' }}>
                              {typeSign}${tx.amount.toFixed(2)}
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              {new Date(tx.date_time).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="glass-panel" style={styles.tableCard}>
            <div style={styles.tableHeaderSection}>
              <h3 style={styles.tableTitle}><History size={18} /> Complete Account Statement</h3>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total transactions: {transactions.length}</span>
            </div>
            <div className="custom-table-container">
              {transactions.length === 0 ? (
                <p style={styles.emptyTableText}>No transactions recorded on this account.</p>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Type</th>
                      <th>Sender Account</th>
                      <th>Receiver Account</th>
                      <th>Amount</th>
                      <th>Execution Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const isSender = tx.sender_account === accountNo;
                      let amountColor = 'var(--text-main)';
                      let typeSign = '';
                      
                      if (tx.transaction_type === 'deposit') {
                        amountColor = 'var(--success)';
                        typeSign = '+';
                      } else if (tx.transaction_type === 'withdrawal') {
                        amountColor = 'var(--danger)';
                        typeSign = '-';
                      } else if (tx.transaction_type === 'transfer') {
                        amountColor = isSender ? 'var(--danger)' : 'var(--success)';
                        typeSign = isSender ? '-' : '+';
                      }

                      return (
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
                          <td>{tx.sender_account || 'External (Simulation Deposit)'}</td>
                          <td>{tx.receiver_account || 'External (Simulation Cashout)'}</td>
                          <td style={{ color: amountColor, fontWeight: '700' }}>
                            {typeSign}${tx.amount.toFixed(2)}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {new Date(tx.date_time).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="glass-panel" style={styles.settingsContainer}>
            <h3 style={styles.settingsTitle}><Key size={18} /> Update Security Credentials</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem' }}>
              Ensure your new password uses a complex combination of letters, numbers, and symbols to maintain security.
            </p>
            <form onSubmit={handleChangePassword} style={styles.settingsForm}>
              <div className="inputWrapper">
                <input 
                  type="password" 
                  placeholder="Current Password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  required
                />
              </div>
              <div className="inputWrapper">
                <input 
                  type="password" 
                  placeholder="New Secure Password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
                Change Password
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ==========================================
          AI CHATBOT FLOATING WIDGET
          ========================================== */}
      <div style={styles.chatbotContainer}>
        {/* Floating Bubble Icon */}
        {!chatOpen && (
          <button 
            onClick={() => setChatOpen(true)} 
            style={styles.chatBubble}
            className="animate-float"
            title="Open AI Banking Assistant"
          >
            <MessageSquare size={24} />
            <span style={styles.chatBadge}>AI</span>
          </button>
        )}

        {/* Chat window glass layout */}
        {chatOpen && (
          <div className="glass-panel animate-slide-up" style={styles.chatWindow}>
            {/* Header */}
            <div style={styles.chatHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={18} color="var(--primary)" />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>AI Assistant</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>● Scoped Secure Sandbox</span>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} style={styles.chatCloseBtn}>
                <X size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div style={styles.chatBody}>
              {chatMessages.map((msg, index) => (
                <div 
                  key={index} 
                  style={{
                    ...styles.chatMessageRow,
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div 
                    style={{
                      ...styles.chatBubbleText,
                      background: msg.sender === 'user' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.06)',
                      color: msg.sender === 'user' ? '#030712' : 'var(--text-main)',
                      borderBottomRightRadius: msg.sender === 'user' ? '4px' : '12px',
                      borderBottomLeftRadius: msg.sender === 'user' ? '12px' : '4px',
                    }}
                  >
                    {formatChatMessage(msg.text)}
                  </div>
                </div>
              ))}
              
              {chatLoading && (
                <div style={styles.chatMessageRow}>
                  <div style={styles.chatBubbleTextBotLoading}>
                    <span className="dot" style={{ animationDelay: '0s' }}>●</span>
                    <span className="dot" style={{ animationDelay: '0.2s' }}>●</span>
                    <span className="dot" style={{ animationDelay: '0.4s' }}>●</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Suggestions Panel */}
            <div style={styles.suggestionsContainer}>
              {chatbotSuggestions.map((sug, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleChatSubmit(sug)} 
                  style={styles.suggestionBtn}
                >
                  {sug} <ArrowRight size={10} />
                </button>
              ))}
            </div>

            {/* Input Footer */}
            <div style={styles.chatFooter}>
              <input 
                type="text" 
                placeholder="Ask me anything..." 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                style={styles.chatInput}
              />
              <button 
                onClick={() => handleChatSubmit()} 
                className="btn btn-primary"
                style={styles.chatSendBtn}
              >
                <Play size={14} style={{ fill: 'currentColor' }} />
              </button>
            </div>
          </div>
        )}
      </div>
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
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 2fr',
    gap: '20px',
  },
  accountCard: {
    background: 'linear-gradient(135deg, rgba(16, 24, 48, 0.65) 0%, rgba(10, 16, 32, 0.8) 100%)',
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '220px',
    boxShadow: '0 0 40px rgba(0, 242, 254, 0.05)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  balanceDisplay: {
    fontSize: '2.8rem',
    fontWeight: '800',
    letterSpacing: '-1px',
    margin: '15px 0'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    paddingTop: '15px'
  },
  cardFooterLabel: {
    display: 'block',
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    letterSpacing: '0.5px'
  },
  cardFooterValue: {
    fontWeight: '600',
    fontSize: '0.95rem'
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  actionCard: {
    padding: '20px',
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  actionForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  transferForm: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  tableCard: {
    padding: '24px',
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
  emptyTableText: {
    textAlign: 'center',
    padding: '40px',
    color: 'var(--text-muted)',
    fontSize: '0.9rem'
  },
  settingsContainer: {
    padding: '30px',
    maxWidth: '600px',
  },
  settingsTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  settingsForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },

  // Chatbot Widget Floating Styling
  chatbotContainer: {
    position: 'fixed',
    bottom: '25px',
    right: '25px',
    zIndex: 1000,
  },
  chatBubble: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'var(--primary-glow)',
    border: 'none',
    color: '#030712',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(0, 242, 254, 0.4)',
    position: 'relative',
    transition: 'var(--transition)'
  },
  chatBadge: {
    position: 'absolute',
    top: '-3px',
    right: '-3px',
    backgroundColor: 'var(--accent-purple)',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: '800',
    padding: '2px 6px',
    borderRadius: '10px',
    border: '2px solid var(--bg-color)'
  },
  chatWindow: {
    width: '360px',
    height: '500px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
  },
  chatHeader: {
    padding: '15px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(16, 24, 48, 0.8)'
  },
  chatCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'var(--transition)'
  },
  chatBody: {
    flex: 1,
    padding: '15px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  chatMessageRow: {
    display: 'flex',
    width: '100%'
  },
  chatBubbleText: {
    maxWidth: '80%',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '0.88rem',
    lineHeight: '1.4',
    wordBreak: 'break-word',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
  },
  chatBubbleTextBotLoading: {
    background: 'rgba(255,255,255,0.06)',
    padding: '12px 20px',
    borderRadius: '12px',
    fontSize: '0.88rem',
    display: 'flex',
    gap: '4px',
    color: 'var(--primary)'
  },
  suggestionsContainer: {
    padding: '8px 12px',
    borderTop: '1px solid rgba(255,255,255,0.04)',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    background: 'rgba(10, 16, 32, 0.4)'
  },
  suggestionBtn: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'var(--transition)'
  },
  chatFooter: {
    padding: '10px 15px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    gap: '8px',
    background: 'rgba(16, 24, 48, 0.8)',
    alignItems: 'center'
  },
  chatInput: {
    flex: 1,
    padding: '10px 14px',
    fontSize: '0.85rem'
  },
  chatSendBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0
  }
};

// Add chatbot CSS styles directly
if (typeof document !== 'undefined') {
  const chatStyle = document.createElement('style');
  chatStyle.innerHTML = `
    @keyframes blink {
      0% { opacity: 0.2; }
      20% { opacity: 1; }
      100% { opacity: 0.2; }
    }
    .chatBubbleTextBotLoading .dot {
      animation: blink 1.4s infinite both;
    }
    .suggestionBtn:hover {
      background: rgba(255, 255, 255, 0.08) !important;
      color: var(--primary) !important;
      border-color: rgba(0, 210, 255, 0.2) !important;
    }
  `;
  document.head.appendChild(chatStyle);
}
