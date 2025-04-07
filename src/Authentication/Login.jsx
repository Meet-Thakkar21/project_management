import React, { useState, useEffect } from 'react';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const clientId = "480382669507-gat4q906qi4rlv61hnl9tpehfem6j3qm.apps.googleusercontent.com"; // Replace with your actual Google Client ID

  useEffect(() => {
    // Initialize Google Sign-In
    window.google?.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleSuccess,
    });
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        window.showToast('Logged in successfully', 'success', 3000);

        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        window.showToast(data.message || 'Login failed', 'error', 4000);
        console.error('Login error:', data.message);
      }
    } catch (error) {
      window.showToast('An error occurred. Please try again later.', 'error', 4000);
      console.error('Server error:', error);
    }
  };

  const handleGoogleSuccess = (response) => {
    const credential = response.credential;
    console.log('Google JWT Token:', credential);

    fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleToken: credential }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          localStorage.setItem('token', data.token);
          window.showToast('Logged in successfully', 'success', 3000);

          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
        } else {
          window.showToast(data.message || 'Login failed', 'error', 4000);
          console.error('Login failed:', data.message);
        }
      })
      .catch(error => {
        window.showToast('An error occurred. Please try again later.', 'error', 4000);
        console.error('Server error:', error);
      });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white">
        <div className="w-full max-w-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Taskify - Project Management Tool</h2>
          <h3 className="text-xl text-gray-700 mb-8">Please Enter your Account details</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-end">
              <button type="button" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-all"
            >
              Sign In
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              {/* Google Login Button */}
              <button
                onClick={() => window.google?.accounts.id.prompt()}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                <FaGoogle className="text-gray-600 mr-2" />
                <span className="text-gray-700">Google</span>
              </button>

              <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                <FaGithub className="text-gray-600 mr-2" />
                <span className="text-gray-700">GitHub</span>
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-gray-600">
            Don't have an account?{' '}
            <a href="/signup" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Sign up
            </a>
          </p>
        </div>
      </div>

      {/* Right Side - Image and Quote */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-emerald-500 to-teal-400 relative">
        <img src="/logo_crop.png" alt="Taskify Logo" className="login-logo" />
        <h2 className="welcome-text">Welcome to Taskify</h2>
        <p className="description-text">
          Taskify is your go-to project management tool designed to simplify collaboration, improve task tracking, and boost productivity.
          Manage tasks efficiently, communicate seamlessly, and get things done—effortlessly.
        </p>
      </div>
    </div>
  );
};

export default Login;