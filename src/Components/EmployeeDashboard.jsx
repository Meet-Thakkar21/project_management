// EmployeeDashboard.jsx
import React, { useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/outline';
import { 
  BellIcon, 
  HomeIcon, 
  ClipboardListIcon, 
  UserGroupIcon, 
  ChartBarIcon 
} from '@heroicons/react/outline';
import TaskComponent from './TaskComponent';
import TeamComponent from './TeamComponent';
import NotificationComponent from './NotificationComponent';
import '../Styles/EmployeeDashboard.css';

const EmployeeDashboard = () => {
  // Mock data - in a real app, this would come from your database
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Complete UI Design', project: 'Proj1', deadline: '2025-03-14T00:00:00Z', status: 'pending' },
    { id: 2, title: 'Fix Navigation Bug', project: 'Proj2', deadline: '2025-03-15T00:00:00Z', status: 'pending' },
    { id: 3, title: 'Create API Documentation', project: 'Proj3', deadline: '2025-03-18T00:00:00Z', status: 'pending' },
    { id: 4, title: 'User Testing', project: 'Proj1', deadline: '2025-03-20T00:00:00Z', status: 'pending' },
  ]);

  const teams = [
    { id: 1, name: 'UI Development', members: 4 },
    { id: 2, name: 'Backend Team', members: 3 },
  ];

  // Function to mark a task as complete
  const markTaskComplete = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' } : task
    ));
  };

  // Count completed tasks
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;

  return (
    <div className="employee-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <h1>Taskify</h1>
        </div>
        <ul className="nav-items">
          <li className="nav-item active">
            <HomeIcon className="nav-icon" />
            <span>Dashboard</span>
          </li>
          <li className="nav-item">
            <ClipboardListIcon className="nav-icon" />
            <span>My Tasks</span>
          </li>
          <li className="nav-item">
            <UserGroupIcon className="nav-icon" />
            <span>My Teams</span>
          </li>
          <li className="nav-item">
            <ChartBarIcon className="nav-icon" />
            <span>My Performance</span>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <div className="search-bar">
            <input type="text" placeholder="Search..." />
          </div>
          <div className="user-info">
            {/* Using NotificationComponent */}
            <NotificationComponent pendingTasks={pendingTasks} />
            <div className="user-avatar">
              <span className="avatar-text">EU</span>
              <span className="user-name">Employee User</span>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span>Home</span> / <span>Dashboard</span>
        </div>

        <h1 className="page-title">Employee Dashboard</h1>

        {/* Stats Cards */}
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

        {/* Main Dashboard Content */}
        <div className="dashboard-content">
          {/* Using TaskComponent */}
          <TaskComponent tasks={tasks} markTaskComplete={markTaskComplete} />

          {/* Right Panel with Team Info and Upcoming Deadlines */}
          <div className="right-panel">
            {/* Using TeamComponent */}
            <TeamComponent teams={teams} />

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
    </div>
  );
};

export default EmployeeDashboard;