const express = require('express');
const router = express.Router();
const Message = require('../models/Messages');
const Project = require('../models/Projects');
const authMiddleware = require('../Middleware/authMiddleware');

/* Send a message in a project (Traditional pooling Logic)
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { projectId, text } = req.body;
    const senderId = req.user.userId;

    // Create new message
    const newMessage = new Message({
      project: projectId,
      sender: senderId,
      text: text
    });

    // Save the message
    await newMessage.save();

    // Find the project and add the message
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Ensure user is a member of the project
    if (!project.members.includes(senderId)) {
      return res.status(403).json({ message: 'Not authorized to send messages in this project' });
    }

    // Add message to project
    await project.addMessage(newMessage._id);

    // Populate sender details for response
    await newMessage.populate('sender', 'firstName lastName email');
    console.log(newMessage);
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
*/

// Get messages for a specific project
router.get('/project/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const senderId = req.user.userId;

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Ensure user is a member of the project
    if (!project.members.includes(senderId)) {
      return res.status(403).json({ message: 'Not authorized to view messages in this project' });
    }

    // Fetch messages with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ project: projectId })
      .populate('sender', 'firstName lastName email')
      .sort({ createdAt: 1 }) // Most recent first
      .skip(skip)
      .limit(limit);

    // Count total messages
    const totalMessages = await Message.countDocuments({ project: projectId });

    res.json({
      messages,
      currentPage: page,
      totalPages: Math.ceil(totalMessages / limit),
      totalMessages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark messages as read
router.post('/mark-read', authMiddleware, async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user.userId;

    // Update multiple messages
    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
        readBy: { $ne: userId } // Avoid duplicates
      },
      { $push: { readBy: userId } }
    );

    res.json({
      message: 'Messages marked as read',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;