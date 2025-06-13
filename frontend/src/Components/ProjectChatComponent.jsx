import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import '../Styles/ProjectChat.css';
import { BiArrowBack, BiSend, BiLoaderAlt, BiSmile, BiImage, BiPencil, BiX, BiCheck, BiFile, BiVideo, BiMicrophone, BiTrash } from 'react-icons/bi'; // Added BiImage for image upload
import EmojiPicker from 'emoji-picker-react';
import moment from 'moment';

const BackendUrl = "https://taskify-e5u2.onrender.com"  
// Connect to the socket server
const socket = io(`${BackendUrl}`, {
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
    const [imageFileName, setImageFileName] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [pdfPreview, setPdfPreview] = useState(null);
    const [selectedAudio, setSelectedAudio] = useState(null);
    const [audioPreview, setAudioPreview] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editMessageText, setEditMessageText] = useState('');
    const [deletingMessageId, setDeletingMessageId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const textareaRef = useRef(null);
    const editTextareaRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const imageInputRef = useRef(null);
    const pdfInputRef = useRef(null);
    const audioInputRef = useRef(null);
    const videoInputRef = useRef(null);
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

        // Listen for message updates
        socket.on("messageUpdated", (updatedMessage) => {
            console.log("Message updated:", updatedMessage);
            setMessages((prevMessages) =>
                prevMessages.map(msg =>
                    msg._id === updatedMessage._id ? { ...msg, ...updatedMessage } : msg
                )
            );
        });

        // Listen for message deletions
        socket.on("messageDeleted", (deletedMessageId) => {
            console.log("Message deleted:", deletedMessageId);
            setMessages((prevMessages) =>
                prevMessages.filter(msg => msg._id !== deletedMessageId)
            );
        });

        return () => {
            // Clean up on component unmount
            if (currentUser) {
                socket.emit("leaveRoom", { projectId, userId: currentUser.id });
            }
            socket.off("receiveMessage");
            socket.off("messageUpdated");
            socket.off("messafeDeleted");
        };
    }, [projectId, navigate]);

    // Fetch project details and messages
    const fetchProjectDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const projectResponse = await axios.get(`${BackendUrl}/api/projects/details/${projectId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const { tasks, ...project } = projectResponse.data;
            setProject(project);

            const userString = localStorage.getItem('user');
            const userObj = JSON.parse(userString);
            const isAdmin = project.createdBy._id === userObj.id;
            const isMember = project.members.some(member => member._id === userObj.id);

            if (!isAdmin && !isMember) {
                navigate('/unauthorized'); // Redirect if not authorized
                return;
            }
            setIsLoadingMore(true);
            const messagesResponse = await axios.get(`${BackendUrl}/api/chat/project/${projectId}?page=${pagination.currentPage}`, {
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
        if (projectId) {
            markProjectMessagesAsRead(projectId);
        }
        
        fetchProjectDetails();
        // console.log("Messsages after loading..\n", messages);
    }, [projectId, pagination.currentPage, navigate]);

    // Check if a message is within the 15-minute edit window
    const isWithinEditWindow = (messageDate) => {
        const fifteenMinutesAgo = moment().subtract(15, 'minutes');
        return moment(messageDate).isAfter(fifteenMinutesAgo);
    };

    // 
    const markProjectMessagesAsRead = async (projectId) => {
        try {
            const token = localStorage.getItem("token");

            await axios.post(
                `${BackendUrl}/api/chat/${projectId}/mark-read`,
                {}, // Empty body
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            window.dispatchEvent(new CustomEvent('messagesRead'));
        } catch (error) {
            console.error("Error marking project messages as read:", error);
        }
    };

    // Start editing a message
    const startEditingMessage = (message) => {
        setEditingMessageId(message._id);
        setEditMessageText(message.text);
        setIsEditing(true);

        // Focus and resize the edit textarea after it's rendered
        setTimeout(() => {
            if (editTextareaRef.current) {
                editTextareaRef.current.focus();
                editTextareaRef.current.style.height = "auto";
                editTextareaRef.current.style.height = `${editTextareaRef.current.scrollHeight}px`;
            }
        }, 0);
    };

    // Cancel editing
    const cancelEditing = () => {
        setEditingMessageId(null);
        setEditMessageText('');
        setIsEditing(false);
    };

    // Show delete confirmation dialog
    const confirmDeleteMessage = (messageId) => {
        setDeletingMessageId(messageId);
        setShowDeleteConfirm(true);
    };

    // Cancel message deletion
    const cancelDeleteMessage = () => {
        setDeletingMessageId(null);
        setShowDeleteConfirm(false);
    };

    // Delete message
    const deleteMessage = async () => {
        if (!deletingMessageId) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${BackendUrl}/api/chat/delete/${deletingMessageId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Update local message state
            setMessages(prevMessages =>
                prevMessages.filter(msg => msg._id !== deletingMessageId)
            );

            socket.emit("deleteMessage", {
                messageId: deletingMessageId,
                projectId
            });

            setShowDeleteConfirm(false);
            setDeletingMessageId(null);
        } catch (error) {
            console.error('Error deleting message:', error);
            if (error.response && error.response.status === 403) {
                alert(error.response.data.message);
            } else {
                alert('Error deleting message');
            }
            setShowDeleteConfirm(false);
            setDeletingMessageId(null);
        }
    };

    // Save edited message
    const saveEditedMessage = async (messageId) => {
        if (!editMessageText.trim()) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${BackendUrl}/api/chat/edit/${messageId}`,
                { text: editMessageText },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Update local message state
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg._id === messageId
                        ? { ...msg, text: editMessageText, isEdited: true, updatedAt: Date.now() }
                        : msg
                )
            );

            // Emit message update event to notify other clients
            socket.emit("updateMessage", {
                messageId,
                projectId,
                text: editMessageText,
                isEdited: true
            });

            // Reset editing state
            cancelEditing();

        } catch (error) {
            console.error('Error editing message:', error);
            if (error.response && error.response.status === 403) {
                alert(error.response.data.message);
            } else {
                alert('Error editing message');
            }
        }
    };

    // Auto-resize edit textarea
    const handleEditTextareaChange = (e) => {
        setEditMessageText(e.target.value);
        const textarea = editTextareaRef.current;

        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
    };

    // Handle key press in edit textarea
    const handleEditKeyPress = (e, messageId) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveEditedMessage(messageId);
        } else if (e.key === 'Escape') {
            cancelEditing();
        }
    };

    // Handle image file selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (limit to 100MB)
        if (file.size > 100 * 1024 * 1024) {
            alert('File size should not exceed 100MB');
            return;
        }
        if (!file.type.match('image.*')) {
            alert('Please select an image file');
            return;
        }
        setSelectedImage(file);
        setImageFileName(file.name);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // Handle PDF file selection
    const handlePdfChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (limit to 100MB)
        if (file.size > 100 * 1024 * 1024) {
            alert('File size should not exceed 100MB');
            return;
        }
        if (file.type !== 'application/pdf') {
            alert('Please select a PDF file');
            return;
        }

        setSelectedPdf(file);
        setPdfPreview(file.name);
    };

    // Handle Audio file selection
    const handleAudioChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (limit to 100MB)
        if (file.size > 100 * 1024 * 1024) {
            alert('File size should not exceed 100MB');
            return;
        }
        if (!file.type.match('audio.*')) {
            alert('Please select a Audio file');
            return;
        }

        setSelectedAudio(file);
        setAudioPreview(file.name);
    };

    // Handle Video file selection
    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (limit to 100MB)
        if (file.size > 100 * 1024 * 1024) {
            alert('File size should not exceed 100MB');
            return;
        }
        if (!file.type.match('video.*')) {
            alert('Please select a Video file');
            return;
        }

        setSelectedVideo(file);
        setVideoPreview(file.name);
    };

    // Remove selected image
    const removeSelectedImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };

    // Remove selected PDF
    const removeSelectedPdf = () => {
        setSelectedPdf(null);
        setPdfPreview(null);
        if (pdfInputRef.current) {
            pdfInputRef.current.value = '';
        }
    };

    // Remove selected audio
    const removeSelectedAudio = () => {
        setSelectedAudio(null);
        setAudioPreview(null);
        if (audioInputRef.current) {
            audioInputRef.current.value = '';
        }
    };

    // Remove selected video
    const removeSelectedVideo = () => {
        setSelectedVideo(null);
        setVideoPreview(null);
        if (videoInputRef.current) {
            videoInputRef.current.value = '';
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
                `${BackendUrl}/api/chat/upload-image`,
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

    // Upload PDF to server
    const uploadPdf = async () => {
        if (!selectedPdf) return null;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedPdf);
        formData.append('projectId', projectId);
        formData.append('fileType', 'pdf');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${BackendUrl}/api/chat/upload-file`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setIsUploading(false);
            return response.data.fileUrl;
        } catch (error) {
            console.error('Error uploading PDF:', error);
            setIsUploading(false);
            alert('Failed to upload PDF');
            return null;
        }
    };

    // Add upload functions
    const uploadAudio = async () => {
        if (!selectedAudio) return null;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('audio', selectedAudio);
        formData.append('projectId', projectId);
        formData.append('fileType', 'audio');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${BackendUrl}/api/chat/upload-audio`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setIsUploading(false);
            return response.data.audioUrl;
        } catch (error) {
            console.error('Error uploading audio:', error);
            setIsUploading(false);
            alert('Failed to upload audio');
            return null;
        }
    };

    const uploadVideo = async () => {
        if (!selectedVideo) return null;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('video', selectedVideo);
        formData.append('projectId', projectId);
        formData.append('fileType', 'video');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${BackendUrl}/api/chat/upload-video`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setIsUploading(false);
            return response.data.videoUrl;
        } catch (error) {
            console.error('Error uploading video:', error);
            setIsUploading(false);
            alert('Failed to upload video');
            return null;
        }
    };

    // Send message using WebSocket
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !selectedImage && !selectedPdf && !selectedAudio && !selectedVideo) return;

        let imageUrl = null;
        let pdfUrl = null;
        let audioUrl = null;
        let videoUrl = null;

        // If all upload attempts failed and there's no text message, return
        if (!newMessage.trim() &&
            ((selectedImage && !imageUrl) &&
                (selectedPdf && !pdfUrl) &&
                (selectedAudio && !audioUrl) &&
                (selectedVideo && !videoUrl))) {
            console.log("Upload failed");
            return;
        }

        if (selectedImage) {
            imageUrl = await uploadImage();
        }

        if (selectedPdf) {
            pdfUrl = await uploadPdf();
        }

        if (selectedAudio) {
            audioUrl = await uploadAudio();
        }

        if (selectedVideo) {
            videoUrl = await uploadVideo();
        }

        // If there was an image but upload failed, and there's no text, stop
        if (!newMessage.trim() && ((selectedImage && !imageUrl) || (selectedPdf && !pdfUrl) || (selectedAudio && !audioUrl) || (selectedVideo && !videoUrl))) {
            console.log("Stucked");
            return;
        }

        const userString = localStorage.getItem('user');
        try {
            const userObj = JSON.parse(userString);
            const senderId = userObj.id;

            const messageData = {
                projectId,
                senderId,
                text: newMessage.trim(),
                imageUrl: imageUrl,
                pdfUrl: pdfUrl,
                audioUrl: audioUrl,
                videoUrl: videoUrl,
                imageOriginalName: imageFileName,
                pdfOriginalName: pdfPreview,
                audioOriginalName: audioPreview,
                videoOriginalName: videoPreview
            };

            console.log("Sending Message:", messageData);

            // Emit message event to server
            socket.emit("sendMessage", messageData);

            setNewMessage(''); // Clear input
            setImageFileName(null); // Clear Image File Name
            setSelectedImage(null); // Clear selected image
            setImagePreview(null); // Clear image preview
            setSelectedPdf(null); // Clear selected PDF
            setPdfPreview(null); // Clear PDF preview
            setSelectedVideo(null); // Clear selected video
            setVideoPreview(null); // Clear video preview
            setSelectedAudio(null); // Clear selected audio
            setAudioPreview(null); // Clear audio preview

            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }

            // Reset both file inputs (updated)
            if (imageInputRef.current) {
                imageInputRef.current.value = '';
            }
            if (pdfInputRef.current) {
                pdfInputRef.current.value = '';
            }
            if (audioInputRef.current) {
                audioInputRef.current.value = '';
            }
            if (videoInputRef.current) {
                videoInputRef.current.value = '';
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

        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
    };

    // Handle key press for sending message with Enter
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    // Handle emoji selection
    const onEmojiClick = (emojiObject) => {
        setNewMessage(prevMessage => prevMessage + emojiObject.emoji);
        if (textareaRef.current) {
            textareaRef.current.focus();
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
        imageInputRef.current?.click();
    };

    const handlePdfButtonClick = () => {
        pdfInputRef.current?.click();
    };

    const handleAudioButtonClick = () => {
        audioInputRef.current?.click();
    };

    const handleVideoButtonClick = () => {
        videoInputRef.current?.click();
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
                                <span className="member-name">
                                    {member.firstName} {member.lastName}
                                </span>
                                <span className="member-email">{member.email}</span>
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
                    <Link to={currentUser && project && project.createdBy._id === currentUser.id ? "/admin-dashboard" : "/employee-dashboard"} className="back-button">
                        <BiArrowBack />
                    </Link>
                    <div className="admin-details">
                        <span className="admin-name">
                            Admin : {project.createdBy.firstName} {project.createdBy.lastName}
                        </span>
                        <p className="member-email">{project.createdBy.email}</p>
                    </div>
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
                                <p>No messages yet </p>
                                <p> Start the conversation!</p>
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

                                        const canEdit = isCurrentUser && isWithinEditWindow(message.createdAt);
                                        const isEdited = message.isEdited;
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
                                                        {editingMessageId === message._id ? (
                                                            <div className="edit-message-container">
                                                                <textarea
                                                                    ref={editTextareaRef}
                                                                    value={editMessageText}
                                                                    onChange={handleEditTextareaChange}
                                                                    onKeyDown={(e) => handleEditKeyPress(e, message._id)}
                                                                    className="edit-message-input"
                                                                    rows="1"
                                                                />
                                                                <div className="edit-actions">
                                                                    <button
                                                                        className="save-edit-btn"
                                                                        onClick={() => saveEditedMessage(message._id)}
                                                                    >
                                                                        <BiCheck />
                                                                    </button>
                                                                    <button
                                                                        className="cancel-edit-btn"
                                                                        onClick={cancelEditing}
                                                                    >
                                                                        <BiX />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
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

                                                                {message.pdfUrl && (
                                                                    <div className="message-pdf-container">
                                                                        <a href={message.pdfUrl} target="_blank" rel="noopener noreferrer" className="pdf-link">
                                                                            <BiFile size={20} />
                                                                            <span>View PDF</span>
                                                                        </a>
                                                                    </div>
                                                                )}

                                                                {message.audioUrl && (
                                                                    <div className="message-audio-container">
                                                                        <audio
                                                                            controls
                                                                            className="message-audio"
                                                                        >
                                                                            <source src={message.audioUrl} type="audio/mpeg" />
                                                                            Your browser does not support the audio tag.
                                                                        </audio>
                                                                    </div>
                                                                )}

                                                                {message.videoUrl && (
                                                                    <div className="message-video-container">
                                                                        <video
                                                                            controls
                                                                            className="message-video"
                                                                            preload="metadata"
                                                                        >
                                                                            <source src={message.videoUrl} type="video/mp4" />
                                                                            Your browser does not support the video tag.
                                                                        </video>
                                                                    </div>
                                                                )}

                                                                <div className="message-footer">
                                                                    <div className="message-time">
                                                                        {new Date(message.updatedAt).toLocaleTimeString([], {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit',
                                                                        })}
                                                                        {isEdited && <span className="edited-indicator"> (edited)</span>}
                                                                    </div>

                                                                    {canEdit && (
                                                                        <button
                                                                            className="edit-message-btn"
                                                                            onClick={() => startEditingMessage(message)}
                                                                            title="Edit message"
                                                                        >
                                                                            <BiPencil />
                                                                        </button>
                                                                    )}
                                                                    {
                                                                        <button
                                                                            className="delete-message-btn"
                                                                            onClick={() => confirmDeleteMessage(message._id)}
                                                                            title="Delete message"
                                                                        >
                                                                            <BiTrash />
                                                                        </button>
                                                                    }
                                                                </div>
                                                            </>
                                                        )}
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

                    {/* PDF preview if a PDF is selected */}
                    {pdfPreview && (
                        <div className="pdf-preview-container">
                            <div className="pdf-preview-wrapper">
                                <div className="pdf-preview">
                                    <BiFile size={24} />
                                    <span>{pdfPreview}</span>
                                </div>
                                <button
                                    className="remove-pdf-btn"
                                    onClick={removeSelectedPdf}
                                >
                                    &times;
                                </button>
                            </div>
                        </div>
                    )}

                    {audioPreview && (
                        <div className="audio-preview-container">
                            <div className="audio-preview-wrapper">
                                <div className="audio-preview">
                                    <BiMicrophone size={24} />
                                    <span>{audioPreview}</span>
                                </div>
                                <button
                                    className="remove-audio-btn"
                                    onClick={removeSelectedAudio}
                                >
                                    &times;
                                </button>
                            </div>
                        </div>
                    )}

                    {videoPreview && (
                        <div className="video-preview-container">
                            <div className="video-preview-wrapper">
                                <div className="video-preview">
                                    <BiVideo size={24} />
                                    <span>{videoPreview}</span>
                                </div>
                                <button
                                    className="remove-video-btn"
                                    onClick={removeSelectedVideo}
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

                            <button
                                type="button"
                                className="pdf-button"
                                onClick={handlePdfButtonClick}
                            >
                                <BiFile />
                            </button>

                            <button
                                type="button"
                                className="audio-button"
                                onClick={handleAudioButtonClick}
                            >
                                <BiMicrophone />
                            </button>

                            <button
                                type="button"
                                className="video-button"
                                onClick={handleVideoButtonClick}
                            >
                                <BiVideo />
                            </button>

                            {/* Hidden file input */}
                            <input
                                type="file"
                                ref={imageInputRef}
                                onChange={handleImageChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />

                            <input
                                type="file"
                                ref={pdfInputRef}
                                onChange={handlePdfChange}
                                accept="application/pdf"
                                style={{ display: 'none' }}
                            />

                            <input
                                type="file"
                                ref={audioInputRef}
                                onChange={handleAudioChange}
                                accept="audio/*"
                                style={{ display: 'none' }}
                            />

                            <input
                                type="file"
                                ref={videoInputRef}
                                onChange={handleVideoChange}
                                accept="video/*"
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
                                disabled={(!newMessage.trim() && !selectedImage && !selectedPdf && !selectedAudio && !selectedVideo) || isUploading}
                            >
                                {isUploading ? <BiLoaderAlt className="spin" /> : <BiSend />}
                            </button>
                        </div>
                    </form>

                    {/* Delete Confirmation Dialog */}
                    {showDeleteConfirm && (
                        <div className="delete-confirmation-overlay">
                            <div className="delete-confirmation-dialog">
                                <p>Are you sure you want to delete this message?</p>
                                <div className="delete-confirmation-actions">
                                    <button
                                        className="delete-confirm-btn"
                                        onClick={deleteMessage}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        className="delete-cancel-btn"
                                        onClick={cancelDeleteMessage}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProjectChat;