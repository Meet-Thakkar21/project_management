const express = require('express');
const router = express.Router();
const Project = require('../models/Projects');
const authMiddleware = require('../Middleware/authMiddleware');

// Create a new project
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const newProject = new Project({
      name,
      description,
      members : [],
      createdBy: req.user.userId, // Assign project to logged-in user
    });

    await newProject.save();
    res.status(201).json({ message: 'Project created successfully', project: newProject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get projects created by logged-in user
router.get('/my-projects', authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ createdBy: req.user.userId }).populate('members', 'firstName lastName email');
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({});
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
