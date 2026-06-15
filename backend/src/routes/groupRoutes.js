const express = require('express');
const { createGroup, getGroups, addMember, getBalances, updateGroup, getDashboardStats } = require('../controllers/groupController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken); // Protect all group routes

router.post('/', createGroup);
router.get('/', getGroups);
router.get('/dashboard/stats', getDashboardStats);
router.post('/:id/members', addMember);
router.get('/:id/balances', getBalances);
router.put('/:id', updateGroup);

module.exports = router;
