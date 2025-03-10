const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const Team = require("../models/Team");
const Project = require("../models/Projects");
const User = require("../models/User");
const authMiddleware = require("../Middleware/authMiddleware");

// Get all tasks assigned to the logged-in employee
router.get('/tasks', authMiddleware, async (req, res) => {
    try {
        const employeeId = req.user.userId;

        const tasks = await Task.find({ assignedTo: employeeId })
            .populate('project', 'name')
            .sort({ deadline: 1 });

        res.status(200).json(tasks);
    } catch (error) {
        console.error('Error fetching employee tasks:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.patch('/tasks/:taskId/status', authMiddleware, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;
        const employeeId = req.user.userId;

        // Validate status
        if (!["pending", "in_progrss", "completed"].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        // Find the task and check if it's assigned to the employee
        const task = await Task.findOne({ _id: taskId, assignedTo: employeeId });

        if (!task) {
            return res.status(404).json({ message: 'Task not found or not assigned to you' });
        }

        // Update task status
        task.status = status;
        await task.save();

        // If completing a task, update project progress
        if (status === "completed") {
            await Project.findByIdAndUpdate(
                task.project,
                { $inc: { completed: 1 } }
            );
        } else if (task.status === "completed" && status !== "completed") {
            // If un-completing a task
            await Project.findByIdAndUpdate(
                task.project,
                { $inc: { completed: -1 } }
            );
        }

        res.status(200).json({ message: 'Task status updated', task });
    } catch (error) {
        console.error('Error updating task status:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/teams', authMiddleware, async (req, res) => {
    try {
        const employeeId = req.user.userId;

        // Find all teams where this employee is a member
        const teams = await Team.find({
            'members.memberId': employeeId
        }).populate('adminId', 'firstName lastName email');

        // Format the response
        const formattedTeams = await Promise.all(teams.map(async (team) => {
            // Get the employee's role in this team
            const memberInfo = team.members.find(m =>
                m.memberId.toString() === employeeId.toString()
            );

            // Count total members in the team
            const memberCount = team.members.length;

            return {
                id: team._id,
                name: memberInfo.role, // Using the role as team name
                members: memberCount,
                admin: team.adminId
            };
        }));

        res.status(200).json(formattedTeams);
    } catch (error) {
        console.error('Error fetching employee teams:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const employeeId = req.user.userId;

        const user = await User.findById(employeeId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching employee profile:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;