const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Helper functions wrapping sqlite3 in Promises for async/await usage
const query = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  exec: (sql) => {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

// Initialize schema and seed default data
async function initDb() {
  try {
    // 1. Create Users Table
    await query.exec(`
      CREATE TABLE IF NOT EXISTS Users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'customer',
        account_status TEXT DEFAULT 'active'
      )
    `);

    // 2. Create Accounts Table
    await query.exec(`
      CREATE TABLE IF NOT EXISTS Accounts (
        account_no TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        balance REAL DEFAULT 0.0,
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
      )
    `);

    // 3. Create Transactions Table
    await query.exec(`
      CREATE TABLE IF NOT EXISTS Transactions (
        transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_account TEXT,
        receiver_account TEXT,
        amount REAL NOT NULL,
        transaction_type TEXT NOT NULL,
        date_time TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (sender_account) REFERENCES Accounts(account_no),
        FOREIGN KEY (receiver_account) REFERENCES Accounts(account_no)
      )
    `);

    console.log('Database tables verified/created successfully.');

    // Seed default users if empty
    const usersCount = await query.get('SELECT COUNT(*) as count FROM Users');
    if (usersCount.count === 0) {
      console.log('No existing users found. Seeding default data...');

      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      const customerPasswordHash = await bcrypt.hash('customer123', 10);

      // Seed Admin
      const adminInsert = await query.run(
        'INSERT INTO Users (name, email, password_hash, role, account_status) VALUES (?, ?, ?, ?, ?)',
        ['System Admin', 'admin@bank.com', adminPasswordHash, 'admin', 'active']
      );
      console.log('Seeded admin account (admin@bank.com / admin123)');

      // Seed Customer 1
      const customer1Insert = await query.run(
        'INSERT INTO Users (name, email, password_hash, role, account_status) VALUES (?, ?, ?, ?, ?)',
        ['John Doe', 'john@bank.com', customerPasswordHash, 'customer', 'active']
      );
      const account1No = '1002348756';
      await query.run(
        'INSERT INTO Accounts (account_no, user_id, balance) VALUES (?, ?, ?)',
        [account1No, customer1Insert.id, 5000.00]
      );
      console.log(`Seeded customer John Doe (john@bank.com / customer123) with account ${account1No} (Bal: $5000)`);

      // Seed Customer 2
      const customer2Insert = await query.run(
        'INSERT INTO Users (name, email, password_hash, role, account_status) VALUES (?, ?, ?, ?, ?)',
        ['Jane Smith', 'jane@bank.com', customerPasswordHash, 'customer', 'active']
      );
      const account2No = '1009873421';
      await query.run(
        'INSERT INTO Accounts (account_no, user_id, balance) VALUES (?, ?, ?)',
        [account2No, customer2Insert.id, 10000.00]
      );
      console.log(`Seeded customer Jane Smith (jane@bank.com / customer123) with account ${account2No} (Bal: $10000)`);

      // Seed some initial transaction history
      await query.run(
        'INSERT INTO Transactions (sender_account, receiver_account, amount, transaction_type, date_time) VALUES (?, ?, ?, ?, datetime("now", "-2 days"))',
        [null, account1No, 5000.00, 'deposit']
      );
      await query.run(
        'INSERT INTO Transactions (sender_account, receiver_account, amount, transaction_type, date_time) VALUES (?, ?, ?, ?, datetime("now", "-1 days"))',
        [null, account2No, 10000.00, 'deposit']
      );
      await query.run(
        'INSERT INTO Transactions (sender_account, receiver_account, amount, transaction_type, date_time) VALUES (?, ?, ?, ?, datetime("now", "-12 hours"))',
        [account2No, account1No, 1500.00, 'transfer']
      );

      console.log('Seeding transaction history complete.');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

module.exports = {
  query,
  initDb,
  db
};
