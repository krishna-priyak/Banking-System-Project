const { query } = require('./db');

/**
 * Parses user questions and executes secure SQLite queries scoped to the user's account.
 * @param {string} userMessage The natural language question
 * @param {number} userId The authenticated user ID
 * @param {string} accountNo The user's account number
 * @returns {Promise<{text: string, data?: any}>} The chatbot's response
 */
async function processAiQuery(userMessage, userId, accountNo) {
  const msg = userMessage.toLowerCase().trim();

  try {
    // 1. Get user details for personalization
    const user = await query.get('SELECT name FROM Users WHERE user_id = ?', [userId]);
    const userName = user ? user.name : 'Customer';

    // 2. CHECK BALANCE
    if (
      msg.includes('balance') || 
      msg.includes('how much money') || 
      msg.includes('check balance') ||
      msg.includes('current balance')
    ) {
      const account = await query.get('SELECT balance FROM Accounts WHERE account_no = ?', [accountNo]);
      if (!account) return { text: `I couldn't find an active account for you, ${userName}.` };
      return {
        text: `Hello ${userName}, your current account balance is **$${account.balance.toFixed(2)}**.`,
        data: { balance: account.balance, account_no: accountNo }
      };
    }

    // 3. RECENT TRANSACTIONS (e.g. "show my last 5 transactions", "last 3 transactions", "transaction history")
    const lastCountMatch = msg.match(/(?:last|recent|show)\s+(\d+)\s+transactions?/i) || msg.match(/(\d+)\s+(?:last|recent)\s+transactions?/i);
    const count = lastCountMatch ? parseInt(lastCountMatch[1], 10) : (msg.includes('transactions') || msg.includes('history') ? 5 : null);

    if (count !== null) {
      const limit = Math.min(count, 50); // limit to a max of 50 to protect output size
      const sql = `
        SELECT 
          transaction_id, 
          sender_account, 
          receiver_account, 
          amount, 
          transaction_type, 
          date_time 
        FROM Transactions 
        WHERE sender_account = ? OR receiver_account = ? 
        ORDER BY date_time DESC 
        LIMIT ?
      `;
      const rows = await query.all(sql, [accountNo, accountNo, limit]);

      if (rows.length === 0) {
        return { text: `You don't have any transaction history yet, ${userName}.` };
      }

      let textResponse = `Here are your last **${rows.length}** transactions, ${userName}:\n\n`;
      rows.forEach((tx, idx) => {
        const date = new Date(tx.date_time).toLocaleString();
        if (tx.transaction_type === 'deposit') {
          textResponse += `${idx + 1}. **+$${tx.amount.toFixed(2)}** (Deposit) - _${date}_\n`;
        } else if (tx.transaction_type === 'withdrawal') {
          textResponse += `${idx + 1}. **-$${tx.amount.toFixed(2)}** (Withdrawal) - _${date}_\n`;
        } else if (tx.transaction_type === 'transfer') {
          const direction = tx.sender_account === accountNo ? `Sent to Acct: ${tx.receiver_account}` : `Received from Acct: ${tx.sender_account}`;
          const sign = tx.sender_account === accountNo ? '-' : '+';
          textResponse += `${idx + 1}. **${sign}$${tx.amount.toFixed(2)}** (${direction}) - _${date}_\n`;
        }
      });

      return {
        text: textResponse,
        data: rows
      };
    }

    // 4. MONTHLY SPENDING (e.g. "how much did i spend this month?", "spent this month", "monthly spending")
    if (
      msg.includes('spend') || 
      msg.includes('spent') || 
      msg.includes('spending') || 
      msg.includes('expense')
    ) {
      // Outgoing transactions: withdrawals or transfers where current user is the sender
      const sql = `
        SELECT SUM(amount) as total_spent 
        FROM Transactions 
        WHERE 
          ((sender_account = ? AND transaction_type = 'transfer') OR (receiver_account = ? AND transaction_type = 'withdrawal'))
          AND date_time >= date('now', 'start of month')
      `;
      const result = await query.get(sql, [accountNo, accountNo]);
      const totalSpent = result.total_spent || 0;

      return {
        text: `You have spent a total of **$${totalSpent.toFixed(2)}** this month, ${userName}.`,
        data: { totalSpent, month: new Date().toLocaleString('default', { month: 'long' }) }
      };
    }

    // 5. MONTHLY DEPOSITS / INCOME (e.g., "how much did I deposit?", "total deposits", "income this month")
    if (
      msg.includes('deposit') || 
      msg.includes('received') || 
      msg.includes('income')
    ) {
      // Incoming transactions: deposits or transfers where current user is the receiver
      const sql = `
        SELECT SUM(amount) as total_received 
        FROM Transactions 
        WHERE 
          ((receiver_account = ? AND transaction_type = 'transfer') OR (receiver_account = ? AND transaction_type = 'deposit'))
          AND sender_account IS NOT ?
          AND date_time >= date('now', 'start of month')
      `;
      const result = await query.get(sql, [accountNo, accountNo, accountNo]);
      const totalReceived = result.total_received || 0;

      return {
        text: `You have received / deposited a total of **$${totalReceived.toFixed(2)}** this month, ${userName}.`,
        data: { totalReceived, month: new Date().toLocaleString('default', { month: 'long' }) }
      };
    }

    // 6. ACCOUNT DETAILS (e.g. "my account number", "account details")
    if (msg.includes('account number') || msg.includes('account details') || msg.includes('my account') || msg.includes('my details')) {
      const account = await query.get('SELECT balance FROM Accounts WHERE account_no = ?', [accountNo]);
      return {
        text: `Sure, ${userName}! Here are your account details:\n\n* **Account Holder**: ${userName}\n* **Account Number**: \`${accountNo}\`\n* **Current Balance**: $${account.balance.toFixed(2)}\n* **Account Type**: Savings (Standard)\n* **Status**: Active`,
        data: { accountNo, balance: account.balance }
      };
    }

    // 7. BANKING EDUCATION & GENERAL ADVICE
    if (msg.includes('fixed deposit') || msg.includes('fd') || msg.includes('interest rate')) {
      return {
        text: `A **Fixed Deposit (FD)** is a financial instrument provided by banks which provides investors a higher rate of interest than a regular savings account, until the given maturity date. Our current interest rates are:\n\n* **1 Year FD**: 6.5% p.a.\n* **3 Year FD**: 7.2% p.a.\n* **5 Year FD**: 7.5% p.a.\n\nYou can set up an FD by visiting your nearest branch or contact our support team.`
      };
    }

    if (msg.includes('how') && (msg.includes('transfer') || msg.includes('send'))) {
      return {
        text: `To transfer money between accounts, follow these simple steps on your dashboard:\n1. Navigate to the **Transfer Money** card.\n2. Enter the **Recipient's Account Number** (e.g., Jane Smith is \`1009873421\`).\n3. Input the **Amount** you wish to transfer.\n4. Click **Transfer** to instantly execute the transaction.`
      };
    }

    if (msg.includes('help') || msg.includes('what can you do') || msg.includes('features')) {
      return {
        text: `I am your secure **Bank AI Assistant**! You can ask me questions such as:\n\n* *"What is my account balance?"*\n* *"Show my last 5 transactions."*\n* *"How much did I spend this month?"*\n* *"Show my account details."*\n* *"What are the fixed deposit interest rates?"*\n* *"How do I transfer money?"*\n\nLet me know how I can help you today!`
      };
    }

    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return {
        text: `Hello ${userName}! Welcome to Apex Bank Support. I am your virtual assistant. How can I help you today? You can check your balance, view transactions, or ask me for details.`
      };
    }

    // Default response for unhandled questions
    return {
      text: `I'm not sure I fully understand that request, ${userName}. You can ask me things like "show my balance", "show my last 5 transactions", "how much did I spend this month", or type "help" for a list of things I can do.`
    };
  } catch (err) {
    console.error('AI query processing error:', err);
    return { text: "I'm sorry, I encountered an error while processing your request. Please try again." };
  }
}

module.exports = {
  processAiQuery
};
