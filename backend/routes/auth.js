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
    const { email, password, googleToken, githubToken } = req.body;

    // If Google login (only email and Google token needed)
    if (googleToken) {
      // Decode Google JWT Token
      const decoded = jwt.decode(googleToken);

      // Check if user exists
      let user = await User.findOne({ email: decoded.email });

      if (!user) {
        // If user doesn't exist, create a new user with incomplete profile
        user = new User({
          firstName: decoded.given_name,
          lastName: decoded.family_name,
          email: decoded.email,
          isGoogleUser: true,
          profileComplete: false, // Flag to indicate incomplete profile
          // Don't set role, dob, gender, skills yet
        });

        await user.save();

        // Return response indicating profile needs completion
        return res.status(200).json({
          message: 'Google authentication successful',
          needsProfileCompletion: true,
          userId: user._id,
          user: { 
            id: user._id, 
            email: user.email, 
            firstName: user.firstName, 
            lastName: user.lastName,
            profileComplete: false
          }
        });
      } else {
        // User exists, check if profile is complete
        if (!user.profileComplete && (user.isGoogleUser || user.isGithubUser)) {
          return res.status(200).json({
            message: 'Google authentication successful',
            needsProfileCompletion: true,
            userId: user._id,
            user: { 
              id: user._id, 
              email: user.email, 
              firstName: user.firstName, 
              lastName: user.lastName,
              profileComplete: false
            }
          });
        }

        // Profile is complete, generate JWT token
        const token = jwt.sign(
          { userId: user._id, role: user.role, firstName: user.firstName, lastName: user.lastName },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        return res.status(200).json({
          message: 'Login successful',
          token,
          user: { 
            id: user._id, 
            email: user.email, 
            role: user.role, 
            firstName: user.firstName, 
            lastName: user.lastName 
          }
        });
      }
    }

    // If GitHub login
    if (githubToken) {
      // GitHub token is the access token, we need to fetch user data
      const githubResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${githubToken}`,
          'User-Agent': 'Taskify-App'
        }
      });

      if (!githubResponse.ok) {
        return res.status(400).json({ message: 'Invalid GitHub token' });
      }

      const githubUser = await githubResponse.json();

      // Fetch user email if not public
      let email = githubUser.email;
      if (!email) {
        const emailResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `token ${githubToken}`,
            'User-Agent': 'Taskify-App'
          }
        });
        
        if (emailResponse.ok) {
          const emails = await emailResponse.json();
          const primaryEmail = emails.find(e => e.primary) || emails[0];
          email = primaryEmail ? primaryEmail.email : null;
        }
      }

      if (!email) {
        return res.status(400).json({ message: 'Unable to get email from GitHub account' });
      }

      // Check if user exists
      let user = await User.findOne({ email });

      if (!user) {
        // Parse name from GitHub
        const fullName = githubUser.name || githubUser.login;
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || githubUser.login;
        const lastName = nameParts.slice(1).join(' ') || '';

        // If user doesn't exist, create a new user with incomplete profile
        user = new User({
          firstName,
          lastName,
          email,
          isGithubUser: true,
          profileComplete: false,
        });

        await user.save();

        // Return response indicating profile needs completion
        return res.status(200).json({
          message: 'GitHub authentication successful',
          needsProfileCompletion: true,
          userId: user._id,
          user: { 
            id: user._id, 
            email: user.email, 
            firstName: user.firstName, 
            lastName: user.lastName,
            profileComplete: false
          }
        });
      } else {
        // User exists, check if profile is complete
        if (!user.profileComplete && (user.isGoogleUser || user.isGithubUser)) {
          return res.status(200).json({
            message: 'GitHub authentication successful',
            needsProfileCompletion: true,
            userId: user._id,
            user: { 
              id: user._id, 
              email: user.email, 
              firstName: user.firstName, 
              lastName: user.lastName,
              profileComplete: false
            }
          });
        }

        // Profile is complete, generate JWT token
        const token = jwt.sign(
          { userId: user._id, role: user.role, firstName: user.firstName, lastName: user.lastName },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        return res.status(200).json({
          message: 'Login successful',
          token,
          user: { 
            id: user._id, 
            email: user.email, 
            role: user.role, 
            firstName: user.firstName, 
            lastName: user.lastName 
          }
        });
      }
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
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      return res.status(200).json({
        message: 'Login successful',
        token,
        user: { 
          id: user._id, 
          email: user.email, 
          role: user.role, 
          firstName: user.firstName, 
          lastName: user.lastName 
        }
      });
    }

    // If neither Google token, GitHub token, nor password provided, return an error
    return res.status(400).json({ message: 'Invalid login credentials' });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// New route to complete Google user profile
router.post('/complete-profile', async (req, res) => {
  try {
    const { userId, role, dob, gender, skills } = req.body;

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user profile
    user.role = role;
    user.dob = dob;
    user.gender = gender;
    user.skills = skills;
    user.profileComplete = true;

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role, firstName: user.firstName, lastName: user.lastName },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Profile completed successfully',
      token,
      user: { 
        id: user._id, 
        email: user.email, 
        role: user.role, 
        firstName: user.firstName, 
        lastName: user.lastName 
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GitHub OAuth token exchange endpoint
router.post('/github/token', async (req, res) => {
  try {
    const { code } = req.body;
    
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID, // Add this to your .env file
        client_secret: process.env.GITHUB_CLIENT_SECRET, // Add this to your .env file
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.access_token) {
      res.json({ access_token: tokenData.access_token });
    } else {
      res.status(400).json({ message: 'Failed to exchange GitHub code for token' });
    }
  } catch (error) {
    console.error('GitHub token exchange error:', error);
    res.status(500).json({ message: 'Server error during GitHub authentication' });
  }
});

module.exports = router;