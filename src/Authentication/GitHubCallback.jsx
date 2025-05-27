import React, { useEffect } from 'react';

const GitHubCallback = () => {
  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        console.error('GitHub OAuth error:', error);
        window.showToast('GitHub login failed', 'error', 4000);
        window.location.href = '/login';
        return;
      }

      if (code) {
        try {
          // Exchange code for access token
          const tokenResponse = await fetch('http://localhost:5000/api/auth/github/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          });

          const tokenData = await tokenResponse.json();
          
          if (tokenData.access_token) {
            // Use the access token to authenticate
            const response = await fetch('http://localhost:5000/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ githubToken: tokenData.access_token })
            });

            const data = await response.json();

            if (data.needsProfileCompletion) {
              // Redirect to login with profile completion flag
              localStorage.setItem('pendingProfileCompletion', JSON.stringify({
                userId: data.userId,
                provider: 'github'
              }));
              window.location.href = '/login?profileCompletion=true';
            } else if (data.token) {
              localStorage.setItem('token', data.token);
              localStorage.setItem('user', JSON.stringify(data.user));
              window.showToast('Logged in successfully', 'success', 3000);

              setTimeout(() => {
                if (data.user.role === 'project_admin') {
                  window.location.href = '/admin-dashboard';
                } else {
                  window.location.href = '/dashboard';
                }
              }, 1500);
            } else {
              window.showToast(data.message || 'GitHub login failed', 'error', 4000);
              window.location.href = '/login';
            }
          } else {
            window.showToast('Failed to get GitHub access token', 'error', 4000);
            window.location.href = '/login';
          }
        } catch (error) {
          console.error('GitHub login error:', error);
          window.showToast('GitHub login failed', 'error', 4000);
          window.location.href = '/login';
        }
      } else {
        // No code parameter, redirect to login
        window.location.href = '/login';
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing GitHub login...</p>
      </div>
    </div>
  );
};

export default GitHubCallback;