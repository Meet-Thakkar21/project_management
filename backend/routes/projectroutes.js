const express = require('express');
const router = express.Router();
const Project = require('../models/Projects');
const Task = require('../models/Task');
const authMiddleware = require('../Middleware/authMiddleware');

// Create a new project
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, members } = req.body;
    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: "At least one member must be selected." });
    }
    const newProject = new Project({
      name,
      description,
      members,
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
    const adminId = req.user.userId;
    const projects = await Project.find({ createdBy: adminId }).populate("members", "firstName lastName email");
    // const teams = await Team.find({ adminId }).populate("members.memberId", "firstName lastName email");
    const projectsWithTaskCounts = await Promise.all(projects.map(async (project) => {
      // const team = teams.find(team => team.adminId.toString() === project.createdBy.toString());
      const totalTasks = await Task.countDocuments({ project: project._id });
      const completedTasks = await Task.countDocuments({ project: project._id, status: "completed" });

      return {
        ...project.toObject(),
        members: project.members.map(member => ({
          _id: member._id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email
        })),
        tasks: totalTasks,  // Total tasks count
        completed: completedTasks  // Completed tasks count
      };
    }));

    res.json({ projects: projectsWithTaskCounts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

//Get All Projects
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find({});
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Project details in which logged-in user is a part of
router.get("/user-projects", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const projects = await Project.find({
      members: userId
    }).populate('createdBy', 'firstName lastName email');

    const projectsDetailsOfUser = await Promise.all(projects.map(async (project) => {
      // Count total tasks assigned to the user in this project
      const totalTasks = await Task.countDocuments({
        project: project._id,
        assignedTo: userId
      });

      // Count completed tasks for the user in this project
      const completedTasks = await Task.countDocuments({
        project: project._id,
        assignedTo: userId,
        status: 'completed'
      });

      return {
        _id: project._id,
        name: project.name,
        description: project.description,
        totalTasks,
        completedTasks,
        createdBy: project.createdBy
      };
    }));

    res.json(projectsDetailsOfUser);
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get project details
router.get('/details/:projectId', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('createdBy', 'firstName lastName email')
      .populate('members', 'firstName lastName email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get tasks for this project
    const tasks = await Task.find({ project: project._id, assignedTo: req.user.userId })
      .populate('assignedTo', 'firstName lastName email')
      .populate('adminId', 'firstName lastName email');

    const projectDetails = {
      ...project.toObject(),
      tasks
    };

    res.json(projectDetails);
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//Delete project
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const adminId = req.user.userId;
    const project = await Project.findOne({ _id: req.params.id, createdBy: adminId });
    if (!project) {
      return res.status(404).json({ message: "Project not found or unauthorized" });
    }

    // Delete all tasks associated with the project
    await Task.deleteMany({ project: project._id });

    // Now delete the project
    await Project.findByIdAndDelete(project._id);
    if (!project) return res.status(404).json({ message: "Project not found or unauthorized" });

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
module.exports = router;