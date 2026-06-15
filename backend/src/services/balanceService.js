const prisma = require('../utils/db');

exports.calculateBalances = async (groupId) => {
  // 1. Fetch all expenses and payments in this group
  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: { splits: true }
  });

  const payments = await prisma.payment.findMany({
    where: { groupId }
  });

  // 2. Calculate net balances for each user
  const balances = {}; // userId -> amount (positive means they are owed money, negative means they owe money)

  // Process Expenses
  for (const exp of expenses) {
    const paidBy = exp.paidById;
    balances[paidBy] = (balances[paidBy] || 0) + exp.amount;

    for (const split of exp.splits) {
      balances[split.userId] = (balances[split.userId] || 0) - split.amount;
    }
  }

  // Process Payments (settlements)
  for (const payment of payments) {
    balances[payment.senderId] = (balances[payment.senderId] || 0) + payment.amount;
    balances[payment.receiverId] = (balances[payment.receiverId] || 0) - payment.amount;
  }

  // 3. Debt Simplification Algorithm (Greedy matching)
  const debtors = [];
  const creditors = [];

  for (const [userId, balance] of Object.entries(balances)) {
    if (balance < -0.01) debtors.push({ userId, amount: -balance });
    else if (balance > 0.01) creditors.push({ userId, amount: balance });
  }

  // Sort by amount descending to minimize transactions
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];

    const amount = Math.min(debtor.amount, creditor.amount);
    
    // Create transaction
    transactions.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: Math.round(amount * 100) / 100 // Round to 2 decimals
    });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) d++;
    if (creditor.amount < 0.01) c++;
  }

  // Fetch user details for the transactions
  const userIds = [...new Set(transactions.flatMap(t => [t.from, t.to]))];
  if (userIds.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  });
  
  const userMap = {};
  users.forEach(u => userMap[u.id] = u);

  const enrichedTransactions = transactions.map(t => ({
    fromUser: userMap[t.from],
    toUser: userMap[t.to],
    amount: t.amount
  }));

  return enrichedTransactions;
};
