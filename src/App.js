import React from 'react';
import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Authentication/Login';
import Signup from './Authentication/Signup';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Home from './Components/Home';
import AdminDashboard from './Components/AdminDashboard';
import EmployeeDashboard from './Components/EmployeeDashboard';
import ChatApp from './Components/Chat';

const clientId = "480382669507-gat4q906qi4rlv61hnl9tpehfem6j3qm.apps.googleusercontent.com ";
/*************  ✨ Codeium Command ⭐  *************/
/**
 * The main app component, which sets up the Google OAuth provider
 * and the main routes to the different pages in the app.
 *
 * @returns {JSX.Element} The JSX element representing the App component.
 */
/******  30efa471-17f1-4ca2-b21f-e310f313eb6d  *******/function App() {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Router>
        <Routes>
          <Route path = "/" element = {<Home />}/>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
          <Route path='/chat' element={<ChatApp />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
