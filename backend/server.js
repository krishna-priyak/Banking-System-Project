const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query, initDb } = require('./db');
const { processAiQuery } = require('./ai-assistant');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'bnk-sys-super-secret-key-2026';

app.use(cors());
app.use(express.json());

// Initialize Database Table Schema and Seeds
initDb();

// ==========================================
// MIDDLEWARES
// ==========================================

// Authenticate JWT Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. Token missing.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
}

// Require Role (Admin/Customer)
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: `Access denied. Requires ${role} role.` });
    }
    next();
  };
}

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// Register Customer
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password.' });
  }

  try {
    // Check if email already exists
    const existingUser = await query.get('SELECT * FROM Users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create User
    const userResult = await query.run(
      'INSERT INTO Users (name, email, password_hash, role, account_status) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, 'customer', 'active']
    );

    // Generate Random 10-Digit Account Number
    let accountNo;
    let isUnique = false;
    while (!isUnique) {
      accountNo = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      const existingAcct = await query.get('SELECT * FROM Accounts WHERE account_no = ?', [accountNo]);
      if (!existingAcct) isUnique = true;
    }

    // Create Account for User with $1000.00 Welcome Bonus
    await query.run(
      'INSERT INTO Accounts (account_no, user_id, balance) VALUES (?, ?, ?)',
      [accountNo, userResult.id, 1000.00]
    );

    // Save initial Welcome Bonus deposit transaction
    await query.run(
      'INSERT INTO Transactions (sender_account, receiver_account, amount, transaction_type) VALUES (?, ?, ?, ?)',
      [null, accountNo, 1000.00, 'deposit']
    );

    // Generate JWT
    const token = jwt.sign(
      { user_id: userResult.id, email, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Account registered successfully!',
      token,
      user: {
        user_id: userResult.id,
        name,
        email,
        role: 'customer',
        account_status: 'active'
      },
      account: {
        account_no: accountNo,
        balance: 1000.00
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

// Login (Customer or Admin)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  try {
    // Check if user exists
    const user = await query.get('SELECT * FROM Users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Check account status
    if (user.account_status === 'frozen' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Your account is frozen. Please contact administration.' });
    }

    // Verify Password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Get Account details if customer
    let account = null;
    if (user.role === 'customer') {
      account = await query.get('SELECT account_no, balance FROM Accounts WHERE user_id = ?', [user.user_id]);
    }

    // Generate JWT
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        account_status: user.account_status
      },
      account
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// ==========================================
// CUSTOMER SIDE ENDPOINTS
// ==========================================

// Get Account Details
app.get('/api/customer/account', authenticateToken, requireRole('customer'), async (req, res) => {
  try {
    const user = await query.get('SELECT name, email, account_status FROM Users WHERE user_id = ?', [req.user.user_id]);
    if (user.account_status === 'frozen') {
      return res.status(403).json({ message: 'Account is frozen.' });
    }

    const account = await query.get('SELECT account_no, balance FROM Accounts WHERE user_id = ?', [req.user.user_id]);
    if (!account) {
      return res.status(404).json({ message: 'Account details not found.' });
    }

    res.json({
      user: {
        name: user.name,
        email: user.email,
        account_status: user.account_status
      },
      account
    });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Check Balance
app.get('/api/customer/balance', authenticateToken, requireRole('customer'), async (req, res) => {
  try {
    const account = await query.get('SELECT balance FROM Accounts WHERE user_id = ?', [req.user.user_id]);
    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }
    res.json({ balance: account.balance });
  } catch (error) {
    console.error('Balance check error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Deposit Money (Simulation)
app.post('/api/customer/deposit', authenticateToken, requireRole('customer'), async (req, res) => {
  const { amount } = req.body;
  const depAmt = parseFloat(amount);

  if (isNaN(depAmt) || depAmt <= 0) {
    return res.status(400).json({ message: 'Please enter a valid deposit amount.' });
  }

  try {
    const user = await query.get('SELECT account_status FROM Users WHERE user_id = ?', [req.user.user_id]);
    if (user.account_status === 'frozen') {
      return res.status(403).json({ message: 'Your account is frozen. Deposits are not permitted.' });
    }

    const account = await query.get('SELECT account_no, balance FROM Accounts WHERE user_id = ?', [req.user.user_id]);
    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    const newBalance = account.balance + depAmt;

    // Update Balance
    await query.run('UPDATE Accounts SET balance = ? WHERE account_no = ?', [newBalance, account.account_no]);

    // Save Transaction
    await query.run(
      'INSERT INTO Transactions (sender_account, receiver_account, amount, transaction_type) VALUES (?, ?, ?, ?)',
      [null, account.account_no, depAmt, 'deposit']
    );

    res.json({
      message: `Successfully deposited $${depAmt.toFixed(2)}.`,
      balance: newBalance
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Withdraw Money (Simulation)
app.post('/api/customer/withdraw', authenticateToken, requireRole('customer'), async (req, res) => {
  const { amount } = req.body;
  const witAmt = parseFloat(amount);

  if (isNaN(witAmt) || witAmt <= 0) {
    return res.status(400).json({ message: 'Please enter a valid withdrawal amount.' });
  }

  try {
    const user = await query.get('SELECT account_status FROM Users WHERE user_id = ?', [req.user.user_id]);
    if (user.account_status === 'frozen') {
      return res.status(403).json({ message: 'Your account is frozen. Withdrawals are blocked.' });
    }

    const account = await query.get('SELECT account_no, balance FROM Accounts WHERE user_id = ?', [req.user.user_id]);
    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    if (account.balance < witAmt) {
      return res.status(400).json({ message: 'Insufficient funds for this withdrawal.' });
    }

    const newBalance = account.balance - witAmt;

    // Update Balance
    await query.run('UPDATE Accounts SET balance = ? WHERE account_no = ?', [newBalance, account.account_no]);

    // Save Transaction
    await query.run(
      'INSERT INTO Transactions (sender_account, receiver_account, amount, transaction_type) VALUES (?, ?, ?, ?)',
      [account.account_no, null, witAmt, 'withdrawal']
    );

    res.json({
      message: `Successfully withdrew $${witAmt.toFixed(2)}.`,
      balance: newBalance
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Transfer Money
app.post('/api/customer/transfer', authenticateToken, requireRole('customer'), async (req, res) => {
  const { receiver_account_no, amount } = req.body;
  const transAmt = parseFloat(amount);

  if (!receiver_account_no || isNaN(transAmt) || transAmt <= 0) {
    return res.status(400).json({ message: 'Please check your inputs. Enter valid account number and amount.' });
  }

  try {
    const sender = await query.get('SELECT account_status FROM Users WHERE user_id = ?', [req.user.user_id]);
    if (sender.account_status === 'frozen') {
      return res.status(403).json({ message: 'Your account is frozen. Outgoing transfers are blocked.' });
    }

    const senderAccount = await query.get('SELECT account_no, balance FROM Accounts WHERE user_id = ?', [req.user.user_id]);
    if (!senderAccount) {
      return res.status(404).json({ message: 'Your account details were not found.' });
    }

    if (senderAccount.account_no === receiver_account_no) {
      return res.status(400).json({ message: 'Cannot transfer money to the same account.' });
    }

    if (senderAccount.balance < transAmt) {
      return res.status(400).json({ message: 'Insufficient balance to complete transfer.' });
    }

    // Verify recipient account exists
    const receiverAccount = await query.get('SELECT * FROM Accounts WHERE account_no = ?', [receiver_account_no]);
    if (!receiverAccount) {
      return res.status(404).json({ message: 'Recipient account number not found.' });
    }

    // Verify recipient user status
    const receiverUser = await query.get('SELECT account_status FROM Users WHERE user_id = ?', [receiverAccount.user_id]);
    if (receiverUser.account_status === 'frozen') {
      return res.status(403).json({ message: 'Recipient account is currently frozen. Cannot complete transfer.' });
    }

    // Deduct from Sender
    const senderNewBal = senderAccount.balance - transAmt;
    await query.run('UPDATE Accounts SET balance = ? WHERE account_no = ?', [senderNewBal, senderAccount.account_no]);

    // Add to Receiver
    const receiverNewBal = receiverAccount.balance + transAmt;
    await query.run('UPDATE Accounts SET balance = ? WHERE account_no = ?', [receiverNewBal, receiver_account_no]);

    // Save Transaction Log
    await query.run(
      'INSERT INTO Transactions (sender_account, receiver_account, amount, transaction_type) VALUES (?, ?, ?, ?)',
      [senderAccount.account_no, receiver_account_no, transAmt, 'transfer']
    );

    res.json({
      message: `Successfully transferred $${transAmt.toFixed(2)} to account ${receiver_account_no}.`,
      balance: senderNewBal
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ message: 'Internal server error during transfer.' });
  }
});

// View Transaction History
app.get('/api/customer/transactions', authenticateToken, requireRole('customer'), async (req, res) => {
  try {
    const account = await query.get('SELECT account_no FROM Accounts WHERE user_id = ?', [req.user.user_id]);
    if (!account) {
      return res.status(404).json({ message: 'Account details not found.' });
    }

    const txs = await query.all(
      `SELECT * FROM Transactions 
       WHERE sender_account = ? OR receiver_account = ? 
       ORDER BY date_time DESC`,
      [account.account_no, account.account_no]
    );

    res.json({ transactions: txs });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Change Password
app.post('/api/customer/change-password', authenticateToken, async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ message: 'Please provide current and new passwords.' });
  }

  try {
    const user = await query.get('SELECT password_hash FROM Users WHERE user_id = ?', [req.user.user_id]);
    const isMatch = await bcrypt.compare(current_password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await query.run('UPDATE Users SET password_hash = ? WHERE user_id = ?', [newHash, req.user.user_id]);

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Chatbot AI Assistant Endpoint
app.post('/api/customer/chat', authenticateToken, requireRole('customer'), async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message content is required.' });
  }

  try {
    const account = await query.get('SELECT account_no FROM Accounts WHERE user_id = ?', [req.user.user_id]);
    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    const reply = await processAiQuery(message, req.user.user_id, account.account_no);
    res.json(reply);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'AI failed to process. Try again.' });
  }
});

// ==========================================
// ADMIN SIDE ENDPOINTS
// ==========================================

// Get All Users (Admin)
app.get('/api/admin/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const sql = `
      SELECT u.user_id, u.name, u.email, u.role, u.account_status, a.account_no, a.balance 
      FROM Users u
      LEFT JOIN Accounts a ON u.user_id = a.user_id
      ORDER BY u.user_id DESC
    `;
    const users = await query.all(sql);
    res.json({ users });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get All Transactions (Admin)
app.get('/api/admin/transactions', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const transactions = await query.all('SELECT * FROM Transactions ORDER BY date_time DESC');
    res.json({ transactions });
  } catch (error) {
    console.error('Admin get transactions error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Create Customer Account directly (Admin)
app.post('/api/admin/create-user', authenticateToken, requireRole('admin'), async (req, res) => {
  const { name, email, password, initial_balance } = req.body;
  const initialBal = parseFloat(initial_balance) || 0.0;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password.' });
  }

  try {
    // Check if email already exists
    const existingUser = await query.get('SELECT * FROM Users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create User
    const userResult = await query.run(
      'INSERT INTO Users (name, email, password_hash, role, account_status) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, 'customer', 'active']
    );

    // Generate Random 10-Digit Account Number
    let accountNo;
    let isUnique = false;
    while (!isUnique) {
      accountNo = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      const existingAcct = await query.get('SELECT * FROM Accounts WHERE account_no = ?', [accountNo]);
      if (!existingAcct) isUnique = true;
    }

    // Create Account for User
    await query.run(
      'INSERT INTO Accounts (account_no, user_id, balance) VALUES (?, ?, ?)',
      [accountNo, userResult.id, initialBal]
    );

    // Save Initial Transaction Log if balance > 0
    if (initialBal > 0) {
      await query.run(
        'INSERT INTO Transactions (sender_account, receiver_account, amount, transaction_type) VALUES (?, ?, ?, ?)',
        [null, accountNo, initialBal, 'deposit']
      );
    }

    res.status(201).json({
      message: 'Customer account created successfully!',
      user_id: userResult.id,
      account_no: accountNo
    });
  } catch (error) {
    console.error('Admin create user error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Toggle Freeze/Activate Customer (Admin)
app.post('/api/admin/toggle-freeze', authenticateToken, requireRole('admin'), async (req, res) => {
  const { user_id, action } = req.body; // action: 'freeze' or 'activate'

  if (!user_id || !action) {
    return res.status(400).json({ message: 'User ID and action are required.' });
  }

  const newStatus = action === 'freeze' ? 'frozen' : 'active';

  try {
    // Check if target is admin (cannot freeze admin)
    const targetUser = await query.get('SELECT role FROM Users WHERE user_id = ?', [user_id]);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (targetUser.role === 'admin') {
      return res.status(400).json({ message: 'Cannot freeze / modify admin accounts.' });
    }

    await query.run('UPDATE Users SET account_status = ? WHERE user_id = ?', [newStatus, user_id]);
    res.json({ message: `Account has been successfully ${newStatus === 'frozen' ? 'frozen' : 'activated'}.` });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Generate Reports / Overview Stats (Admin)
app.get('/api/admin/reports', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const totalDeposits = await query.get("SELECT SUM(balance) as sum FROM Accounts");
    const activeAccounts = await query.get("SELECT COUNT(*) as count FROM Users WHERE role = 'customer' AND account_status = 'active'");
    const frozenAccounts = await query.get("SELECT COUNT(*) as count FROM Users WHERE role = 'customer' AND account_status = 'frozen'");
    const totalTransactions = await query.get("SELECT COUNT(*) as count FROM Transactions");
    const transfersCount = await query.get("SELECT COUNT(*) as count FROM Transactions WHERE transaction_type = 'transfer'");
    const depositsCount = await query.get("SELECT COUNT(*) as count FROM Transactions WHERE transaction_type = 'deposit'");
    const withdrawalsCount = await query.get("SELECT COUNT(*) as count FROM Transactions WHERE transaction_type = 'withdrawal'");

    res.json({
      reports: {
        totalDeposits: totalDeposits.sum || 0,
        activeAccountsCount: activeAccounts.count,
        frozenAccountsCount: frozenAccounts.count,
        totalTransactionsCount: totalTransactions.count,
        transfersCount: transfersCount.count,
        depositsCount: depositsCount.count,
        withdrawalsCount: withdrawalsCount.count
      }
    });
  } catch (error) {
    console.error('Reports endpoint error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`BnK SYS Server is running on port ${PORT}`);
});
