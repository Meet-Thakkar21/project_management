const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Team = require('../models/Team');
const Project = require('../models/Projects');
const authMiddleware = require("../Middleware/authMiddleware");

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

// Get all teams that the logged-in user is a member of
router.get('/user-teams', authMiddleware, async (req, res) => {
  try {
    const employeeId = req.user.userId;

    // First, find all teams where the user is either an admin or a member
    const teams = await Team.find({
      $or: [
        { adminId: employeeId },
        { 'members.memberId': employeeId }
      ]
    });

    if (!teams || teams.length === 0) {
      return res.json([]);
    }

    // Get the admin and project details for each team
    const teamsWithDetails = await Promise.all(teams.map(async (team) => {
      // Find the related project (assuming there's a relationship between teams and projects)
      // This would need to be adjusted based on your actual data model relationship
      const project = await Project.findOne({
        members: { $in: [team.adminId] }
      });

      // Get admin details
      const admin = await User.findById(team.adminId, 'firstName lastName');

      // Count members
      const membersCount = team.members.length;

      // Determine user's role in this team
      let userRole = "Member"; // Default role

      if (team.adminId.toString() === employeeId) {
        userRole = "Admin";
      } else {
        const memberInfo = team.members.find(
          member => member.memberId.toString() === employeeId
        );
        if (memberInfo) {
          userRole = memberInfo.role;
        }
      }

      return {
        _id: team._id,
        // Use project name if available, otherwise use admin's name + "'s Team"
        name: project ? project.name : (admin ? `${admin.firstName}'s Team` : "Unnamed Team"),
        membersCount,
        userRole
      };
    }));

    res.json(teamsWithDetails);
  } catch (error) {
    console.error('Error fetching user teams:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get detailed information about a specific team
router.get('/details/:teamId', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;

    // Find the team and verify the user is a member or admin
    const team = await Team.findOne({
      _id: teamId,
      $or: [
        { adminId: userId },
        { 'members.memberId': userId }
      ]
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found or you do not have access' });
    }

    // Get admin details
    const admin = await User.findById(team.adminId, 'firstName lastName email');

    // Find the associated project
    const project = await Project.findOne({
      createdBy: { $in: [team.adminId] }
    });

    // Get member details
    const memberIds = team.members.map(member => member.memberId);
    const membersInfo = await User.find(
      { _id: { $in: memberIds } },
      'firstName lastName email'
    );

    // Match member info with roles
    const members = membersInfo.map(member => {
      const memberInfo = team.members.find(m =>
        m.memberId.toString() === member._id.toString()
      );

      return {
        _id: member._id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        role: memberInfo ? memberInfo.role : "Member"
      };
    });

    // Create a response with team details including admin and members
    const teamDetails = {
      _id: team._id,
      name: project ? project.name : `${admin.firstName}'s Team`,
      admin,
      members,
      project: project ? {
        _id: project._id,
        name: project.name,
        description: project.description,
        progress: project.progress
      } : null
    };

    res.json(teamDetails);
  } catch (error) {
    console.error('Error fetching team details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
