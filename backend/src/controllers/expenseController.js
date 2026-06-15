const prisma = require('../utils/db');

exports.createExpense = async (req, res) => {
  try {
    const { groupId, title, description, amount, paidById, category, splits } = req.body;
    
    // Validate splits sum
    const splitsSum = splits.reduce((sum, split) => sum + Number(split.amount), 0);
    // Use a small epsilon for floating point comparison
    if (Math.abs(splitsSum - amount) > 0.01) {
      return res.status(400).json({ error: 'Splits sum must equal total amount' });
    }

    const expense = await prisma.expense.create({
      data: {
        groupId,
        title,
        description,
        amount: Number(amount),
        paidById,
        category,
        splits: {
          create: splits.map(split => ({
            userId: split.userId,
            amount: Number(split.amount),
            type: split.type // EQUAL, UNEQUAL, PERCENTAGE, SHARE
          }))
        }
      },
      include: {
        splits: true,
        paidBy: { select: { id: true, name: true } }
      }
    });

    res.status(201).json(expense);

    // Emit socket events
    if (req.io) {
      req.io.to(`group_${groupId}`).emit('new_expense', expense);
      req.io.to(`group_${groupId}`).emit('balances_updated');
    }
  } catch (error) {
    console.error('Create Expense Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;

    const expenses = await prisma.expense.findMany({
      where: { groupId },
      include: {
        paidBy: { select: { id: true, name: true } },
        splits: { include: { user: { select: { id: true, name: true } } } },
        messages: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(expenses);
  } catch (error) {
    console.error('Get Expenses Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.clearExpenseChat = async (req, res) => {
  try {
    const { expenseId } = req.params;
    
    // Delete all messages for this expense
    await prisma.expenseMessage.deleteMany({
      where: { expenseId }
    });

    res.status(200).json({ message: 'Chat cleared successfully' });

    // Emit socket event to clear chat for connected users
    if (req.io) {
      req.io.to(`expense_${expenseId}`).emit('chat_cleared');
    }
  } catch (error) {
    console.error('Clear Chat Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
