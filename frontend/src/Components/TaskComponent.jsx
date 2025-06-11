import React, { useState } from 'react';
import { CheckIcon } from '@heroicons/react/outline';

const TaskComponent = ({ tasks, markTaskComplete }) => {
  const [filter, setFilter] = useState("all");

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  return (
    <div className="tasks-section">
      <div className="section-header">
        <h2>My Assigned Tasks</h2>
        <div className="task-filter-btn">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`} 
            onClick={() => setFilter('all')}
          >
            All Tasks
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`} 
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`} 
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="tasks-container">
        {filteredTasks.length === 0 ? (
          <p className="no-tasks">No tasks found.</p>
        ) : (
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Project</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Mark Complete</th>
              </tr>
            </thead>
            <tbody>
              {/* Use filteredTasks instead of tasks */}
              {filteredTasks.map(task => (
                <tr key={task.id} className={task.status === 'completed' ? 'completed-row' : ''}>
                  <td>{task.title}</td>
                  <td>{task.project}</td>
                  <td>{formatDate(task.deadline)}</td>
                  <td>
                    <span className={`status-badge ${task.status}`}>
                      {task.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => markTaskComplete(task.id)}
                      className="task-checkbox"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TaskComponent;
