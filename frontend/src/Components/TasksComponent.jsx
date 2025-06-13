import React, { useState, useEffect } from "react";
import axios from "axios";
import '../Styles/TasksComponent.css';
import '../Styles/loading.css';

const TasksComponent = () => {
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedProject, setSelectedProject] = useState("all");
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                if (!token) {
                    alert("No token found. Please log in again.");
                    return;
                }

                const tasksResponse = await axios.get("https://taskify-e5u2.onrender.com/api/employee/tasks", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const formattedTasks = tasksResponse.data.map(task => ({
                    id: task._id,
                    title: task.name,
                    project: task.project.name,
                    deadline: task.deadline,
                    status: task.status
                }));

                setTasks(formattedTasks);
                setFilteredTasks(formattedTasks);

                // Extract unique project names for filtering
                const projectNames = [...new Set(formattedTasks.map(task => task.project))];
                setProjects(projectNames);

                setLoading(false);
            } catch (error) {
                console.error("Error fetching tasks:", error);
                setLoading(false);
            }
        };

        fetchTasks();
    }, []);

    // Function to update task status in backend
    const updateTaskStatus = async (taskId, newStatus) => {
        try {
            const token = localStorage.getItem("token");
            await axios.patch(`https://taskify-e5u2.onrender.com/api/employee/tasks/${taskId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local state
            setTasks(prevTasks =>
                prevTasks.map(task =>
                    task.id === taskId ? { ...task, status: newStatus } : task
                )
            );

            applyFilters(selectedStatus, selectedProject); // Reapply filters after updating status
        } catch (error) {
            console.error("Error updating task status:", error);
        }
    };

    // Handle checkbox change
    const handleCheckboxChange = (taskId, type, isChecked) => {
        let newStatus = "pending"; // Default status

        if (type === "completed") {
            newStatus = isChecked ? "completed" : "pending";
        } else if (type === "in_progress") {
            newStatus = isChecked ? "in_progress" : "pending";
        }

        const task = tasks.find(task => task.id === taskId);
        if (type === "completed" && !isChecked && task.status === "in_progress") {
            newStatus = "in_progress";
        }

        updateTaskStatus(taskId, newStatus);
    };

    // Format date function
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
    };

    // Apply Filters based on status and project selection
    const applyFilters = (status, project) => {
        let filtered = tasks;

        if (status !== "all") {
            filtered = filtered.filter(task => task.status === status);
        }

        if (project !== "all") {
            filtered = filtered.filter(task => task.project === project);
        }

        setFilteredTasks(filtered);
        setSelectedStatus(status);
        setSelectedProject(project);
    };

    // Clear all filters
    const clearFilters = () => {
        setSelectedStatus("all");
        setSelectedProject("all");
        setFilteredTasks(tasks);
    };

    return (
        <div className="tasks-section">
            {/* Filter Buttons */}
            <div className="filters">
                <button className={`tasks-filter-btn ${selectedStatus === "all" ? "active" : ""}`} onClick={() => applyFilters("all", selectedProject)}>All Tasks</button>
                <button className={`tasks-filter-btn ${selectedStatus === "pending" ? "active" : ""}`} onClick={() => applyFilters("pending", selectedProject)}>Pending</button>
                <button className={`tasks-filter-btn ${selectedStatus === "in_progress" ? "active" : ""}`} onClick={() => applyFilters("in_progress", selectedProject)}>In Progress</button>
                <button className={`tasks-filter-btn ${selectedStatus === "completed" ? "active" : ""}`} onClick={() => applyFilters("completed", selectedProject)}>Completed</button>

                {/* Dropdown for Project Filter */}
                <select className="tasks-filter-btn" value={selectedProject} onChange={(e) => applyFilters(selectedStatus, e.target.value)}>
                    <option value="all">All Projects</option>
                    {projects.map((project, index) => (
                        <option key={index} value={project}>{project}</option>
                    ))}
                </select>

                {/* Clear Filters Button */}
                <button className="clear-filters" onClick={clearFilters}>Clear Filters</button>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            ) : filteredTasks.length === 0 ? (
                <p>No tasks found.</p>
            ) : (
                <table className="tasks-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Task Name</th>
                            <th>Project</th>
                            <th>Deadline</th>
                            <th>Status</th>
                            <th>In Progress</th>
                            <th>Complete</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTasks.map((task, index) => (
                            <tr key={task.id}>
                                <td>{index + 1}</td>
                                <td>{task.title}</td>
                                <td>{task.project}</td>
                                <td>{formatDate(task.deadline)}</td>
                                <td>
                                    <span className={`status-badge ${task.status}`}>
                                        {task.status.replace("_", " ")}
                                    </span>
                                </td>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={task.status === "in_progress"}
                                        onChange={(e) => handleCheckboxChange(task.id, "in_progress", e.target.checked)}
                                        disabled={task.status === "completed"}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={task.status === "completed"}
                                        onChange={(e) => handleCheckboxChange(task.id, "completed", e.target.checked)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default TasksComponent;
