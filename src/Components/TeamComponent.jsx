// TeamComponent.jsx
import React from 'react';
import { useNavigate } from "react-router-dom";
import { UserGroupIcon } from '@heroicons/react/outline';

const TeamComponent = ({ teams }) => {
  const navigate = useNavigate();
  return (
    <div className="teams-section">
      <div className="section-header">
        <h2>My Teams</h2>
        <button className="view-all-btn" onClick={() => navigate('/signup')}>View All</button>
      </div>
      
      <div className="teams-list">
        {teams.map(team => (
          <div key={team.id} className="team-card">
            <div className="team-icon">
              <UserGroupIcon />
            </div>
            <div className="team-info">
              <h3>{team.name}</h3>
              <p>{team.members} members</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamComponent;