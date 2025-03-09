const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const Project = require("../models/Projects");
const User = require("../models/User");
const authMiddleware = require("../Middleware/authMiddleware");

// ✅ CREATE A NEW TASK
router.post("/:adminId", authMiddleware, async (req, res) => {
  try {
    const { name, project, assignedTo, deadline, status } = req.body;
    const { adminId } = req.params;// Logged-in admin ID
    console.log(name,project,assignedTo,deadline,adminId);
    if (!name || !project || !assignedTo || !deadline) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    const projectExists = await Project.findById(project);
    const userExists = await User.findById(assignedTo);

    if (!projectExists) return res.status(404).json({ message: "Project not found" });
    if (!userExists) return res.status(404).json({ message: "Assigned user not found" });

    const newTask = new Task({ name, project, assignedTo, deadline, status, adminId });
    await newTask.save();

    res.status(201).json({ message: "Task created successfully", task: newTask });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ GET ALL TASKS (Only tasks created by the logged-in admin)
router.get("/:adminId", async (req, res) => {
  try {
    const { adminId } = req.params;
    const tasks = await Task.find({ adminId }).populate("project assignedTo", "name email");
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ GET A SPECIFIC TASK BY ID (Only if created by the logged-in admin)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const adminId = req.user.id;
    const task = await Task.findOne({ _id: req.params.id, adminId }).populate("project assignedTo", "name email");

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.status(200).json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ UPDATE A TASK (Only if created by the logged-in admin)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, project, assignedTo, deadline, status } = req.body;
    const adminId = req.user.id;

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, adminId },
      { name, project, assignedTo, deadline, status },
      { new: true }
    );

    if (!updatedTask) return res.status(404).json({ message: "Task not found or unauthorized" });

    res.status(200).json({ message: "Task updated successfully", task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ DELETE A TASK (Only if created by the logged-in admin)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const adminId = req.user.id;
    const deletedTask = await Task.findOneAndDelete({ _id: req.params.id, adminId });

    if (!deletedTask) return res.status(404).json({ message: "Task not found or unauthorized" });

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
