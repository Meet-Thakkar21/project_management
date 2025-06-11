import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { UserGroupIcon, UserIcon } from '@heroicons/react/outline';
import axios from 'axios';
import '../Styles/TeamsComponent.css';
import '../Styles/loading.css';

const TeamsComponent = () => {
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await axios.get('http://localhost:5000/api/teams/user-teams', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setTeams(response.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch teams');
                setLoading(false);
                console.error('Error fetching teams:', err);
            }
        };

        fetchTeams();
    }, [navigate]);

    const handleTeamClick = async (teamId) => {
        try {
            const token = localStorage.getItem('token');

            const response = await axios.get(`http://localhost:5000/api/teams/details/${teamId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setSelectedTeam(response.data);
        } catch (err) {
            console.error('Error fetching team details:', err);
            setError('Failed to fetch team details');
        }
    };

    const closeTeamDetails = () => {
        setSelectedTeam(null);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading Teams...</p>
            </div>
        );
    }
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="teams-container">
            <div className="teams-grid">
                {teams.map(team => (
                    <div
                        key={team._id}
                        className="team-card"
                        onClick={() => handleTeamClick(team._id)}
                    >
                        <div className="team-icon">
                            <UserGroupIcon className="h-8 w-8 text-blue-500" />
                        </div>
                        <div className="team-info">
                            <h3 className="team-name">{team.name}</h3>
                            <p className="team-members-count">{team.membersCount} members</p>
                            <p className="team-role">Your role: {team.userRole}</p>
                        </div>
                    </div>
                ))}
            </div>

            {selectedTeam && (
                <div className="team-details-modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{selectedTeam.name}</h2>
                            <button className="close-btn" onClick={closeTeamDetails}>X</button>
                        </div>

                        <div className="adminInfo">
                            <h3>Team Admin</h3>
                            <div className="admin-card">
                                <UserIcon className="h-6 w-6 text-red-500" />
                                <div>
                                    <p className="adminname">{selectedTeam.admin.firstName} {selectedTeam.admin.lastName}</p>
                                    <p className="adminemail">{selectedTeam.admin.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="members-list">
                            <h3>Team Members</h3>
                            {selectedTeam.members.map(member => (
                                <div key={member._id} className="member-card">
                                    <UserIcon className="h-6 w-6 text-gray-500" />
                                    <div>
                                        <p className="member-name">{member.firstName} {member.lastName}</p>
                                        <p className="member-email">{member.email}</p>
                                        <p className="member-role">Role: {member.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamsComponent;