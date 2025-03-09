// TaskComponent.jsx
import React from 'react';

const TaskComponent = ({ tasks, markTaskComplete }) => {
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <div className="tasks-section">
      <div className="section-header">
        <h2>My Assigned Tasks</h2>
        <button className="task-filter-btn">Filter</button>
      </div>
      
      <div className="tasks-container">
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
            {tasks.map(task => (
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
      </div>
    </div>
  );
};

export default TaskComponent;