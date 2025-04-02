import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PencilIcon, UserIcon } from '@heroicons/react/outline';
import CustomAlert from './CustomAlert';
import '../Styles/CustomAlert.css';
import '../Styles/ProfileComponent.css';

const defaultProfileImage = "https://ui-avatars.com/api/?name=U&background=random";


const ProfileComponent = () => {
    const navigate = useNavigate();
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updateError, setUpdateError] = useState(null);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        dob: '',
        gender: '',
        skills: []
    });

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert({ type: '', message: '' }), 3000);
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");

                if (!token) {
                    setError("No token found. Please log in again.");
                    setLoading(false);
                    return;
                }

                const response = await axios.get("http://localhost:5000/api/employee/profile", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setUserProfile(response.data);
                setFormData({
                    firstName: response.data.firstName || '',
                    lastName: response.data.lastName || '',
                    email: response.data.email || '',
                    dob: response.data.dob ? new Date(response.data.dob).toISOString().split('T')[0] : '',
                    gender: response.data.gender || '',
                    skills: response.data.skills || []
                });
                setLoading(false);
            } catch (err) {
                console.error('Error fetching profile:', err);
                showAlert('error', 'Failed to load profile data. Please try again later.');
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    // Auto-hide success and error messages after 3 seconds
    useEffect(() => {
        let timer;
        if (updateSuccess || updateError) {
            timer = setTimeout(() => {
                setUpdateSuccess(false);
                setUpdateError(null);
            }, 3000);
        }
        return () => clearTimeout(timer);
    }, [updateSuccess, updateError]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'skills') {
            const skillsArray = value.split(',')
                .map(skill => skill.trim())
                .filter(skill => skill !== '');

            setFormData({
                ...formData,
                skills: skillsArray
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdateError(null);
        setUpdateSuccess(false);

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                setTimeout(() => {
                    setAlert({ type: 'error', message: 'No token found. Redirecting you to Login!' });
                    navigate("/dashboard"); // Navigate after 2 seconds
                }, 2000);
                return;
            }

            const dataToSend = { ...formData };

            console.log("Sending profile update with data:", dataToSend);

            const response = await axios.put(
                "http://localhost:5000/api/employee/profile",
                dataToSend,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                }
            );

            console.log("Profile update response:", response.data);

            setUserProfile(prevProfile => ({
                ...prevProfile,
                ...formData
            }));

            setUpdateSuccess(true);
            setEditing(false);
        } catch (err) {
            console.error('Error updating profile:', err);
            const errorMsg = err.response?.data?.msg || 'Failed to update profile. Please try again.';
            setUpdateError(errorMsg);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading profile data...</p>
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
        <div className="profile-container">
            {alert.message && (
                <CustomAlert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ type: '', message: '' })}
                />
            )}
            <div className="profile-header">
                <button
                    className="edit-button"
                    onClick={() => setEditing(!editing)}
                >
                    <PencilIcon className="edit-icon" />
                    {editing ? 'Cancel' : 'Edit Profile'}
                </button>
            </div>

            {updateError && (
                <div className="error-message">
                    <p>{updateError}</p>
                </div>
            )}

            {updateSuccess && (
                <div className="success-message">
                    <p>Profile updated successfully!</p>
                </div>
            )}

            <div className="profile-content">
                <div className="profile-image-section">
                    <div className="profile-image-container">
                        {userProfile.profileImage ? (
                            <img
                                src={userProfile.profileImage}
                                alt="Profile"
                                className="profile-image"
                                onError={(e) => e.target.src = defaultProfileImage} // Fallback if image fails to load
                            />
                        ) : (
                            <UserIcon className="profile-icon" />
                        )}
                    </div>
                    <div className="profile-name">
                        <h3>{userProfile.firstName} {userProfile.lastName}</h3>
                        <p>{userProfile.role ? userProfile.role.replace('_', ' ').charAt(0).toUpperCase() + userProfile.role.replace('_', ' ').slice(1) : 'Employee'}</p>
                    </div>
                </div>

                {editing ? (
                    <form className="profile-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                disabled
                            />
                        </div>

                        <div className="form-group">
                            <label>Date of Birth</label>
                            <input
                                type="date"
                                name="dob"
                                value={formData.dob}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleInputChange}
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Skills (comma-separated)</label>
                            <input
                                type="text"
                                name="skills"
                                value={formData.skills.join(', ')}
                                onChange={handleInputChange}
                                placeholder="e.g. JavaScript, React, Node.js"
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="save-button">Save Changes</button>
                            <button type="button" className="cancel-button" onClick={() => setEditing(false)}>Cancel</button>
                        </div>
                    </form>
                ) : (
                    <div className="profile-details">
                        <div className="detail-group">
                            <label>Email</label>
                            <p>{userProfile.email}</p>
                        </div>

                        <div className="detail-group">
                            <label>Date of Birth</label>
                            <p>{userProfile.dob ? new Date(userProfile.dob).toLocaleDateString() : 'Not specified'}</p>
                        </div>

                        <div className="detail-group">
                            <label>Gender</label>
                            <p>{userProfile.gender ? userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1) : 'Not specified'}</p>
                        </div>

                        <div className="detail-group">
                            <label>Skills</label>
                            <div className="skills-container">
                                {userProfile.skills && userProfile.skills.length > 0 ?
                                    userProfile.skills.map((skill, index) => (
                                        <span key={index} className="skill-badge">{skill}</span>
                                    )) :
                                    <p>No skills specified</p>
                                }
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileComponent;
