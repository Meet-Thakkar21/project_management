import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import '../Styles/ProjectChat.css';
import { BiArrowBack, BiSend, BiLoaderAlt, BiSmile, BiImage } from 'react-icons/bi'; // Added BiImage for image upload
import EmojiPicker from 'emoji-picker-react';

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
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const textareaRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const fileInputRef = useRef(null);
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
            // Your token validation code here
        } catch (error) {
            // Error handling
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
        // Your existing fetchProjectDetails code
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

    // Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check if file is an image
        if (!file.type.match('image.*')) {
            alert('Please select an image file');
            return;
        }

        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size should not exceed 5MB');
            return;
        }

        setSelectedImage(file);

        // Create image preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // Remove selected image
    const removeSelectedImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Upload image to server
    const uploadImage = async () => {
        if (!selectedImage) return null;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', selectedImage);
        formData.append('projectId', projectId);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:5000/api/chat/upload-image',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setIsUploading(false);
            return response.data.imageUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            setIsUploading(false);
            alert('Failed to upload image');
            return null;
        }
    };

    // Send message using WebSocket
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !selectedImage) return;

        let imageUrl = null;
        if (selectedImage) {
            imageUrl = await uploadImage();
        }

        // If there was an image but upload failed, and there's no text, stop
        if (!newMessage.trim() && selectedImage && !imageUrl) return;

        const userString = localStorage.getItem('user');
        try {
            const userObj = JSON.parse(userString);
            const senderId = userObj.id;

            const messageData = {
                projectId,
                senderId,
                text: newMessage.trim(),
                imageUrl: imageUrl
            };

            console.log("🚀 Sending Message:", messageData);

            // Emit message event to server
            socket.emit("sendMessage", messageData);

            setNewMessage(''); // Clear input
            setSelectedImage(null); // Clear selected image
            setImagePreview(null); // Clear image preview

            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
            
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
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

    // Auto-resize textarea
    const handleTextareaChange = (e) => {
        setNewMessage(e.target.value);
        const textarea = textareaRef.current;

        // Reset height to auto to properly calculate new height
        textarea.style.height = "auto";
        // Set the height to scrollHeight to fit content
        textarea.style.height = `${textarea.scrollHeight}px`;
    };

    // Handle key press for sending message with Enter
    const handleKeyPress = (e) => {
        // Send message on Enter, but allow Shift+Enter for new line
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    // Handle emoji selection
    const onEmojiClick = (emojiObject) => {
        setNewMessage(prevMessage => prevMessage + emojiObject.emoji);
        if (textareaRef.current) {
            // Focus back on textarea after selecting emoji
            textareaRef.current.focus();

            // Recalculate textarea height
            setTimeout(() => {
                textareaRef.current.style.height = "auto";
                textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            }, 0);
        }
    };

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target) &&
                event.target.className !== 'emoji-button' &&
                !event.target.closest('.emoji-button')) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Format message text to preserve line breaks
    const formatMessageText = (text) => {
        return text.split('\n').map((line, i) => (
            <React.Fragment key={i}>
                {line}
                {i !== text.split('\n').length - 1 && <br />}
            </React.Fragment>
        ));
    };

    // Trigger file input click
    const handleImageButtonClick = () => {
        fileInputRef.current?.click();
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
                                                        {message.text && (
                                                            <div className="message-text">
                                                                {formatMessageText(message.text)}
                                                            </div>
                                                        )}
                                                        
                                                        {message.imageUrl && (
                                                            <div className="message-image-container">
                                                                <img 
                                                                    src={message.imageUrl} 
                                                                    alt="Shared" 
                                                                    className="message-image"
                                                                    onClick={() => window.open(message.imageUrl, '_blank')}
                                                                />
                                                            </div>
                                                        )}
                                                        
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

                    {/* Image preview if an image is selected */}
                    {imagePreview && (
                        <div className="image-preview-container">
                            <div className="image-preview-wrapper">
                                <img src={imagePreview} alt="Preview" className="image-preview" />
                                <button 
                                    className="remove-image-btn"
                                    onClick={removeSelectedImage}
                                >
                                    &times;
                                </button>
                            </div>
                        </div>
                    )}

                    <form className="message-form" onSubmit={handleSendMessage}>
                        <div className="message-input-container">
                            <button
                                type="button"
                                className="emoji-button"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            >
                                <BiSmile />
                            </button>

                            <button
                                type="button"
                                className="image-button"
                                onClick={handleImageButtonClick}
                            >
                                <BiImage />
                            </button>

                            {/* Hidden file input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />

                            {showEmojiPicker && (
                                <div className="emoji-picker-container" ref={emojiPickerRef}>
                                    <EmojiPicker onEmojiClick={onEmojiClick} />
                                </div>
                            )}

                            <textarea
                                ref={textareaRef}
                                value={newMessage}
                                onChange={handleTextareaChange}
                                onKeyDown={handleKeyPress}
                                placeholder="Type a message..."
                                className="message-input"
                                rows="1"
                            />

                            <button
                                type="submit"
                                className="send-button"
                                disabled={(!newMessage.trim() && !selectedImage) || isUploading}
                            >
                                {isUploading ? <BiLoaderAlt className="spin" /> : <BiSend />}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ProjectChat;