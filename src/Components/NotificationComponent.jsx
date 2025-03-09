// NotificationComponent.jsx
import React from 'react';
import { BellIcon } from '@heroicons/react/outline';

const NotificationComponent = ({ pendingTasks }) => {
  return (
    <div className="notification">
      <BellIcon className="bell-icon" />
      <span className="notification-badge">{pendingTasks}</span>
    </div>
  );
};

export default NotificationComponent;