import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Load initial token from localStorage to survive page refreshes and new tabs
  const [token, setToken] = useState(() => localStorage.getItem('jwt_token') || null);
  const [isReady, setIsReady] = useState(true); // We are ready immediately since we check storage synchronously

  // Expose this method so our /auth route can securely inject the token before redirecting
  const setAuthToken = (newToken) => {
    localStorage.setItem('jwt_token', newToken);
    setToken(newToken);
  };

  return (
    <AuthContext.Provider value={{ token, setAuthToken }}>
      {isReady ? children : <div className="p-4 text-center">Authenticating securely...</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
