const prisma = require('../utils/db');

exports.createPayment = async (req, res) => {
  try {
    const { groupId, receiverId, amount } = req.body;
    const senderId = req.user.userId;

    const payment = await prisma.payment.create({
      data: {
        groupId,
        senderId,
        receiverId,
        amount: Number(amount)
      }
    });

    res.status(201).json(payment);

    // Emit socket event for balance update
    if (req.io) {
      req.io.to(`group_${groupId}`).emit('balances_updated');
    }
  } catch (error) {
    console.error('Create Payment Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
