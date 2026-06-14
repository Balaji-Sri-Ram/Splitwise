const express = require('express');
const { createExpense, getGroupExpenses } = require('../controllers/expenseController');
const { getBalances } = require('../controllers/balanceController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

// Expenses
router.post('/', createExpense);
router.get('/group/:groupId', getGroupExpenses);

// Balances
router.get('/balances/:groupId', getBalances);

module.exports = router;
