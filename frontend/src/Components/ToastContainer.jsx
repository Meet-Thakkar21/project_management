// ToastContainer.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Toast from './Toast';

const ToastContainer = () => {
    const [toasts, setToasts] = useState([]);

    // Function to add a toast
    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now().toString();
        setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
        return id;
    }, []);

    // Function to remove a toast
    const removeToast = useCallback((id) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    // Expose the addToast method to window for global access
    useEffect(() => {
        window.showToast = addToast;
        return () => {
            delete window.showToast;
        };
    }, [addToast]);

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
};

export default ToastContainer;