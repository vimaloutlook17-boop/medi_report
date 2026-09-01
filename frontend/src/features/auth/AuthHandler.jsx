import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

export default function AuthHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const module = searchParams.get('module');

    if (token) {
      // Save the token securely in session storage
      setAuthToken(token);

      // Determine where to redirect based on the module
      let redirectPath = '/';
      if (module === 'stocks') {
        redirectPath = '/stocks/product-summary';
      } else if (module === 'sales') {
        redirectPath = '/sales/product-wise-customer';
      }
      
      // Navigate to the clean URL, replacing history so the user can't press "Back" to see the token
      navigate(redirectPath, { replace: true });
    } else {
      console.error("No token provided in AuthHandler URL");
    }
  }, [searchParams, navigate, setAuthToken]);

  return (
    <div className="flex items-center justify-center h-screen w-full text-[16px] text-[#666]">
      Verifying secure connection...
    </div>
  );
}
