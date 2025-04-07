// backend/routes/auth.js
const express = require('express');
const User = require('../models/User');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, dob, gender, skills } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      dob,
      gender,
      skills,
    });

    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password, googleToken } = req.body;

    // If Google login (only email and Google token needed)
    if (googleToken) {
      // Decode Google JWT Token
      const decoded = jwt.decode(googleToken);

      // Check if user exists
      let user = await User.findOne({ email: decoded.email });

      if (!user) {
        // If user doesn't exist, create a new user with minimal fields
        user = new User({
          firstName: decoded.given_name,
          lastName: decoded.family_name,
          email: decoded.email,
          role: 'employee', // Default role, you can adjust this
          // Optional fields like dob, gender, skills can be filled later
        });

        await user.save();
      }

      // Generate JWT token for the user
      const token = jwt.sign(
        { userId: user._id, role: user.role, firstName: user.firstName, lastName: user.lastName },
        process.env.JWT_SECRET, // Replace with your secret key
        { expiresIn: '1h' }
      );

      return res.status(200).json({
        message: 'Login successful',
        token,
        user: { id: user._id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName }
      });
    }

    // If normal login (email/password)
    if (password) {
      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Compare passwords
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, role: user.role, firstName: user.firstName, lastName: user.lastName },
        process.env.JWT_SECRET, // Replace with your secret key
        { expiresIn: '1h' }
      );

      return res.status(200).json({
        message: 'Login successful',
        token,
        user: { id: user._id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName }
      });
    }

    // If neither Google token nor password provided, return an error
    return res.status(400).json({ message: 'Invalid login credentials' });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;