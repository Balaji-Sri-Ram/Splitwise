const express = require('express');
const { createExpense, getGroupExpenses, clearExpenseChat } = require('../controllers/expenseController');
const { getBalances } = require('../controllers/balanceController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

// Expenses
router.post('/', createExpense);
router.get('/group/:groupId', getGroupExpenses);
router.delete('/:expenseId/messages', clearExpenseChat);

// Balances
router.get('/balances/:groupId', getBalances);

module.exports = router;
