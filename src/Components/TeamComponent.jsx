// TeamComponent.jsx
import React from 'react';
import { UserGroupIcon } from '@heroicons/react/outline';

const TeamComponent = ({ teams, setActiveTab }) => {
  return (
    <div className="teams-section">
      <div className="section-header">
        <h2>My Teams</h2>
        <button className="view-all-btn" onClick={() => setActiveTab('teams')}>View All</button>
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