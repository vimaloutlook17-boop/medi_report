import React, { useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { apiConfig } from '../../config';

export default function AutoLogin({ children }) {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      fetch(apiConfig.auth_generate_url)
        .then(res => res.json())
        .then(data => {
          if (data.url) {
            window.location.href = data.url;
          }
        })
        .catch(err => console.error('Auto-login failed:', err));
    }
  }, [token]);

  if (!token) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '12px', fontFamily: 'Arial, sans-serif', color: '#555', fontSize: '15px' }}>
        <style>{\@keyframes spin { to { transform: rotate(360deg); } }\}</style>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e0e0e0', borderTop: '4px solid #0052cc', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span>Authenticating, please wait...</span>
      </div>
    );
  }

  return children;
}
