const express = require('express');
const router = express.Router();
const moment = require('moment');
const Message = require('../models/Messages');
const Project = require('../models/Projects');
const authMiddleware = require('../Middleware/authMiddleware');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

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

// Multer Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Image functionality in chat interface
router.post('/upload-image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    // Create the URL for the uploaded image
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

    return res.status(200).json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return res.status(500).json({ message: 'Error uploading image' });
  }
});

// Pdf functionality in chat interface
router.post('/upload-file', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Create the URL for the uploaded file
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    return res.status(200).json({
      message: 'File uploaded successfully',
      fileUrl: fileUrl
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ message: 'Error uploading file' });
  }
});

// Audio functionality in chat interface
router.post('/upload-audio', authMiddleware, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio uploaded' });
    }

    // Create the URL for the uploaded audio
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const audioUrl = `${baseUrl}/uploads/${req.file.filename}`;

    return res.status(200).json({
      message: 'Audio uploaded successfully',
      audioUrl: audioUrl
    });
  } catch (error) {
    console.error('Error uploading audio:', error);
    return res.status(500).json({ message: 'Error uploading audio' });
  }
});

// Video functionality in chat interface
router.post('/upload-video', authMiddleware, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video uploaded' });
    }

    // Create the URL for the uploaded video
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const videoUrl = `${baseUrl}/uploads/${req.file.filename}`;

    return res.status(200).json({
      message: 'Video uploaded successfully',
      videoUrl: videoUrl
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    return res.status(500).json({ message: 'Error uploading video' });
  }
});

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
    if (!project.members.includes(senderId) && project.createdBy.toString() !== senderId.toString()) {
      return res.status(403).json({ message: 'Not authorized to view messages in this project' });
    }

    // Fetch messages with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ project: projectId })
      .populate('sender', 'firstName lastName email')
      .select('text imageUrl pdfUrl audioUrl videoUrl createdAt updatedAt readBy')
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

//Edit message within 15 minutes window sent by Logged-in user
router.put('/edit/:messageId', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user.userId;

    // Find the message
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if the sender is the same as the logged-in user
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: "You can only edit your own messages" });
    }

    // Check if the message is within the 15-minute edit window
    const fifteenMinutesAgo = moment().subtract(15, 'minutes');
    if (moment(message.createdAt).isBefore(fifteenMinutesAgo)) {
      return res.status(403).json({ message: "Editing window has expired" });
    }

    // Update the message
    message.text = text;
    message.isEdited = true;
    message.updatedAt = Date.now();
    await message.save();

    res.status(200).json({
      message: "Message edited successfully",
      data: message
    });
  } catch (error) {
    console.error("Error editing message:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE Route to delete message
router.delete('/delete/:messageId', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Ensure the logged-in user is the sender or Admin who can delete anymessage in the group
    const project = await Project.findById(message.project);
    const isAdmin = project.createdBy.toString() === userId;
    if (message.sender.toString() !== userId && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(messageId);
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Server error" });
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

// Add this to your routes file
router.post('/:projectId/mark-read', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    // Find all unread messages in this project
    const result = await Message.updateMany(
      {
        project: projectId,
        readBy: { $ne: userId },
        sender: { $ne: userId }
      },
      { $push: { readBy: userId } }
    );

    res.json({
      message: 'Project messages marked as read',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking project messages as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Count unread messages
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const projects = await Project.find({ members: userId }).select('_id');
    const projectIds = projects.map(project => project._id);

    const count = await Message.countDocuments({
      project: { $in: projectIds },
      readBy: { $nin: [userId] },
      sender: { $ne: userId }
    });

    return res.status(200).json({ count, projectIds });
  } catch (error) {
    console.error('Error fetching unread messages count:', error);
    return res.status(500).json({ message: 'Server error while fetching unread messages count', error: error.message });
  }
});

// Get unread messages for the logged-in user
router.get('/unread-messages', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const projects = await Project.find({ members: userId }).select('_id');
    const projectIds = projects.map(project => project._id);

    const messages = await Message.find({
      project: { $in: projectIds },
      readBy: { $nin: [userId] },
      sender: { $ne: userId }
    })
      .populate('sender', 'firstName lastName')
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .limit(10);
    return res.status(200).json({ messages });
  } catch (error) {
    console.error('Error fetching unread messages:', error);
    return res.status(500).json({ error: 'Server error while fetching unread messages' });
  }
});

module.exports = router;