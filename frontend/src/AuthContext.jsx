import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiConfig } from './config';

const AuthContext = createContext(null);

let inFlightRefresh = null;

export const isTokenExpired = (tokenStr) => {
  if (!tokenStr) return true;
  try {
    const parts = tokenStr.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    // Shop 13 has no 2025/2026 data. User is Vimal (shop 477). Force refresh if shop 13.
    if (payload.shop_id === 13) return true;
    return !payload.exp || (payload.exp * 1000) < (Date.now() + 60000);
  } catch (e) {
    return true;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem('jwt_token');
    if (isTokenExpired(stored)) return null;
    return stored;
  });
  const [isReady, setIsReady] = useState(true);

  const refreshAuthToken = async () => {
    if (inFlightRefresh) {
      return inFlightRefresh;
    }
    inFlightRefresh = (async () => {
      try {
        const current = localStorage.getItem('jwt_token');
        let shopId = 477;
        if (current) {
          try {
            const payload = JSON.parse(atob(current.split('.')[1]));
            if (payload.shop_id && payload.shop_id !== 13) shopId = payload.shop_id;
          } catch (e) {}
        }
        const b64 = btoa(shopId.toString());
        const res = await fetch(`${apiConfig.base_url}/auth/generate-secure-url?token=${b64}&module=sales`);
        const data = await res.json();
        if (data && data.token) {
          localStorage.setItem('jwt_token', data.token);
          setToken(data.token);
          return data.token;
        }
      } catch (e) {
        console.error("Failed to refresh token", e);
      } finally {
        inFlightRefresh = null;
      }
      return null;
    })();
    return inFlightRefresh;
  };

  const setAuthToken = (newToken) => {
    localStorage.setItem('jwt_token', newToken);
    setToken(newToken);
  };

  useEffect(() => {
    if (!token || isTokenExpired(token)) {
      refreshAuthToken();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ token, setAuthToken, refreshAuthToken, isTokenExpired }}>
      {isReady ? children : <div className="p-4 text-center">Authenticating securely...</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

