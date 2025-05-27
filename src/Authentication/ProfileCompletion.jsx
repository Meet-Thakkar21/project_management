import React, { useState } from 'react';
import './ProfileCompletion.css';

const ProfileCompletion = ({ userId, onProfileComplete }) => {
  const [formData, setFormData] = useState({
    role: '',
    dob: '',
    gender: '',
    skills: []
  });

  const [loading, setLoading] = useState(false);

  const skillOptions = [
    'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'SQL',
    'DevOps', 'AWS', 'UI/UX Design', 'Project Management'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSkillsChange = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...formData
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        window.showToast('Profile completed successfully!', 'success', 3000);
        
        // Call the callback function to handle navigation
        if (onProfileComplete) {
          onProfileComplete(data.user);
        }
      } else {
        window.showToast(data.message || 'Failed to complete profile', 'error', 4000);
      }
    } catch (error) {
      console.error('Error completing profile:', error);
      window.showToast('An error occurred. Please try again.', 'error', 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-completion-container">
      <div className="profile-completion-card">
        <div className="profile-completion-header">
          <h2>Complete Your Profile</h2>
          <p>Please provide additional information to complete your account setup</p>
        </div>

        <form onSubmit={handleSubmit} className="profile-completion-form">
          <div className="form-row">
            <div className="form-group">
              <label>Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="">Select Role</option>
                <option value="project_admin">Project Admin</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Skills</label>
            <div className="skills-grid">
              {skillOptions.map(skill => (
                <div
                  key={skill}
                  className={`skill-chip ${formData.skills.includes(skill) ? 'selected' : ''}`}
                  onClick={() => handleSkillsChange(skill)}
                >
                  {skill}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="complete-profile-btn"
            disabled={loading}
          >
            {loading ? 'Completing Profile...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileCompletion;