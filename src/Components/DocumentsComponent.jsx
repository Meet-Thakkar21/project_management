import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DocumentIcon, PhotographIcon, FilmIcon, MusicNoteIcon } from '@heroicons/react/outline';
import '../Styles/DocumentsComponent.css';

const DocumentsComponent = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");

                if (!token) {
                    alert("No token found. Please log in again.");
                    return;
                }

                const response = await axios.get("http://localhost:5000/api/employee/documents", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setDocuments(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching documents:', err);
                setError('Failed to load documents. Please check your connection and try again.');
                setLoading(false);
            }
        };

        fetchDocuments();
    }, []);

    const getFileIcon = (fileType) => {
        switch (fileType) {
            case 'image':
                return <PhotographIcon className="document-icon" />;
            case 'pdf':
                return <DocumentIcon className="document-icon" />;
            case 'video':
                return <FilmIcon className="document-icon" />;
            case 'audio':
                return <MusicNoteIcon className="document-icon" />;
            default:
                return <DocumentIcon className="document-icon" />;
        }
    };

    // const getFileTypeFromUrl = (url) => {
    //     if (!url) return 'unknown';
    //     if (url.includes('imageUrl')) return 'image';
    //     if (url.includes('pdfUrl')) return 'pdf';
    //     if (url.includes('videoUrl')) return 'video';
    //     if (url.includes('audioUrl')) return 'audio';
    //     return 'unknown';
    // };

    const filteredDocuments = filter === 'all'
        ? documents
        : documents.filter(doc => {
            const fileType = doc.fileType;
            return fileType === filter;
        });

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading documents...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Try Again</button>
            </div>
        );
    }

    return (
        <div className="documents-container">
            <div className="filter-section">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                <button
                    className={`filter-btn ${filter === 'image' ? 'active' : ''}`}
                    onClick={() => setFilter('image')}
                >
                    Images
                </button>
                <button
                    className={`filter-btn ${filter === 'pdf' ? 'active' : ''}`}
                    onClick={() => setFilter('pdf')}
                >
                    PDFs
                </button>
                <button
                    className={`filter-btn ${filter === 'video' ? 'active' : ''}`}
                    onClick={() => setFilter('video')}
                >
                    Videos
                </button>
                <button
                    className={`filter-btn ${filter === 'audio' ? 'active' : ''}`}
                    onClick={() => setFilter('audio')}
                >
                    Audio
                </button>
            </div>

            {filteredDocuments.length === 0 ? (
                <div className="no-documents">
                    <p>No documents found</p>
                </div>
            ) : (
                <div className="documents-grid">
                    {filteredDocuments.map((doc) => {
                        const fileType = doc.fileType;
                        return (
                            <div key={doc._id} className="document-card">
                                <div className="document-preview">
                                    {
                                        <div className="file-icon-container">
                                            {getFileIcon(fileType)}
                                        </div>
                                    }
                                </div>
                                <div className="document-info">
                                    <h3 className="document-name">{doc.fileName || 'Unnamed Document'}</h3>
                                    <p className="document-project">Project: {doc.project.name}</p>
                                    <p className="document-date">
                                        {new Date(doc.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric', month: 'short', day: 'numeric'
                                        })}
                                    </p>
                                    <p className="document-sender">Shared by: {doc.sender.firstName} {doc.sender.lastName}</p>
                                    <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="view-document-btn"
                                    >
                                        View Document
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DocumentsComponent;