import React, { useEffect, useState } from 'react';

const GitHubCallback = () => {
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        console.log('GitHub callback - Code:', code, 'Error:', error);

        if (error) {
          console.error('GitHub OAuth error:', error);
          setStatus('GitHub login failed');
          if (window.showToast) {
            window.showToast('GitHub login failed', 'error', 4000);
          }
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }

        if (!code) {
          console.error('No authorization code received');
          setStatus('No authorization code received');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }

        setStatus('Exchanging code for token...');

        // Exchange code for access token
        const tokenResponse = await fetch('http://localhost:5000/api/auth/github/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });

        if (!tokenResponse.ok) {
          throw new Error(`Token exchange failed: ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json();
        console.log('Token response:', tokenData);

        if (!tokenData.access_token) {
          throw new Error('No access token received');
        }

        setStatus('Authenticating with GitHub...');

        // Use the access token to authenticate
        const authResponse = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ githubToken: tokenData.access_token })
        });

        if (!authResponse.ok) {
          throw new Error(`Authentication failed: ${authResponse.status}`);
        }

        const data = await authResponse.json();
        console.log('Auth response:', data);

        if (data.needsProfileCompletion) {
          // Redirect to login with profile completion flag
          localStorage.setItem('pendingProfileCompletion', JSON.stringify({
            userId: data.userId,
            provider: 'github'
          }));
          setStatus('Profile completion required...');
          setTimeout(() => {
            window.location.href = '/login?profileCompletion=true';
          }, 1000);
        } else if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          setStatus('Login successful! Redirecting...');
          
          if (window.showToast) {
            window.showToast('Logged in successfully', 'success', 3000);
          }

          setTimeout(() => {
            if (data.user.role === 'project_admin') {
              window.location.href = '/admin-dashboard';
            } else {
              window.location.href = '/dashboard';
            }
          }, 1500);
        } else {
          throw new Error(data.message || 'GitHub login failed');
        }

      } catch (error) {
        console.error('GitHub login error:', error);
        setStatus(`Login failed: ${error.message}`);
        
        if (window.showToast) {
          window.showToast('GitHub login failed', 'error', 4000);
        }

        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{status}</p>
      </div>
    </div>
  );
};

export default GitHubCallback;