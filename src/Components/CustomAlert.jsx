import React from 'react';
import '../Styles/CustomAlert.css';

const CustomAlert = ({ type, message, onClose }) => {
    return (
        <div className={`custom-alert ${type}`}>
            <span className="alert-message">{message}</span>
            <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
    );
};

export default CustomAlert;
