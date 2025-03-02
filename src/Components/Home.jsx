import React, { useState, useEffect } from 'react';
import { FaUsers, FaVideo, FaComments, FaTasks } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import '../Styles/Home.css';

const Home = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser)); 
    }
  }, []);
  
  console.log(user);// Parse stored user data
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove token
    localStorage.removeItem('user'); // Remove user data from storage
    
    navigate('/login'); // Redirect to login page
  };

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-content">
          <h1 className="logo">Taskify</h1>
          <div className="nav-links">
            <button className="nav-btn">Features</button>
            <button className="nav-btn">About Us</button>
            {user ? (
              <>
                <p>Welcome, {user.email}</p>
                <button className="nav-btn" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <button className="nav-btn login" onClick={() => navigate('/login')}>
                  Login
                </button>
                <button className="nav-btn signup" onClick={() => navigate('/signup')}>
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Manage Your Team's Work <span className="highlight">Efficiently</span>
          </h1>
          <p className="hero-text">
            Streamline your workflow, enhance collaboration, and boost productivity 
            with our comprehensive project management solution.
          </p>
          <div className="hero-buttons">
            <button className="primary-btn">Get Started</button>
            <button className="secondary-btn">Learn More</button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-grid">
          <div className="feature-card">
            <FaTasks className="feature-icon" />
            <h3>Task Management</h3>
            <p>
              Efficiently assign and track tasks. Admins can easily delegate work 
              to team members and monitor progress in real-time.
            </p>
          </div>

          <div className="feature-card">
            <FaVideo className="feature-icon" />
            <h3>Video Meetings</h3>
            <p>
              Connect with your team through seamless video conferencing. Hold 
              virtual meetings, discussions, and presentations.
            </p>
          </div>

          <div className="feature-card">
            <FaComments className="feature-icon" />
            <h3>Group Chat</h3>
            <p>
              Collaborate effectively with integrated group chat. Share updates, 
              files, and maintain clear communication.
            </p>
          </div>
        </div>
      </section>

      {/* Admin Dashboard Button */}
      {user && user.role === "project_admin" && (
        <div className="admin-dashboard">
          <button className="admin-btn" onClick={() => navigate('/admin-dashboard')}>
            Go to Admin Dashboard
          </button>
        </div>
      )}

      {/* About Us Section */}
      <section className="about">
        <div className="about-content">
          <h2 className="about-title">About Us</h2>
          <p className="about-text">
            We're dedicated to making project management simpler and more efficient 
            for teams of all sizes. Our platform combines powerful features with an 
            intuitive interface to help you achieve your goals.
          </p>

          <div className="stats">
            <div className="stat-item">
              <div className="stat-number">1000+</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Projects Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">98%</div>
              <div className="stat-label">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
