const express = require('express');
const { createGroup, getGroups, addMember } = require('../controllers/groupController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken); // Protect all group routes

router.post('/', createGroup);
router.get('/', getGroups);
router.post('/:id/members', addMember);

module.exports = router;
