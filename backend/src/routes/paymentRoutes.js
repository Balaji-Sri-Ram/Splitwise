const express = require('express');
const { createPayment } = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.post('/', createPayment);

module.exports = router;
