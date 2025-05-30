import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Authentication/Login';
import Signup from './Authentication/Signup';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Home from './Components/Home';
import AdminDashboard from './Components/AdminDashboard';
import EmployeeDashboard from './Components/EmployeeDashboard';
import ProjectChat from './Components/ProjectChatComponent';
import ToastContainer from './Components/ToastContainer';
import VideoCall from './Components/VideoCall';
import GitHubCallback from './Authentication/GitHubCallback';
const clientId = "480382669507-gat4q906qi4rlv61hnl9tpehfem6j3qm.apps.googleusercontent.com";
function App() {
  return (
    
    <GoogleOAuthProvider clientId={clientId}>
      <Router>
        <ToastContainer />
        <Routes>
          <Route path = "/" element = {<Home />}/>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
          <Route path="/projects/:projectId/chat" element={<ProjectChat />} />
          <Route path="/unauthorized" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
          <Route path = "/videocall" element = {<VideoCall />} />
          <Route path="/auth/github/callback" element={<GitHubCallback />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
    
  );
}

export default App;
