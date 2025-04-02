import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/AdminDashboard.css';
import '../Styles/loading.css';
import NotificationComponent from './NotificationComponent';
import CustomAlert from './CustomAlert';
import axios from 'axios';
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [modalType, setModalType] = useState('');
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', members: [] });
  const [teamMembers, setTeamMembers] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [adminId, setadminId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const [expandedMemberId, setExpandedMemberId] = useState(null);
  const [newTask, setNewTask] = useState({
    name: "",
    project: "",     // Project ID (from dropdown)
    assignedTo: "",  // User ID (from dropdown)
    deadline: "",    // YYYY-MM-DD format
    status: "pending", // Default status
  });
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  /*Filter states*/
  const [selectedFilterProject, setSelectedFilterProject] = useState("all");
  const [selectedProjStatus, setSelectedProjStatus] = useState("all");

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 3000);
  };

  const projectNames = [...new Set(tasks.map(task => task.project?.name).filter(Boolean))];

  // Function to filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesProject = selectedFilterProject === "all" || task.project?.name === selectedFilterProject;
    const matchesStatus = selectedProjStatus === "all" || task.status === selectedProjStatus;
    return matchesProject && matchesStatus;
  });

  const clearFilters = () => {
    setSelectedFilterProject("all");
    setSelectedProjStatus("all");

    // Force a UI re-render by setting a temporary state
    setTimeout(() => {
      setSelectedProject("all");
    }, 10);
  };

  /*Fetching Data*/
  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log(token);
      if (!token) {
        showAlert("alert", "No token found. Please log in again.");
        return;
      }

      const response = await axios.get("http://localhost:5000/api/projects/my-projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const projectsWithProgress = response.data.projects.map(project => {
        const totalTasks = project.tasks || 0;
        const completedTasks = project.completed || 0;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...project,
          progress,
          tasks: totalTasks,
          completed: completedTasks
        };
      });

      console.log(projectsWithProgress);
      const sortedProjects = projectsWithProgress.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setProjects(sortedProjects);
    } catch (error) {
      showAlert("error", "Failed to fetch projects!");
    }
  };

  const fetchTeamMembers = async () => {
    try {
      // console.log(adminId);

      const response = await axios.get(`http://localhost:5000/api/teams/${adminId}/members`);
      const uniqueMembers = new Set();
      const uniqueMembersArray = [];

      response.data.forEach(member => {
        if (!uniqueMembers.has(member.memberId?._id)) {
          uniqueMembers.add(member.memberId?._id);
          uniqueMembersArray.push(member);
        }
      });
      console.log(uniqueMembersArray);
      setTeamMembers(uniqueMembersArray);
    } catch (error) {
      showAlert('error', 'Error fetching team members:', error.response?.data?.message || error.message);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log(token);
      if (!token) {
        alert("No token found. Please log in again.");
        return;
      }
      const profileResponse = await axios.get("http://localhost:5000/api/employee/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserProfile(profileResponse.data);
    } catch (error) {
      console.error("Error fetching profile:", error.response?.data || error);
      showAlert("error", "Failed to fetch Profile Data.");
    }
  };

  const fetchTasks = async () => {
    try {
      // console.log(adminId);

      const response = await axios.get(`http://localhost:5000/api/tasks/${adminId}`);
      setTasks(response.data);
      console.log("Tasks: " + response.data)
    } catch (error) {
      showAlert("error", "Failed to fetch tasks");
      console.error('Error fetching tasks:', error.response?.data?.message || error.message);
    }
  };
  const completedTasks = tasks.filter(task => task.status === "completed").length;
  const pendingTasks = tasks.filter(task => task.status === "pending").length;

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.description || newProject.members.length === 0) {
      showAlert("alert", "Please fill out all fields and select at least one member!");
      return;
    }

    try {
      const token = localStorage.getItem("token"); // Get token from localStorage
      const projectData = {
        name: newProject.name,
        description: newProject.description,
        members: newProject.members || [], // Ensure members are included
      };
      console.log(projectData);
      const response = await axios.post(
        "http://localhost:5000/api/projects",
        projectData,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include Authorization header
            "Content-Type": "application/json", // Ensure correct content type
          },
        }
      );

      if (response.status === 201) {
        setProjects([...projects, response.data.project]);
        setNewProject({ name: "", description: "", members: [] });
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error adding project:", error);
      showAlert("alert", "Failed to add project.");
    }
  };

  const handleMemberSelection = (memberId) => {
    setNewProject((prevProject) => {
      const isSelected = prevProject.members.includes(memberId);
      console.log(isSelected);
      console.log(memberId);
      return {
        ...prevProject,
        members: isSelected
          ? prevProject.members.filter(id => id !== memberId) // Remove if unchecked
          : [...prevProject.members, memberId], // Add if checked
      };
    });
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user'); // Fetch user object
    if (storedUser) {
      const user = JSON.parse(storedUser); // Parse JSON string
      setadminId(user.id); // Set adminId
      console.log(adminId);
    } else {
      showAlert('error', 'User not found in localStorage');
    }
  }, []);

  useEffect(() => {
    console.log(adminId);
    if (adminId) {
      fetchProjects();
      fetchTeamMembers();
      fetchUserProfile();
      fetchTasks();
    }
  }, [adminId]);

  // Add member
  const addMember = async () => {
    try {
      var status = "Activate";
      const response = await axios.post(`http://localhost:5000/api/teams/${adminId}/add-member`, { email, role, status });

      if (response.status === 200) {
        const newMember = {
          _id: response.data.member._id, // Member ID
          firstName: response.data.member.firstName,
          lastName: response.data.member.lastName,
          email: response.data.member.email,
          role: response.data.member.role,
          status: response.data.member.status
        };
        const memberExists = teamMembers.some(member =>
          member.memberId?._id === newMember.memberId._id
        );

        if (!memberExists) {
          setTeamMembers([...teamMembers, newMember]);
        }
        setShowModal(false);

        setEmail('');
        setRole('');
        showAlert("success", "Member added successfully!");
      }
    } catch (error) {
      console.error(error.response?.data?.message || 'Error adding member');
      showAlert("error", "Failed to add member");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingTask) {
      setEditingTask({ ...editingTask, [name]: value });
    } else {
      setNewTask({ ...newTask, [name]: value });
    }
  };

  const toggleMemberDetails = (memberId) => {
    setExpandedMemberId(prevId => prevId === memberId ? null : memberId);
  };

  const createTask = async () => {
    try {
      const token = localStorage.getItem("token"); // Get token from localStorage
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
        setTasks([...tasks, response.data.task]);
        fetchProjects();
        setNewTask({ name: "", project: "", assignedTo: "", deadline: "", status: "" });

        setShowModal(false);
        showAlert("success", "Task created successfully!");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      showAlert("error", "Failed to create task.");
    }
  };

  const updateTask = async () => {
    if (!editingTask || !editingTask._id) {
      showAlert("alert", "No task selected for update");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await axios.put(
        `http://localhost:5000/api/tasks/${editingTask._id}`,
        editingTask,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const updatedTask = response.data.task;
      if (response.status === 200) {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task._id === updatedTask._id ? updatedTask : task
          )
        );
        fetchProjects();
        setEditingTask(null);

        setShowModal(false);
        showAlert("success", "Task updated successfully!");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      showAlert("error", "Failed to update task.");
    }
  };

  const deleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const token = localStorage.getItem("token");

      const response = await axios.delete(
        `http://localhost:5000/api/tasks/${taskToDelete}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setTasks(tasks.filter(task => task._id !== taskToDelete));
        fetchProjects();
        setTaskToDelete(null);

        setShowModal(false);
        showAlert("success", "Task deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      showAlert("error", "Failed to delete task.");
    }
  };

  const deleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const token = localStorage.getItem("token");

      const response = await axios.delete(
        `http://localhost:5000/api/projects/${projectToDelete}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        fetchProjects();
        setProjectToDelete(null);

        setShowModal(false);
        showAlert("success", "Project removed permanantly!");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      showAlert("error", "Failed to delete project.");
    }
  };

  //Toggle Member Status
  const toggleMemberStatus = async (memberId, currentStatus) => {
    if (loadingStatus[memberId]) return;

    const updatedLoadingStatus = { ...loadingStatus, [memberId]: true };
    setLoadingStatus(updatedLoadingStatus);

    try {
      const token = localStorage.getItem("token");
      const newStatus = currentStatus === "Activate" ? "Deactivate" : "Activate"; // Toggle status

      await axios.put(`http://localhost:5000/api/teams/update-status/${memberId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update UI instantly
      setTeamMembers(prevMembers =>
        prevMembers.map(member =>
          member.memberId._id === memberId ? { ...member, status: newStatus } : member
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
      setLoadingStatus(prev => {
        const newLoadingStatus = { ...prev };
        delete newLoadingStatus[memberId];
        return newLoadingStatus;
      });
      showAlert("error", "Failed to update member status.");

    } finally {
      setLoadingStatus(prev => {
        const newLoadingStatus = { ...prev };
        delete newLoadingStatus[memberId];
        return newLoadingStatus;
      });
    }
  };

  // Modal Handling Code
  const openProjectDetailsModal = (project) => {
    setSelectedProject(project);
    setModalType('projectDetails');
    setShowModal(true);
  };

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setSelectedProject(null);
    setTaskToDelete(null);
    setProjectToDelete(null);
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [activeTab]);

  const openEditTaskModal = (task) => {
    setEditingTask(task);
    setModalType('editTask');
    setShowModal(true);
  };

  const openDeleteTaskModal = (taskId) => {
    setTaskToDelete(taskId.toString());
    setModalType('deleteTask');
    setShowModal(true);
  };

  const openDeleteProjectModal = (projectId) => {
    setProjectToDelete(projectId.toString());
    setModalType('deleteProject');
    setShowModal(true);
  };

  // Project chat navigation for admin
  const openProjectChat = (projectId) => {
    setTimeout(() => {
      setAlert({ type: 'success', message: 'Redirecting to Chat Interface' });
      navigate(`/projects/${projectId}/chat`); // Navigate after 2 seconds
    }, 2000);
  };

  const renderDashboardContent = () => {
    if (loading) {
      return (
        <div>
          {alert.message && (
            <CustomAlert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert({ type: '', message: '' })}
            />
          )}
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
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
                  <h3>{completedTasks}</h3>
                  <p>Completed Tasks</p>
                </div>
              </div>
            </div>

            <div className="dashboard-content">
              <div className="recent-projects">
                <div className="section-header">
                  <h2>Project Overview</h2>
                  <button className="action-button" onClick={() => openModal('project')}>
                    <i className="fas fa-plus"></i> New Project
                  </button>
                </div>
                <div className="project-list">
                  {projects.slice(0, 4).map(project => (
                    <div className="projectcard" key={project._id}>
                      <h3>{project.name}</h3>
                      {/* <p>{project.description}</p> */}
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
                      <button className="view-button" onClick={() => openProjectDetailsModal(project)}>View Details</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="upcoming-tasks">
                <div className="section-header">
                  <h2>Upcoming Deadlines</h2>
                  <button className="action-button" onClick={() => openModal('task')}>
                    <i className="fas fa-plus"></i> New Task
                  </button>
                </div>
                <div className="task-list">
                  {Array.isArray(tasks) && tasks.slice(0, 5).map(task => (
                    <div className="task-item" key={task.id}>
                      <div className="task-status">
                        <span className={`status-badge ${task.status.toLowerCase().replace(' ', '-')}`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="task-info">
                        <h4>{task.name}</h4>
                        <p>{task.project?.name}</p>
                      </div>

                      <div className="task-deadline">
                        <i className="far fa-calendar-alt"></i>
                        <span>{new Date(task.deadline).toLocaleDateString()}</span>
                      </div>
                      <div className="task-actions">
                        <button className="icon-button" onClick={() => openEditTaskModal(task)}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="icon-button" onClick={() => openDeleteTaskModal(task._id)}>
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
                    <td>{project.members?.length || 0}</td>
                    <td>{project.completed}/{project.tasks}</td>
                    <td>
                      <div className="table-progress-bar">
                        <div className="table-progress-fill" style={{ width: `${project.progress}%` }}></div>
                      </div>
                      <span>{project.progress}%</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="icon-button" onClick={() => openProjectDetailsModal(project)}>
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="icon-button" onClick={() => openProjectChat(project._id)}>
                          <i className="fas fa-comment-dots"></i>
                        </button>
                        <button className="icon-button" onClick={() => openDeleteProjectModal(project._id)}>
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
              <button className="action-button" onClick={() => openModal('member')}>
                <i className="fas fa-plus"></i> Add Member
              </button>
            </div>

            {/* Team Members Table */}
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Change Status</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => {
                  const memberId = member.memberId?._id;
                  const isLoading = loadingStatus[memberId];

                  return (
                    <React.Fragment key={memberId}>
                      <tr>
                        <td>{member.memberId?.firstName} {member.memberId?.lastName}</td>
                        <td>{member.memberId?.email}</td>
                        <td>{member.status}</td>
                        <td>
                          <button
                            className="status-toggle-button"
                            onClick={() => toggleMemberStatus(memberId, member.status)}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <span className="loading-indicator">
                                Loading...
                              </span>
                            ) : (
                              member.status === "Activate" ? "Deactivate" : "Activate"
                            )}
                          </button>
                        </td>
                        <td>
                          <button
                            className="icon-button"
                            onClick={() => toggleMemberDetails(memberId)}
                          >
                            <i className={`fas ${expandedMemberId === memberId ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                          </button>
                        </td>
                      </tr>
                      {expandedMemberId === memberId && (
                        <tr className="member-details-row">
                          <td colSpan="5">
                            <div className="member-details-container">
                              <div className="member-details-layout">
                                {/* Left Side - Profile Photo and Skills */}
                                <div className="member-details-left">
                                  <div className="member-profile-photo">
                                    {member.memberId?.firstName && member.memberId?.lastName
                                      ? `${member.memberId.firstName[0].toUpperCase()}${member.memberId.lastName[0].toUpperCase()}`
                                      : 'UN'}
                                  </div>
                                  <div className="member-skills-box">
                                    <strong>Skills:</strong>
                                    <p>
                                      {member.memberId?.skills && member.memberId.skills.length > 0
                                        ? member.memberId.skills.join(', ')
                                        : 'No skills specified'}
                                    </p>
                                  </div>
                                </div>

                                {/* Right Side - Personal Details Grid */}
                                <div className="member-details-right">
                                  <div className="details-grid">
                                    <div className="detail-box">
                                      <strong>Name</strong>
                                      <p>{member.memberId?.firstName} {member.memberId?.lastName}</p>
                                    </div>
                                    <div className="detail-box">
                                      <strong>DOB</strong>
                                      <p>
                                        {member.memberId?.dob
                                          ? new Date(member.memberId.dob).toLocaleDateString()
                                          : 'Not specified'}
                                      </p>
                                    </div>
                                    <div className="detail-box">
                                      <strong>Gender</strong>
                                      <p>{member.memberId?.gender || 'Not specified'}</p>
                                    </div>
                                    <div className="detail-box">
                                      <strong>Email</strong>
                                      <p>{member.memberId?.email}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div >
        );
      case 'tasks':
        return (
          <div className="tasks-container">
            <div className="section-header">
              <h2>Tasks Management</h2>
              {/* Task Filters */}
              <div className="filters">
                {/* Filter by Project */}
                <select className="filter-dropdown" value={selectedProject} onChange={(e) => setSelectedFilterProject(e.target.value)}>
                  <option value="all">All Projects</option>
                  {projectNames.map((project, index) => (
                    <option key={index} value={project}>{project}</option>
                  ))}
                </select>

                {/* Filter by Status */}
                <button className={`filter-btn ${selectedProjStatus === "all" ? "active" : ""}`} onClick={() => setSelectedProjStatus("all")}>All</button>
                <button className={`filter-btn ${selectedProjStatus === "pending" ? "active" : ""}`} onClick={() => setSelectedProjStatus("pending")}>Pending</button>
                <button className={`filter-btn ${selectedProjStatus === "in_progress" ? "active" : ""}`} onClick={() => setSelectedProjStatus("in_progress")}>In Progress</button>
                <button className={`filter-btn ${selectedProjStatus === "completed" ? "active" : ""}`} onClick={() => setSelectedProjStatus("completed")}>Completed</button>

                {/* Clear Filters */}
                <button className="clear-filters" onClick={clearFilters}>Clear Filters</button>
              </div>
              <button className="action-button" onClick={() => openModal('task')}>
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
                {filteredTasks.length > 0 ? (
                  filteredTasks.map(task => (
                    <tr key={task._id}>
                      <td>{task.name}</td>
                      <td>{task.project.name || "N/A"}</td>
                      <td>{task.assignedTo?.firstName} {task.assignedTo?.lastName}</td>
                      <td>{new Date(task.deadline).toLocaleDateString()}</td>
                      <td className="task-status">
                        <span className={`status-badge ${task.status.toLowerCase().replace(' ', '-')}`}>
                          {task.status}
                        </span>
                      </td>
                      <td>
                        <button className="icon-button" onClick={() => openEditTaskModal(task)}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="icon-button" onClick={() => openDeleteTaskModal(task._id)}>
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="no-data">No tasks match the selected filters</td></tr>
                )}
              </tbody>
            </table>
          </div>
        );

      case 'analytics':
        return (
          <div className="tasks-container">
            <div className="section-header">
              <h3 className="page-title">Performance Overview</h3>
            </div>
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

  const renderModal = () => {
    if (!showModal) return null;

    switch (modalType) {
      case 'project':
        return (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modalheader">
                <h2>Create New Project</h2>
                <button className="close-button" onClick={closeModal}>X</button>
              </div>
              <div className="modal-body">
                <form className="modal-form">
                  <div className="form-group">
                    <label>Project Name</label>
                    <input
                      type="text"
                      placeholder="Enter project name"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      placeholder="Enter project description"
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    ></textarea>
                  </div>
                  <div className="form-group">
                    <label>Team Members</label>
                    <div className="team-members-list">
                      {teamMembers.map(member => (
                        <div key={member.memberId._id} className="team-member-item">
                          <input
                            type="checkbox"
                            id={member.memberId._id}
                            checked={newProject.members.includes(member.memberId._id)}
                            onChange={() => handleMemberSelection(member.memberId._id)}
                          />
                          <label htmlFor={member.memberId._id}>
                            {member.memberId.firstName} {member.memberId.lastName}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="form-buttons">
                    <button type="button" className="cancel-button" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="submit-button" onClick={handleCreateProject}>Create Project</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      case 'projectDetails':
        if (!selectedProject) return null;
        return (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modalheader">
                <h2>Project Details</h2>
                <button className="close-button" onClick={closeModal}>X</button>
              </div>
              <div className="modal-body">
                <div className="project-detail-container">
                  <h3>{selectedProject.name}</h3>
                  <p><strong>Description:</strong> {selectedProject.description}</p>

                  <div className="progress-section">
                    <h4>Progress: {selectedProject.progress}%</h4>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${selectedProject.progress}%` }}></div>
                    </div>
                  </div>
                  <div className="detail-section">
                    <h4>Tasks</h4>
                    <p>{selectedProject.completed} completed of {selectedProject.tasks} total tasks</p>
                  </div>

                  {/* Team Members */}
                  <div className="detail-section">
                    <h4>Team Members</h4>
                    <ul className="team-members">
                      {selectedProject.members && selectedProject.members.length > 0 ? (
                        selectedProject.members.map(member => (
                          <li key={member._id}>
                            {member.firstName} {member.lastName}
                          </li>
                        ))
                      ) : (
                        <li>No team members assigned</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'task':
        return (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Create New Task</h2>
                <button className="close-button" onClick={closeModal}>X</button>
              </div>
              <div className="modal-body">
                <form className="modal-form">
                  <div className="form-group">
                    <label>Task Name</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter task name"
                      value={newTask.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Project</label>
                    <select name="project" value={newTask.project} onChange={handleInputChange}>
                      <option value="">Select Project</option>
                      {projects.map(proj => (
                        <option key={proj._id} value={proj._id}>{proj.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Assign To</label>
                    <select name="assignedTo" value={newTask.assignedTo} onChange={handleInputChange}>
                      <option value="">Select Team Member</option>
                      {teamMembers.map(member => (
                        <option key={member.memberId?._id} value={member.memberId?._id}>
                          {member.memberId?.firstName} {member.memberId?.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Deadline</label>
                    <input
                      type="date"
                      name="deadline"
                      value={newTask.deadline}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-buttons">
                    <button type="button" className="cancel-button" onClick={closeModal}>Cancel</button>
                    <button type="button" className="submit-button" onClick={createTask}>Create Task</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      case 'editTask':
        if (!editingTask) return null;
        return (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Edit Task</h2>
                <button className="close-button" onClick={closeModal}>X</button>
              </div>
              <div className="modal-body">
                <form className="modal-form">
                  <div className="form-group">
                    <label>Task Name</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter task name"
                      value={editingTask.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Project</label>
                    <select
                      name="project"
                      value={editingTask.project?._id || editingTask.project}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Project</option>
                      {projects.map(proj => (
                        <option key={proj._id} value={proj._id}>{proj.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Assign To</label>
                    <select
                      name="assignedTo"
                      value={editingTask.assignedTo?._id || editingTask.assignedTo}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Team Member</option>
                      {teamMembers.map(member => (
                        <option key={member.memberId?._id} value={member.memberId?._id}>
                          {member.memberId?.firstName} {member.memberId?.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Deadline</label>
                    <input
                      type="date"
                      name="deadline"
                      value={editingTask.deadline ? new Date(editingTask.deadline).toISOString().split('T')[0] : ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" value={editingTask.status} onChange={handleInputChange}>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="form-buttons">
                    <button type="button" className="cancel-button" onClick={closeModal}>Cancel</button>
                    <button type="button" className="submit-button" onClick={updateTask}>Update Task</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      case 'deleteTask':
        return (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Confirm Deletion</h2>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this task? This action cannot be undone.</p>
              </div>
              <div className="form-buttons">
                <button type="button" className="cancel-button" onClick={closeModal}>Cancel</button>
                <button type="button" className="submit-button" onClick={deleteTask}>Confirm</button>
              </div>
            </div>
          </div>
        );
      case 'deleteProject':
        return (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Confirm Deletion</h2>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this Project? This action cannot be undone and leads to remove all things related to this project.</p>
              </div>
              <div className="form-buttons">
                <button type="button" className="cancel-button" onClick={closeModal}>Cancel</button>
                <button type="button" className="submit-button" onClick={deleteProject}>Confirm</button>
              </div>
            </div>
          </div>
        );
      case 'member':
        return (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Add Team Member</h2>
                <button className="close-button" onClick={closeModal}>X</button>
              </div>
              <div className="modal-body">
                <form className="modal-form">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <input
                      type="text"
                      placeholder="Enter role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    />
                  </div>
                  <div className="form-buttons">
                    <button type="button" className="cancel-button" onClick={closeModal}>Cancel</button>
                    <button type="button" className="submit-button" onClick={addMember}>Add Member</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
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
            <NotificationComponent pendingTasks={pendingTasks} />
            <div className="admin-profile">
              <div className="admin-avatar">
                {userProfile && `${userProfile.firstName?.charAt(0) || ''}${userProfile.lastName?.charAt(0) || 'U'}`}
              </div>
              <div className="admin-info">
                <h4>{userProfile ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}` : 'Employee User'}</h4>
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