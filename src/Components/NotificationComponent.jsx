// NotificationComponent.jsx
import React from 'react';
import { BellIcon } from '@heroicons/react/outline';

const NotificationComponent = ({ pendingTasks = 0, unreadMessages = 0 }) => {
  const totalNotifications = pendingTasks + unreadMessages;

  return (
    <div className="notification">
      <BellIcon className="bell-icon" />
      <span className="notification-badge">{totalNotifications}</span>
    </div>
  );
};

export default NotificationComponent;