import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import '../Styles/ProjectChat.css';
import { BiArrowBack, BiSend, BiLoaderAlt } from 'react-icons/bi'; // Import icons

// Connect to the socket server
const socket = io("http://localhost:5000", {
    transports: ["websocket"],
    reconnectionAttempts: 5,
    timeout: 10000,
});

socket.on("connect", () => {
    console.log("Connected to WebSocket Server");
});

socket.on("connect_error", (err) => {
    console.error("Connection Error:", err);
});

function ProjectChat() {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1
    });
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userString = localStorage.getItem('user');
        
        if (!token) {
            navigate('/login');
            return;
        }

        try {

        } catch (error) {
            
        }

        // Parse user info
        try {
            const userObj = JSON.parse(userString);
            setCurrentUser(userObj);
            
            // Join the project room
            socket.emit("joinRoom", { projectId, userId: userObj.id });
        } catch (err) {
            console.error("Error parsing user data:", err);
            navigate('/login');
            return;
        }

        // Listening for incoming messages
        socket.on("receiveMessage", (message) => {
            console.log("Received message:", message);
            setMessages((prevMessages) => [...prevMessages, message]);
            scrollToBottom();
        });

        return () => {
            // Clean up on component unmount
            if (currentUser) {
                socket.emit("leaveRoom", { projectId, userId: currentUser.id });
            }
            socket.off("receiveMessage");
        };
    }, [projectId, navigate]);

    // Fetch project details and messages
    const fetchProjectDetails = async () => {
        try {
            // Get token from local storage
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            // Fetch project details
            const projectResponse = await axios.get(`http://localhost:5000/api/projects/details/${projectId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const { tasks, ...project } = projectResponse.data;
            setProject(project);

            setIsLoadingMore(true);
            // Fetch project-specific messages
            const messagesResponse = await axios.get(`http://localhost:5000/api/chat/project/${projectId}?page=${pagination.currentPage}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            // Sort messages by date
            const sortedMessages = messagesResponse.data.messages.sort((a, b) => 
                new Date(a.createdAt) - new Date(b.createdAt)
            );
            
            setMessages(prevMessages =>
                pagination.currentPage === 1
                    ? sortedMessages
                    : [...prevMessages, ...sortedMessages]
            );
            
            setPagination({
                currentPage: messagesResponse.data.currentPage,
                totalPages: messagesResponse.data.totalPages
            });
            setLoading(false);
            setIsLoadingMore(false);
        } catch (err) {
            console.error('Error fetching project details:', err);
            setError('Failed to fetch project details');
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchProjectDetails();
    }, [projectId, pagination.currentPage, navigate]);

    // Send message using WebSocket
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const userString = localStorage.getItem('user');
        try {
            const userObj = JSON.parse(userString);
            const senderId = userObj.id;
            
            console.log("🚀 Sending Message:", {
                projectId,
                senderId,
                text: newMessage,
            });
            
            // Emit message event to server
            socket.emit("sendMessage", {
                projectId,
                senderId,
                text: newMessage
            });

            setNewMessage(''); // Clear input
        } catch (err) {
            console.error("Error parsing user data:", err);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMoreMessages = () => {
        if (pagination.currentPage < pagination.totalPages && !isLoadingMore) {
            setPagination(prev => ({
                ...prev,
                currentPage: prev.currentPage + 1
            }));
        }
    };

    const formatMessageDate = (date) => {
        const messageDate = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (messageDate.toDateString() === today.toDateString()) {
            return "Today";
        } else if (messageDate.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        } else {
            return messageDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    // Group messages by date
    const groupMessagesByDate = () => {
        const groups = {};
        
        messages.forEach(message => {
            const date = formatMessageDate(message.createdAt);
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
        });
        
        return groups;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading Chat...</p>
            </div>
        );
    }

    if (error) {
        return <div className="error-container">{error}</div>;
    }

    if (!project) {
        return <div className="not-found-container">Project not found</div>;
    }

    const messageGroups = groupMessagesByDate();

    return (
        <div className="project-chat-container">
        {/* Sidebar Section */}
        <div className="project-sidebar">
            <h1 className="project-title">{project.name}</h1>
            <h2 className="sidebar-heading">Project Members</h2>
            <ul className="member-list">
                {project.members && project.members.length > 0 ? (
                    project.members.map((member) => (
                        <li key={member._id} className="member-item">
                            <div className="member-details">
                                <span className="member-name">
                                    {member.firstName} {member.lastName}
                                </span>
                                <span className="member-email">{member.email}</span>
                            </div>
                        </li>
                    ))
                ) : (
                    <li>No members found</li>
                )}
            </ul>
        </div>

        {/* Chat Section */}
        <div className="chat-section">
            <header className="chat-header">
                <Link to="/employee-dashboard" className="back-button">
                    <BiArrowBack />
                </Link>
                <div className="project-members">
                    {project.members && project.members.length > 0 && (
                        <div className="member-avatars">
                            <span className="member-count">{project.members.length} members</span>
                        </div>
                    )}
                </div>
            </header>

            <div className="chat-body">
                <div
                    className="messages-container"
                    ref={messagesContainerRef}
                    onScroll={(e) => {
                        if (e.target.scrollTop === 0 && !isLoadingMore) {
                            loadMoreMessages();
                        }
                    }}
                >
                    {isLoadingMore && pagination.currentPage > 1 && (
                        <div className="loading-more">
                            <BiLoaderAlt className="loading-icon spin" />
                            <span>Loading more messages...</span>
                        </div>
                    )}

                    {pagination.currentPage < pagination.totalPages && !isLoadingMore && (
                        <button
                            className="load-more-button"
                            onClick={loadMoreMessages}
                        >
                            Load Previous Messages
                        </button>
                    )}

                    {messages.length === 0 ? (
                        <div className="empty-chat">
                            <div className="empty-chat-icon">💬</div>
                            <p>No messages yet</p>
                            <p className="empty-chat-subtitle">Start the conversation!</p>
                        </div>
                    ) : (
                        Object.entries(messageGroups).map(([date, dateMessages]) => (
                            <div key={date} className="message-group">
                                <div className="date-divider">
                                    <span>{date}</span>
                                </div>

                                {dateMessages.map(message => {
                                    const isCurrentUser =
                                        currentUser &&
                                        message.sender &&
                                        message.sender._id === currentUser.id;

                                    return (
                                        <div
                                            key={message._id}
                                            className={`message ${isCurrentUser ? 'own-message' : 'other-message'}`}
                                        >
                                            {!isCurrentUser && (
                                                <div className="avatar">
                                                    {message.sender && message.sender.firstName
                                                        ? message.sender.firstName.charAt(0) +
                                                          (message.sender.lastName
                                                              ? message.sender.lastName.charAt(0)
                                                              : '')
                                                        : '?'}
                                                </div>
                                            )}

                                            <div className="message-content">
                                                {!isCurrentUser && (
                                                    <div className="sender-name">
                                                        {message.sender && message.sender.firstName
                                                            ? `${message.sender.firstName} ${message.sender.lastName || ''}`
                                                            : 'Unknown User'}
                                                    </div>
                                                )}

                                                <div className="message-bubble">
                                                    <div className="message-text">{message.text}</div>
                                                    <div className="message-time">
                                                        {new Date(message.createdAt).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="message-form" onSubmit={handleSendMessage}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="message-input"
                    />
                    <button type="submit" className="send-button" disabled={!newMessage.trim()}>
                        <BiSend />
                    </button>
                </form>
            </div>
        </div>
    </div>
    );
}

export default ProjectChat;