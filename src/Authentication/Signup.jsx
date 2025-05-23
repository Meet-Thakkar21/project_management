import React, { useState } from 'react';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import './Signup.css';
import { useNavigate } from 'react-router-dom';
const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    dob: '',
    gender: '',
    skills: []
  });

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
    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log(data);

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        alert(data.message); // Success message
      } else {
        alert(data.message); // Error message
      }
    } catch (error) {
      console.error('Error signing up:', error);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Signup Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white overflow-y-auto">
        <div className="w-full max-w-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Taskify - Project Management Tool</h2>
          <h3 className="text-xl text-gray-700 mb-8">Create your account</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="form-group">
                <label className="text-sm font-medium text-gray-700">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="project_admin">Project Admin</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
              <div className="form-group">
                <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="text-sm font-medium text-gray-700">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="text-sm font-medium text-gray-700">Skills</label>
              <div className="skills-container grid grid-cols-2 sm:grid-cols-3 gap-2">
                {skillOptions.map(skill => (
                  <div
                    key={skill}
                    className={`skill-chip ${formData.skills.includes(skill) ? 'active' : ''}`}
                    onClick={() => handleSkillsChange(skill)}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="submitButton w-full"
              onClick={() => navigate('/')}
              style={{backgroundColor: "#004080"}}
            >
              Create Account
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or sign up with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button className="social-button">
                <FaGoogle className="text-gray-600 mr-2" />
                <span>Google</span>
              </button>
              <button className="social-button">
                <FaGithub className="text-gray-600 mr-2" />
                <span>GitHub</span>
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-600 hover:text-emerald-700 font-medium" style={{color: "#004080"}}>
              Sign in
            </a>
          </p>
        </div>
      </div>

      {/* Right Side - Image and Content */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-400 relative">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative w-full h-full flex flex-col items-center justify-center p-12 text-white">
          <img src="/logo_crop.png" alt="Taskify Logo" className="signup-logo" />
          <h2 className="welcome-text" style={{color: "#fff"}}>Welcome to Taskify</h2>
          <p className="description-text" style={{color: "#cee3f8"}}>
            Taskify is a powerful project management platform that simplifies team collaboration,
            enhances workflow efficiency, and helps you track tasks effortlessly. Get started now
            and streamline your projects like never before!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;