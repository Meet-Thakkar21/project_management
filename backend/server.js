// backend/server.js
const express = require('express');
const http = require('http'); // For creating HTTP server
const { Server } = require('socket.io'); // Import Socket.IO
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const cors = require('cors');
const projectRoutes = require('./routes/projectroutes');
const teamRoutes = require('./routes/teamRoute');
const taskRoutes = require("./routes/taskRoute");
const employeeRoutes = require('./routes/employeeRoute');
const messageRoutes = require('./routes/messageRoute');
const User = require('./models/User');
const Message = require('./models/Messages');
const Project = require('./models/Projects');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
app.use(express.json()); // Middleware to parse JSON requests

app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/chat', messageRoutes);

// Create HTTP Server - IMPORTANT: Use this server for both Express and Socket.IO
const server = http.createServer(app);

// Integrate Socket.IO with the server
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  }
});

// Socket.IO Event Handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Handle room joining
  socket.on('joinRoom', ({ projectId, userId }) => {
    socket.join(projectId);
    console.log(`User ${userId} joined project room: ${projectId}`);
  });

  // Handle room leaving
  socket.on('leaveRoom', ({ projectId, userId }) => {
    socket.leave(projectId);
    console.log(`User ${userId} left project room: ${projectId}`);
  });

  // Send message
  socket.on('sendMessage', async (data) => {
    const { projectId, senderId, text } = data;
    console.log("Message Received:", { projectId, senderId, text });
    try {
      // Save message to database
      const newMessage = new Message({ project: projectId, sender: senderId, text });
      await newMessage.save();

      // Update project messages
      const project = await Project.findById(projectId);

      if (!project.members.includes(senderId)) {
        return;
      }
      if (project) {
        project.messages.push(newMessage._id);
        project.lastMessage = newMessage._id;
        await project.save();

        const sender = await User.findById(senderId);
        // Broadcast message to all clients in the project room
        io.to(projectId).emit('receiveMessage', {
          _id: newMessage._id,
          text,
          sender: { _id: sender._id, firstName: sender.firstName, lastName: sender.lastName },
          createdAt: newMessage.createdAt,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('🚪 User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// IMPORTANT: Use the 'server' to listen, not 'app'
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});