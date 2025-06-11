import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { ClipboardListIcon, UsersIcon } from '@heroicons/react/outline';
import axios from 'axios';
import '../Styles/ProjectsComponent.css';
import '../Styles/Toast.css';

const ProjectsComponent = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await axios.get('http://localhost:5000/api/projects/user-projects', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setProjects(response.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch projects');
                setLoading(false);
                console.error('Error fetching projects:', err);
                // Show error toast
                if (window.showToast) {
                    window.showToast('Failed to fetch projects', 'error');
                }
            }
        };

        fetchProjects();
    }, [navigate]);

    const handleProjectClick = async (projectId) => {
        try {
            const token = localStorage.getItem('token');

            const response = await axios.get(`http://localhost:5000/api/projects/details/${projectId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setSelectedProject(response.data);
        } catch (err) {
            console.error('Error fetching project details:', err);
            setError('Failed to fetch project details');
            // Show error toast
            if (window.showToast) {
                window.showToast('Failed to fetch project details', 'error');
            }
        }
    };

    const handleStartChat = (projectId) => {
        // Show success toast
        if (window.showToast) {
            window.showToast(`Redirecting to chat interface...`, 'success', 2000);
        }

        // Navigate to project-specific chat after a delay
        setTimeout(() => {
            navigate(`/projects/${projectId}/chat`);
        }, 2000);
    };

    const closeProjectDetails = () => {
        setSelectedProject(null);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading Projects...</p>
            </div>
        );
    }
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="projects-container">
            <div className="projects-grid">
                {projects.map(project => (
                    <div
                        key={project._id}
                        className="project-card"
                        onClick={() => handleProjectClick(project._id)}
                    >
                        <div className="project-icon">
                            <ClipboardListIcon className="h-8 w-8 text-green-500" />
                        </div>
                        <div className="project-info">
                            <h3 className="project-name">{project.name}</h3>
                            <p className="project-description">{project.description}</p>
                            <p className="project-tasks">
                                Tasks: {project.completedTasks} / {project.totalTasks}
                            </p>
                            <button
                                className="start-chat-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartChat(project._id);
                                }}
                            >
                                Start Chat
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedProject && (
                <div className="project-details-modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{selectedProject.name}</h2>
                            <button className="close-btn" onClick={closeProjectDetails}>X</button>
                        </div>

                        <div className="project-description">
                            <p>{selectedProject.description}</p>
                        </div>

                        <div className="adminInfo">
                            <h3>Project Created By</h3>
                            <div className="admin-card">
                                <UsersIcon className="h-6 w-6 text-red-500" />
                                <div>
                                    <p style={{ fontWeight: "600" }}>
                                        {selectedProject.createdBy.firstName} {selectedProject.createdBy.lastName}
                                    </p>
                                    <p className="adminEmail"> {selectedProject.createdBy.email} </p>
                                </div>
                            </div>
                        </div>

                        <div className="project-tasks-list">
                            <h3 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "12px" }}>My Tasks</h3>
                            {selectedProject.tasks && selectedProject.tasks.map(task => (
                                <div key={task._id} className="task-card">
                                    <div>
                                        <p className="task-name">{task.name}</p>
                                        <p className="task-status">Status: {task.status}</p>
                                        <p className="task-assignee">
                                            Assigned to: {task.assignedTo.firstName} {task.assignedTo.lastName}
                                        </p>
                                        <p className="task-deadline">
                                            Deadline: {new Date(task.deadline).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectsComponent;