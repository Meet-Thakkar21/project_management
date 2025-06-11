// EmployeeDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircleIcon } from '@heroicons/react/outline';
import ToastContainer from './ToastContainer';
import {
  BellIcon,
  UserIcon,
  HomeIcon,
  ClipboardListIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentIcon
} from '@heroicons/react/outline';
import TasksComponent from './TasksComponent';
import TaskComponent from './TaskComponent';
import TeamsComponent from './TeamsComponent';
import TeamComponent from './TeamComponent';
import ProfileComponent from './ProfileComponent';
import NotificationComponent from './NotificationComponent';
import ProjectsComponent from './ProjectsComponent';
import DocumentsComponent from './DocumentsComponent';
import '../Styles/EmployeeDashboard.css';
import '../Styles/loading.css'

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const loadToastShown = useRef(false);

  const showToast = (message, type) => {
    if (window.showToast) {
      window.showToast(message, type);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        console.log(token);
        if (!token) {
          showToast("No token found. Please log in again.", "error");
          return;
        }
        // Fetch tasks
        const tasksResponse = await axios.get("http://localhost:5000/api/employee/tasks", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Format tasks to match our component structure
        const formattedTasks = tasksResponse.data.map(task => ({
          id: task._id,
          title: task.name,
          project: task.project.name,
          deadline: task.deadline,
          status: task.status === 'completed' ? 'completed' : 'pending'
        }));

        setTasks(formattedTasks);

        // Fetch teams
        const teamsResponse = await axios.get("http://localhost:5000/api/employee/teams", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTeams(teamsResponse.data);

        // Fetch user profile
        const profileResponse = await axios.get("http://localhost:5000/api/employee/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserProfile(profileResponse.data);

        // Get count of unread messages across all projects
        const messagesResponse = await axios.get("http://localhost:5000/api/chat/unread-count", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUnreadMessages(messagesResponse.data.count);
        setLoading(false);
        if (!loadToastShown.current) {
          showToast("Dashboard loaded successfully!", "success");
          loadToastShown.current = true;
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please check your connection and try again.');
        showToast("Failed to load dashboard data.", "error");
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  // Function to mark a task as complete
  const markTaskComplete = async (taskId) => {
    try {
      const token = localStorage.getItem("token");
      console.log(token);
      if (!token) {
        showToast("No token found. Please log in again.", "error");
        return;
      }
      // Find the task
      const task = tasks.find(t => t.id === taskId);

      if (!task) return;

      const newStatus = task.status === "completed" ? "pending" : "completed";

      await axios.patch(`http://localhost:5000/api/employee/tasks/${taskId}/status`,
        { status: newStatus }, // Body
        { headers: { Authorization: `Bearer ${token}` } } // Headers should be separate
      );

      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
      showToast(`Task ${newStatus === "completed" ? "completed" : "marked as pending"}!`, "success");
    } catch (err) {
      console.error('Error updating task:', err);
      showToast("Failed to update task status.", "error");
    }
  };

  // listener for the messagesRead event
  useEffect(() => {
    const handleMessagesRead = () => {
      // Re-fetch the unread count
      const fetchUnreadCount = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get("http://localhost:5000/api/chat/unread-count", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setUnreadMessages(response.data.count);
        } catch (error) {
          console.error("Error fetching unread count:", error);
        }
      };

      fetchUnreadCount();
    };
    window.addEventListener('messagesRead', handleMessagesRead);
    return () => {
      window.removeEventListener('messagesRead', handleMessagesRead);
    };
  }, []);

  // Count completed tasks
  const completedTasks = tasks.filter(task => task.status === "completed").length;
  const pendingTasks = tasks.filter(task => task.status === "pending").length;

  // If loading, show a loading indicator
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }
  // If there was an error, show error message
  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => {
          window.location.reload();
          showToast("Attempting to reload dashboard...", "alert");
        }}>Try Again</button>
      </div>
    );
  }

  const renderDashboardContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      );
    }
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className='dashboard-overview'>
            <h1 className="page-title">Employee Dashboard</h1>

            <div className="stats-container">
              <div className="stat-card">
                <div className="stat-icon tasks-icon">
                  <ClipboardListIcon />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{tasks.length}</div>
                  <div className="stat-label">Total Tasks</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon pending-icon">
                  <ClipboardListIcon />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{pendingTasks}</div>
                  <div className="stat-label">Pending Tasks</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon completed-icon">
                  <CheckCircleIcon />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{completedTasks}</div>
                  <div className="stat-label">Completed Tasks</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon teams-icon">
                  <UserGroupIcon />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{teams.length}</div>
                  <div className="stat-label">Team Memberships</div>
                </div>
              </div>
            </div>

            <div className="dashboard-content">
              {/* Using TaskComponent */}
              <TaskComponent tasks={tasks} markTaskComplete={markTaskComplete} />

              {/* Right Panel with Team Info and Upcoming Deadlines */}
              <div className="right-panel">
                {/* Using TeamComponent */}
                <TeamComponent teams={teams} setActiveTab={setActiveTab} />

                {/* Upcoming Deadlines */}
                <div className="deadlines-section">
                  <div className="section-header">
                    <h2>Upcoming Deadlines</h2>
                  </div>

                  <div className="deadlines-list">
                    {tasks
                      .filter(task => task.status === 'pending')
                      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                      .slice(0, 3)
                      .map(task => (
                        <div key={task.id} className="deadline-card">
                          <div className="deadline-date">
                            {new Date(task.deadline).toLocaleDateString('en-US', {
                              year: 'numeric', month: '2-digit', day: '2-digit'
                            })}
                          </div>
                          <div className="deadline-info">
                            <h3>{task.title}</h3>
                            <p>Project: {task.project}</p>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'tasks':
        return (
          <div className='tasks-container'>
            <h3 className="page-title">My Assigned Tasks</h3>
            <TasksComponent />
          </div>
        );
      case 'teams':
        return (
          <div className='tasks-container'>
            <h3 className="page-title">My Teams</h3>
            <TeamsComponent />
          </div>
        );
      case 'projects':
        return (
          <div className='tasks-container'>
            <h3 className="page-title">My Projects</h3>
            <ProjectsComponent />
          </div>
        );
      case 'documents':
        return (
          <div className='tasks-container'>
            <h3 className="page-title">Shared Documents</h3>
            <DocumentsComponent />
          </div>
        );
      case 'profile':
        return (
          <div>
            <h3 className="page-title">My Profile</h3>
            <ProfileComponent />
          </div>
        );
      case 'performance':
        return (
          <div>
            <h3 className="page-title">Performance Overview</h3>
            <img
              src="comingsoon.jpg"
              alt="Coming Soon"
              className="coming-soon-image"
            />
          </div>
        );
      default:
        return <div>Content not available</div>;
    }
  };

  // Tab changing event toast function
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    showToast(`Viewing ${tab} section`, "info");
  };

  return (
    <div className="employee-dashboard">
      <ToastContainer />
      <div className="sidebar">
        <div className="logo">
          <img src="/logo_crop.png" alt="Taskify Logo" className="nav-logo" onClick={() => navigate("/")} />
        </div>
        <ul className="nav-items">
          <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleTabChange('dashboard')}>
            <HomeIcon className="nav-icon" />
            <span>Dashboard</span>
          </li>
          <li className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => handleTabChange('tasks')}>
            <ClipboardListIcon className="nav-icon" />
            <span>Tasks</span>
          </li>
          <li className={`nav-item ${activeTab === 'teams' ? 'active' : ''}`} onClick={() => handleTabChange('teams')}>
            <UserGroupIcon className="nav-icon" />
            <span>Teams</span>
          </li>
          <li className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => handleTabChange('projects')}>
            <ClipboardListIcon className="nav-icon" />
            <span>Projects</span>
          </li>
          <li className={`nav-item ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => handleTabChange('documents')}>
            <DocumentIcon className="nav-icon" />
            <span>Documents</span>
          </li>
          <li className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleTabChange('profile')}>
            <UserIcon className="nav-icon" />
            <span>Profile</span>
          </li>
          <li className={`nav-item ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => handleTabChange('performance')}>
            <ChartBarIcon className="nav-icon" />
            <span>Performance</span>
          </li>
        </ul>
      </div>
      <div className="main-content">
        <div className="header">
          <div className="search-bar">
            <input type="text" placeholder="Search..." />
          </div>
          <div className="user-info">
            <NotificationComponent
              pendingTasks={pendingTasks}
              unreadMessages={unreadMessages}
              setUnreadMessages={setUnreadMessages}  // Setter function
            />
            <div className="user-avatar">
              <span className="avatar-text">
                {userProfile && `${userProfile.firstName?.charAt(0) || ''}${userProfile.lastName?.charAt(0) || 'U'}`}
              </span>
              <span className="user-name">
                {userProfile ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}` : 'Employee User'}
              </span>
            </div>
          </div>
        </div>
        <main className="content">
          <div className="page-header">
            <div className="breadcrumb">
              <span>Home</span>
              <span>/</span>
              <span>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
            </div>
          </div>
          {renderDashboardContent()}
        </main>
      </div>
    </div>
  );
};
export default EmployeeDashboard;