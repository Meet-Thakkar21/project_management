import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/AdminDashboard.css';
import axios from 'axios';
const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [modalType, setModalType] = useState('');
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', members: [] });
  const [teamMembers, setTeamMembers] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [adminId, setadminId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    name: "",
    project: "",     // Project ID (from dropdown)
    assignedTo: "",  // User ID (from dropdown)
    deadline: "",    // YYYY-MM-DD format
    status: "pending", // Default status
  });



  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log(token);
      if (!token) {
        alert("No token found. Please log in again.");
        return;
      }

      const response = await axios.get("http://localhost:5000/api/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Projects fetched:", response.data); // Debug log
      setProjects(response.data.projects);
    } catch (error) {
      console.error("Error fetching projects:", error.response?.data || error);
      alert("Failed to fetch projects. " + (error.response?.data?.message || ""));
    }
  };

  const fetchTeamMembers = async () => {
    try {
      // console.log(adminId);

      const response = await axios.get(`http://localhost:5000/api/teams/${adminId}/members`);
      setTeamMembers(response.data);
    } catch (error) {
      console.error('Error fetching team members:', error.response?.data?.message || error.message);
    }
  };

  const fetchTasks = async () => {
    try {
      // console.log(adminId);

      const response = await axios.get(`http://localhost:5000/api/tasks/${adminId}`);
      setTasks(response.data);
      console.log("Tasks: " + response.data)
    } catch (error) {
      console.error('Error fetching tasks:', error.response?.data?.message || error.message);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.description) {
      alert("Please fill out all fields!");
      return;
    }

    try {
      const token = localStorage.getItem("token"); // Get token from localStorage

      const response = await axios.post(
        "http://localhost:5000/api/projects",
        newProject,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include Authorization header
            "Content-Type": "application/json", // Ensure correct content type
          },
        }
      );

      if (response.status === 201) {
        // Update local state
        setProjects([...projects, response.data]);

        // Reset form
        setNewProject({ name: "", description: "" });

        // Close modal
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error adding project:", error);
      alert("Failed to add project.");
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user'); // Fetch user object
    if (storedUser) {
      const user = JSON.parse(storedUser); // Parse JSON string
      setadminId(user.id); // Set adminId
      console.log(adminId);
    } else {
      console.error('User not found in localStorage');
    }
  }, []);

  useEffect(() => {
    console.log(adminId);
    if (adminId) {
      fetchProjects();  // Ensure adminId is set before fetching
      fetchTeamMembers();
      fetchTasks();
    }
  }, [adminId]);



  const addMember = async () => {
    try {
      const response = await axios.post(`http://localhost:5000/api/teams/${adminId}/add-member`, { email, role });

      const newMember = {
        _id: response.data.member._id, // Member ID
        email: response.data.member.email, // Member Email
        role: response.data.member.role // Role assigned by admin
      };

      setTeamMembers([...teamMembers, newMember]); // Update UI with new member
      setShowModal(false);
      setEmail('');
      setRole('');
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding member');
    }
  };




  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask({ ...newTask, [name]: value });
  };


  const createTask = async () => {
    try {
      const token = localStorage.getItem("token"); // Get token from localStorage
      console.log("name: " + newTask.name);
      const taskData = {
        name: newTask.name,          // Task name
        project: newTask.project,    // Project ID
        assignedTo: newTask.assignedTo, // User ID of the assigned person
        deadline: newTask.deadline,  // Task deadline
        status: newTask.status || "pending", // Default status if not provided
      };

      const response = await axios.post(
        `http://localhost:5000/api/tasks/${adminId}`,
        taskData,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include Authorization header
            "Content-Type": "application/json", // Ensure correct content type
          },
        }
      );

      if (response.status === 201) {
        // Update local state
        setTasks([...tasks, response.data.task]);

        // Reset form
        setNewTask({ name: "", project: "", assignedTo: "", deadline: "", status: "" });

        // Close modal
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert(error.response?.data?.message || "Failed to create task.");
    }
  };



  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [activeTab]);
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
          <div className="dashboard-overview">
            <div className="stat-cards">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-project-diagram"></i>
                </div>
                <div className="stat-details">
                  <h3>{projects.length}</h3>
                  <p>Active Projects</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-tasks"></i>
                </div>
                <div className="stat-details">
                  <h3>{tasks.length}</h3>
                  <p>Total Tasks</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-details">
                  <h3>{teamMembers.length}</h3>
                  <p>Team Members</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="stat-details">
                  <h3>{tasks.filter(task => task.status === 'Completed').length}</h3>
                  <p>Completed Tasks</p>
                </div>
              </div>
            </div>

            <div className="dashboard-content">
              <div className="recent-projects">
                <div className="section-header">
                  <h2>Project Overview</h2>
                  <button className="action-button" onClick={() => setShowModal(true)}>
                    <i className="fas fa-plus"></i> New Project
                  </button>
                </div>
                <div className="project-list">
                  {projects.map(project => (
                    <div className="project-card" key={project._id}>
                      <h3>{project.name}</h3>
                      <p>{project.description}</p>
                      <div className="project-progress">
                        <div className="progress-info">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
                        </div>
                      </div>
                      <div className="project-details">
                        <div className="detail-item">
                          <i className="fas fa-users"></i>
                          <span>{project.members?.length || 0} Members</span>

                        </div>
                        <div className="detail-item">
                          <i className="fas fa-tasks"></i>
                          <span>{project.completed}/{project.tasks} Tasks</span>
                        </div>
                      </div>
                      <button className="view-button">View Details</button>
                    </div>
                  ))}
                </div>


                {showModal && (
                  <div className="modal">
                    <div className="modal-content">
                      <h3>Create New Project</h3>
                      <input
                        type="text"
                        placeholder="Project Name"
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      />
                      <textarea
                        placeholder="Project Description"
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      />
                      <button onClick={handleCreateProject}>Create</button>
                      <button onClick={() => setShowModal(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="upcoming-tasks">
                <div className="section-header">
                  <h2>Upcoming Deadlines</h2>
                  <button className="action-button" onClick={() => openModal('task')}>
                    <i className="fas fa-plus"></i> New Task
                  </button>
                </div>
                <div className="task-list">
                  {Array.isArray(tasks) && tasks.map(task => (
                    <div className="task-item" key={task.id}>
                      <div className="task-status">
                        <span className={`status-badge ${task.status.toLowerCase().replace(' ', '-')}`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="task-info">
                        <h4>{task.name}</h4>
                        <p>{task.project.name}</p>
                      </div>

                      <div className="task-deadline">
                        <i className="far fa-calendar-alt"></i>
                        <span>{task.deadline}</span>
                      </div>
                      <div className="task-actions">
                        <button className="icon-button">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="icon-button">
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'projects':
        return (
          <div className="projects-container">
            <div className="section-header">
              <h2>Projects Management</h2>
              <button className="action-button" onClick={() => openModal('project')}>
                <i className="fas fa-plus"></i> Create Project
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Members</th>
                  <th>Tasks</th>
                  <th>Progress</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project.id}>
                    <td>{project.name}</td>
                    {/* <td>{project.members}</td> */}
                    <td>{project.completed}/{project.tasks}</td>
                    <td>
                      <div className="table-progress-bar">
                        <div className="table-progress-fill" style={{ width: `${project.progress}%` }}></div>
                      </div>
                      <span>{project.progress}%</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="icon-button">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="icon-button">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="icon-button">
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'members':
        return (
          <div className="members-container">
            <div className="section-header">
              <h2>Team Members</h2>
              <button className="action-button" onClick={() => setShowModal(true)}>
                <i className="fas fa-plus"></i> Add Member
              </button>
            </div>

            {/* Team Members Table */}
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member._id}>
                    <td>{member.memberId?.firstName} {member.memberId?.lastName}</td>
                    <td>{member.role}</td>
                    <td>{member.memberId?.email}</td>
                    <td>
                      <button className="icon-button">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Add Member Modal */}
            {showModal && (
              <div className="modal">
                <div className="modal-content">
                  <h3>Add Member</h3>
                  <label>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <label>Role</label>
                  <input type="text" value={role} onChange={(e) => setRole(e.target.value)} />
                  <button onClick={addMember}>Add Member</button>
                  <button onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        );
      case 'tasks':
        return (
          <div className="tasks-container">
            <div className="section-header">
              <h2>Tasks Management</h2>
              <button className="action-button" onClick={() => setShowModal(true)}>
                <i className="fas fa-plus"></i> Create Task
              </button>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Task Name</th>
                  <th>Project</th>
                  <th>Assigned To</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(tasks) && tasks.map(task => (
                  <tr key={task._id}>
                    <td>{task.name}</td>
                    <td>{task.project.name || "N/A"}</td>
                    <td>{task.assignedTo?.email || "Unassigned"}</td>
                    <td>{new Date(task.deadline).toLocaleDateString()}</td>
                    <td>{task.status}</td>
                    <td>
                      <button className="icon-button"><i className="fas fa-edit"></i></button>
                      <button className="icon-button"><i className="fas fa-trash-alt"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {showModal && (
              <div className="modal">
                <div className="modal-content">
                  <h3>Create Task</h3>
                  <input type="text" name="name" placeholder="Task Name" onChange={handleInputChange} />
                  <select name="project" onChange={handleInputChange}>
                    <option value="">Select Project</option>
                    {projects.map(proj => (
                      <option key={proj._id} value={proj._id}>{proj.name}</option>
                    ))}
                  </select>
                  <select name="assignedTo" onChange={handleInputChange}>
                    <option value="">Assign To</option>
                    {teamMembers.map(member => (
                      <option key={member.memberId._id} value={member.memberId._id}>
                        {member.memberId.email}
                      </option>
                    ))}
                  </select>
                  <input type="date" name="deadline" onChange={handleInputChange} />
                  <button onClick={createTask}>Create</button>
                  <button onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <div>Content not available</div>;
    }
  };

  const renderModal = () => {
    if (!showModal) return null;

    let modalContent;
    let modalTitle;

    switch (modalType) {
      case 'project':
        modalTitle = 'Create New Project';
        modalContent = (
          <form className="modal-form">
            <div className="form-group">
              <label>Project Name</label>
              <input type="text" placeholder="Enter project name" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea placeholder="Enter project description"></textarea>
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" />
            </div>
            <div className="form-group">
              <label>Team Members</label>
              <select multiple>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
            <div className="form-buttons">
              <button type="button" className="cancel-button" onClick={closeModal}>Cancel</button>
              <button type="submit" className="submit-button">Create Project</button>
            </div>
          </form>
        );
        break;
      case 'task':
        modalTitle = 'Assign New Task';
        modalContent = (
          <form className="modal-form">
            <div className="form-group">
              <label>Task Title</label>
              <input type="text" placeholder="Enter task title" />
            </div>
            <div className="form-group">
              <label>Project</label>
              <select>
                <option value="">Select Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea placeholder="Enter task description"></textarea>
            </div>
            <div className="form-group">
              <label>Assign To</label>
              <select>
                <option value="">Select Team Member</option>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input type="date" />
            </div>
            <div className="form-buttons">
              <button type="button" className="cancel-button" onClick={closeModal}>Cancel</button>
              <button type="submit" className="submit-button">Create Task</button>
            </div>
          </form>
        );
        break;
      case 'member':
        modalTitle = 'Add Team Member';
        modalContent = (
          <form className="modal-form">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="Enter full name" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="Enter email address" />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input type="text" placeholder="Enter job role" />
            </div>
            <div className="form-group">
              <label>Department</label>
              <select>
                <option value="">Select Department</option>
                <option value="development">Development</option>
                <option value="design">Design</option>
                <option value="marketing">Marketing</option>
                <option value="management">Management</option>
              </select>
            </div>
            <div className="form-group">
              <label>Assign to Projects</label>
              <select multiple>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
            <div className="form-buttons">
              <button type="button" className="cancel-button" onClick={closeModal}>Cancel</button>
              <button type="submit" className="submit-button">Add Member</button>
            </div>
          </form>
        );
        break;
      default:
        modalContent = <div>Modal content not available</div>;
    }

    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h2>{modalTitle}</h2>
            <button className="close-button" onClick={closeModal}>×</button>
          </div>
          <div className="modal-body">
            {modalContent}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <div className="sidebar">
        <div className="brand">
          <h1>Taskify</h1>
        </div>
        <div className="menu">
          <ul>
            <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
              <i className="fas fa-th-large"></i>
              <span>Dashboard</span>
            </li>
            <li className={activeTab === 'projects' ? 'active' : ''} onClick={() => setActiveTab('projects')}>
              <i className="fas fa-project-diagram"></i>
              <span>Projects</span>
            </li>
            <li className={activeTab === 'tasks' ? 'active' : ''} onClick={() => setActiveTab('tasks')}>
              <i className="fas fa-tasks"></i>
              <span>Tasks</span>
            </li>
            <li className={activeTab === 'members' ? 'active' : ''} onClick={() => setActiveTab('members')}>
              <i className="fas fa-users"></i>
              <span>Team</span>
            </li>
            <li className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>
              <i className="fas fa-chart-bar"></i>
              <span>Analytics</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="main-content">
        <header className="header">
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search..." />
          </div>
          <div className="header-right">
            <div className="notifications">
              <i className="far fa-bell"></i>
              <span className="notification-badge">3</span>
            </div>
            <div className="admin-profile">
              <div className="admin-avatar">A</div>
              <div className="admin-info">
                <h4>Admin User</h4>
                <p></p>
              </div>
            </div>
          </div>
        </header>
        <main className="content">
          <div className="page-header">
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <div className="breadcrumb">
              <span>Home</span>
              <span>/</span>
              <span>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
            </div>
          </div>
          {renderDashboardContent()}
        </main>
      </div>
      {renderModal()}
    </div>
  );
};

export default AdminDashboard;