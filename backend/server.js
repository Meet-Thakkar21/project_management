const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const cors = require('cors');
const path = require('path');
const projectRoutes = require('./routes/projectroutes');
const teamRoutes = require('./routes/teamRoute');
const taskRoutes = require("./routes/taskRoute");
const employeeRoutes = require('./routes/employeeRoute');
const messageRoutes = require('./routes/messageRoute');
const User = require('./models/User');
const Message = require('./models/Messages');
const Project = require('./models/Projects');

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

const FRONTEND_DEPLOYED = 'https://taskify-one-khaki.vercel.app';
const FRONTEND_LOCAL = 'http://localhost:3000';

app.use(
  cors({
    origin: [FRONTEND_DEPLOYED, FRONTEND_LOCAL],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/chat', messageRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Real-time call/email mapping
const emailToSocketMap = new Map();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [FRONTEND_DEPLOYED, FRONTEND_LOCAL],
    methods: ['GET', 'POST']
  }
});

// --- SOCKET.IO EVENT HANDLING ---
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // --- Chat Room Events ---
  socket.on('joinRoom', ({ projectId, userId }) => {
    socket.join(projectId);
    console.log(`User ${userId} joined project room: ${projectId}`);
  });

  socket.on('leaveRoom', ({ projectId, userId }) => {
    socket.leave(projectId);
    console.log(`User ${userId} left project room: ${projectId}`);
  });

  // --- Messaging Events ---
  socket.on('sendMessage', async (data) => {
    const {
      projectId, senderId, text, imageUrl, pdfUrl, audioUrl, videoUrl,
      imageOriginalName, pdfOriginalName, audioOriginalName, videoOriginalName
    } = data;
    console.log("Message Received:", {
      projectId, senderId, text, imageUrl, pdfUrl, audioUrl, videoUrl,
      imageOriginalName, pdfOriginalName, audioOriginalName, videoOriginalName
    });
    try {
      const newMessage = new Message({
        project: projectId,
        sender: senderId,
        text: text || '',
        imageUrl: imageUrl || null,
        pdfUrl: pdfUrl || null,
        audioUrl: audioUrl || null,
        videoUrl: videoUrl || null,
        imageOriginalName: imageOriginalName || null,
        pdfOriginalName: pdfOriginalName || null,
        audioOriginalName: audioOriginalName || null,
        videoOriginalName: videoOriginalName || null
      });
      await newMessage.save();

      const project = await Project.findById(projectId);
      if (!project.members.includes(senderId) && project.createdBy.toString() !== senderId) {
        return;
      }
      if (project) {
        project.messages.push(newMessage._id);
        project.lastMessage = newMessage._id;
        await project.save();

        const sender = await User.findById(senderId);

        io.to(projectId).emit('receiveMessage', {
          _id: newMessage._id,
          text: newMessage.text,
          imageUrl: newMessage.imageUrl,
          pdfUrl: newMessage.pdfUrl,
          audioUrl: newMessage.audioUrl,
          videoUrl: newMessage.videoUrl,
          sender: { _id: sender._id, firstName: sender.firstName, lastName: sender.lastName },
          createdAt: newMessage.createdAt,
          updatedAt: newMessage.createdAt
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  socket.on('updateMessage', async (data) => {
    const { messageId, projectId, text, isEdited } = data;
    console.log("Message Update Received:", { messageId, projectId, text, isEdited });

    try {
      const message = await Message.findById(messageId);
      if (!message) {
        console.error('Message not found');
        return;
      }
      io.to(projectId).emit('messageUpdated', {
        _id: message._id,
        text: text,
        isEdited: isEdited,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating message:', error);
    }
  });

  socket.on('deleteMessage', async (data) => {
    try {
      const { messageId, projectId } = data;
      if (!messageId || !projectId) {
        console.error('Missing required fields for message deletion');
        return;
      }
      io.to(projectId).emit('messageDeleted', messageId);
    } catch (error) {
      console.error('Error in deleteMessage socket event:', error);
    }
  });

  // --- Call/RTC Events ---
 socket.on('register-email', (email) => {
  emailToSocketMap.set(email, socket.id);
  console.log(`Registered email: ${email} with socket ID: ${socket.id}`);
});

socket.on('initiate-call', ({ toEmail, offer }) => {
  const targetSocketId = emailToSocketMap.get(toEmail);
  const fromEmail = Array.from(emailToSocketMap.entries()).find(([email, id]) => id === socket.id)?.[0];
  if (targetSocketId && fromEmail) {
    io.to(targetSocketId).emit('incoming-call', { from: fromEmail, offer }); // <--- send EMAIL, not socket id
  } else {
    socket.emit('user-not-found', { email: toEmail });
  }
});

socket.on('accept-call', ({ to, answer }) => {
  const targetSocketId = emailToSocketMap.get(to); // "to" is email
  if (targetSocketId) {
    io.to(targetSocketId).emit('call-accepted', answer);
  }
});

socket.on('candidate', ({ to, candidate }) => {
  const targetSocketId = emailToSocketMap.get(to); // "to" is email
  if (targetSocketId) {
    io.to(targetSocketId).emit('candidate', candidate);
  }
});

socket.on('end-call', ({ to }) => {
  const targetSocketId = emailToSocketMap.get(to);
  if (targetSocketId) {
    io.to(targetSocketId).emit('call-ended');
  }
});

socket.on('disconnect', () => {
  for (const [email, id] of emailToSocketMap.entries()) {
    if (id === socket.id) {
      emailToSocketMap.delete(email);
      console.log(`User with email ${email} disconnected`);
      break;
    }
  }
  console.log('User disconnected:', socket.id);
});
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});