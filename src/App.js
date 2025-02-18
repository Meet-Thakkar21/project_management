import React from 'react';
import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Authentication/Login';
import Signup from './Authentication/Signup';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Home from './Components/Home';

const clientId = "480382669507-gat4q906qi4rlv61hnl9tpehfem6j3qm.apps.googleusercontent.com ";
function App() {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Router>
        <Routes>
          <Route path = "/" element = {<Home />}/>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
