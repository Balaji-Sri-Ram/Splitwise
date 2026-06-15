require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Make io accessible to our router
app.use((req, res, next) => {
  req.io = io;
  next();
});


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/payments', paymentRoutes);

// Socket.io
const prisma = require('./utils/db');

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on('join_group', (groupId) => {
    socket.join(`group_${groupId}`);
  });

  socket.on('join_expense', (expenseId) => {
    socket.join(`expense_${expenseId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { expenseId, userId, content } = data;
      // Save message to database
      const message = await prisma.expenseMessage.create({
        data: { expenseId, userId, content },
        include: { user: { select: { id: true, name: true } } }
      });
      // Broadcast to room
      io.to(`expense_${expenseId}`).emit('receive_message', message);
    } catch (error) {
      console.error('Socket Message Error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
