import React, { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/outline';
import axios from 'axios';
import '../Styles/NotificationComponent.css';

const NotificationComponent = ({ pendingTasks, unreadMessages }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadMessageDetails, setUnreadMessageDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadMessages);

  // Update local count when prop changes
  useEffect(() => {
    setLocalUnreadCount(unreadMessages);
  }, [unreadMessages]);

  // Total notification count (pending tasks + local unread messages)
  const totalNotifications = pendingTasks + localUnreadCount;

  const toggleNotifications = async () => {
    const wasShowing = showNotifications;
    setShowNotifications(!showNotifications);

    // If opening the dropdown and there are unread messages, fetch them
    if (!wasShowing && localUnreadCount > 0) {
      await fetchUnreadMessages();
    }
  };

  // Fetch unread messages when dropdown is opened
  const fetchUnreadMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // This endpoint needs to be implemented to return message details
      const response = await axios.get("https://taskify-e5u2.onrender.com/api/chat/unread-messages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUnreadMessageDetails(response.data.messages || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching unread messages:", error);
      setLoading(false);
    }
  };

  // Mark messages as read using your existing endpoint
  const markMessagesAsRead = async () => {
    try {
      if (unreadMessageDetails.length === 0) return;

      const token = localStorage.getItem("token");
      const messageIds = unreadMessageDetails.map(msg => msg._id);

      // This matches your existing route
      await axios.post(
        "https://taskify-e5u2.onrender.com/api/chat/mark-read",
        { messageIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      setLocalUnreadCount(0);
      setUnreadMessageDetails([]);

      // Optionally refresh the dashboard to update counters elsewhere
      // window.dispatchEvent(new CustomEvent('notificationsRead'));

    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  return (
    <div className="notification-container">
      <div className="bell-icon-container" onClick={toggleNotifications}>
        <BellIcon className="bell-icon" />
        {totalNotifications > 0 && (
          <span className="notification-badge">{totalNotifications}</span>
        )}
      </div>

      {showNotifications && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notifications</h3>
            {localUnreadCount > 0 && (
              <button
                className="mark-read-btn"
                onClick={markMessagesAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="notifications-content">
            {pendingTasks > 0 && (
              <div className="notification-item task-notification">
                <div className="notification-icon task-icon">
                  <span>📋</span>
                </div>
                <div className="notification-text">
                  <p>You have {pendingTasks} pending task{pendingTasks !== 1 ? 's' : ''}</p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="loading-notifications">Loading messages...</div>
            ) : (
              <>
                {unreadMessageDetails.length > 0 ? (
                  unreadMessageDetails.map(message => (
                    <div key={message._id} className="notification-item message-notification">
                      <div className="notification-icon message-icon">
                        <span>💬</span>
                      </div>
                      <div className="notification-text">
                        <p className="message-sender">{message.sender?.firstName || 'User'} {message.sender?.lastName || ''}</p>
                        <p className="message-content">{message.text}</p>
                        <p className="message-project">Project: {message.project?.name || 'Unknown'}</p>
                        <p className="message-time">{new Date(message.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                ) : localUnreadCount > 0 ? (
                  <div className="notification-item message-notification">
                    <div className="notification-icon message-icon">
                      <span>💬</span>
                    </div>
                    <div className="notification-text">
                      <p>You have {localUnreadCount} unread message{localUnreadCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ) : null}
              </>
            )}

            {totalNotifications === 0 && (
              <div className="no-notifications">
                <p>No new notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationComponent;