// Toast.jsx
import React, { useState, useEffect } from 'react';

const Toast = ({ message, type, duration = 3000, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onClose, 300); // Wait for exit animation to complete
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`toast toast-${type} ${isExiting ? 'toast-exit' : ''}`}>
            <div className="toast-message">{message}</div>
            <button className="toast-close" onClick={() => {
                setIsExiting(true);
                setTimeout(onClose, 300);
            }}>×</button>
        </div>
    );
};

export default Toast;