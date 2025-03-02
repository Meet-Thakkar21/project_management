const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Team = require('../models/Team');

// Get all members under a specific admin
router.get('/:adminId/members', async (req, res) => {
  try {
    const { adminId } = req.params;

    const team = await Team.findOne({ adminId }).populate('members.memberId', 'firstName lastName email');

    if (!team) return res.status(404).json({ message: 'No team found for this admin' });

    res.status(200).json(team.members);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching team members', error });
  }
});

// Add a member to the admin's team
router.post('/:adminId/add-member', async (req, res) => {
  try {
    const { adminId } = req.params;
    const { email, role } = req.body; // Role will be provided by the admin

    // Find the employee by email
    const member = await User.findOne({ email });

    if (!member) return res.status(404).json({ message: 'No user found with this email' });

    // Find or create the team for this admin
    let team = await Team.findOne({ adminId });

    if (!team) {
      team = new Team({ adminId, members: [] });
    }

    // Check if the member is already in the team
    if (team.members.some(m => m.memberId.toString() === member._id.toString())) {
      return res.status(400).json({ message: 'Member already in team' });
    }

    // Add the new member with role
    team.members.push({ memberId: member._id, role });
    await team.save();

    res.status(200).json({ message: 'Member added successfully', member: { _id: member._id, email, role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding member', error });
  }
});

// Remove a member from the team
router.delete('/:adminId/remove-member/:memberId', async (req, res) => {
  try {
    const { adminId, memberId } = req.params;

    const team = await Team.findOne({ adminId });

    if (!team) return res.status(404).json({ message: 'No team found for this admin' });

    // Remove the member
    team.members = team.members.filter(m => m.memberId.toString() !== memberId);
    await team.save();

    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error removing member', error });
  }
});

module.exports = router;
