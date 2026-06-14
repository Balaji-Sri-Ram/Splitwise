const prisma = require('../utils/db');

// Helper for Debt Optimization (Min-Cash Flow Algorithm)
function optimizeDebts(balances) {
  // balances is a map of userId -> net balance (positive means they are owed money, negative means they owe money)
  const debtors = [];
  const creditors = [];

  for (const [userId, amount] of Object.entries(balances)) {
    if (amount < -0.01) debtors.push({ userId, amount: -amount });
    if (amount > 0.01) creditors.push({ userId, amount });
  }

  // Sort both arrays descending by amount
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0; // debtors index
  let j = 0; // creditors index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.amount, creditor.amount);
    
    // Record optimized transaction: debtor owes creditor 'amount'
    transactions.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: parseFloat(amount.toFixed(2))
    });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return transactions;
}

exports.getBalances = async (req, res) => {
  try {
    const { groupId } = req.params;

    // 1. Fetch all expenses for this group
    const expenses = await prisma.expense.findMany({
      where: { groupId },
      include: { splits: true }
    });

    // 2. Fetch all payments for this group (settlements)
    const payments = await prisma.payment.findMany({
      where: { groupId }
    });

    // 3. Calculate net balances for each user
    const userBalances = {};

    // Process Expenses
    expenses.forEach(exp => {
      // The person who paid gets positive balance
      userBalances[exp.paidById] = (userBalances[exp.paidById] || 0) + exp.amount;

      // The people who are split owe money (negative balance)
      exp.splits.forEach(split => {
        userBalances[split.userId] = (userBalances[split.userId] || 0) - split.amount;
      });
    });

    // Process Payments
    payments.forEach(payment => {
      // Sender's balance increases (they paid their debt)
      userBalances[payment.senderId] = (userBalances[payment.senderId] || 0) + payment.amount;
      // Receiver's balance decreases (they received their money)
      userBalances[payment.receiverId] = (userBalances[payment.receiverId] || 0) - payment.amount;
    });

    // 4. Optimize Debts using Min-Cash Flow algorithm
    const optimizedTransactions = optimizeDebts(userBalances);

    // Get user details to map names
    const memberIds = Object.keys(userBalances);
    const users = await prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, name: true, email: true }
    });
    
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    // Map transactions to include user names
    const detailedTransactions = optimizedTransactions.map(tx => ({
      from: userMap[tx.from],
      to: userMap[tx.to],
      amount: tx.amount
    }));

    res.status(200).json({
      rawBalances: userBalances,
      optimizedDebts: detailedTransactions
    });

  } catch (error) {
    console.error('Get Balances Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
