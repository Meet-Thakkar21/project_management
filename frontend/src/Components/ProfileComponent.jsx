import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { PencilIcon, UserIcon, PhotographIcon } from '@heroicons/react/outline';
import '../Styles/ProfileComponent.css';
import ToastContainer from './ToastContainer';

const defaultProfileImage = "https://ui-avatars.com/api/?name=U&background=random";

const ProfileComponent = () => {
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
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const loadToastShown = useRef(false);

    const showToast = (message, type) => {
        if (window.showToast) {
            window.showToast(message, type);
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");

                if (!token) {
                    setLoading(false);
                    showToast("No token found. Please log in again.", "error");
                    return;
                }

                const response = await axios.get("https://taskify-e5u2.onrender.com/api/employee/profile", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setUserProfile(response.data);
                setFormData({
                    firstName: response.data.firstName,
                    lastName: response.data.lastName,
                    email: response.data.email,
                    dob: response.data.dob ? new Date(response.data.dob).toISOString().split('T')[0] : '',
                    gender: response.data.gender,
                    skills: response.data.skills || []
                });
                setImagePreview(response.data.profileImage);
                setLoading(false);
                if (!loadToastShown.current) {
                    showToast("Profile Data loaded.", "success");
                    loadToastShown.current = true;
                }

            } catch (err) {
                console.error('Error fetching profile:', err);
                showToast("Failed to load Profile data.", "error");
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    useEffect(() => {
        if (updateSuccess) {
            showToast('Profile updated successfully!', "success");
            setUpdateSuccess(false);
        }
        if (updateError) {
            showToast(updateError, "error");
            setUpdateError(null);
        }
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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file type
            if (!file.type.match('image.*')) {
                showToast('Please select an image file', 'error');
                return;
            }

            // Check file size - limit to 5MB
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image size should be less than 5MB', 'error');
                return;
            }

            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdateError(null);
        setUpdateSuccess(false);

        try {
            const token = localStorage.getItem("token");
            if (!formData.dob || !formData.email || !formData.firstName || !formData.lastName || !formData.gender) {
                setUpdateError("Some fields are empty. Please Fill it.");
                return;
            }
            if (!token) {
                setUpdateError("No token found. Please log in again.");
                return;
            }

            // Create form data to handle file upload
            const formDataToSend = new FormData();
            formDataToSend.append('firstName', formData.firstName);
            formDataToSend.append('lastName', formData.lastName);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('dob', formData.dob);
            formDataToSend.append('gender', formData.gender);

            // Append each skill as a separate entry
            if (formData.skills && formData.skills.length) {
                formData.skills.forEach(skill => {
                    formDataToSend.append('skills', skill);
                });
            }

            // Append image file if exists
            if (imageFile) {
                formDataToSend.append('profileImage', imageFile);
            }

            console.log("Sending profile update with data:", formDataToSend);

            const response = await axios.put(
                "https://taskify-e5u2.onrender.com/api/employee/profile",
                formDataToSend,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    },
                }
            );

            console.log("Profile update response:", response.data);

            setUserProfile(prevProfile => ({
                ...prevProfile,
                ...formData,
                profileImage: response.data.profileImage || prevProfile.profileImage
            }));

            setUpdateSuccess(true);
            setEditing(false);
            setImageFile(null);
        } catch (err) {
            console.error('Error updating profile:', err);
            const errorMsg = err.response?.data?.msg || 'Failed to update profile. Please try again.';
            setUpdateError(errorMsg);
        }
    };

    const handleCancel = () => {
        setEditing(false);
        setImageFile(null);
        setImagePreview(userProfile.profileImage);
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
            <ToastContainer />
            <div className="profile-header">
                <button
                    className="edit-button"
                    onClick={() => setEditing(!editing)}
                >
                    <PencilIcon className="edit-icon" />
                    {editing ? 'Cancel' : 'Edit Profile'}
                </button>
            </div>

            <div className="profile-content">
                <div className="profile-image-section">
                    <div className="profile-image-container">
                        {editing ? (
                            <div className="profile-image-edit">
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Profile Preview"
                                        className="profile-image"
                                        onError={(e) => e.target.src = defaultProfileImage}
                                    />
                                ) : (
                                    <UserIcon className="profile-icon" />
                                )}
                                <div className="profile-image-overlay" onClick={triggerFileInput}>
                                    <PhotographIcon className="camera-icon" />
                                    <span>Change Photo</span>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="file-input"
                                />
                            </div>
                        ) : (
                            <>
                                {userProfile.profileImage || imagePreview ? (
                                    <img
                                        src={userProfile.profileImage || imagePreview}
                                        alt="Profile"
                                        className="profile-image"
                                        onError={(e) => e.target.src = defaultProfileImage}
                                    />
                                ) : (
                                    <UserIcon className="profile-icon" />
                                )}
                            </>
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
                            <button type="button" className="cancel-button" onClick={handleCancel}>Cancel</button>
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