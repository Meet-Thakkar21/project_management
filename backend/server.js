// backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const cors = require('cors');
const projectRoutes = require('./routes/projectroutes');
const teamRoutes = require('./routes/teamRoute');
const taskRoutes = require("./routes/taskRoute");
// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
app.use(express.json()); // Middleware to parse JSON requests


app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
