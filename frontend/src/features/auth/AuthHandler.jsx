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
      const cleanModule = (module || '').trim().toLowerCase();
      let redirectPath = '/';
      if (cleanModule === 'stocks') {
        redirectPath = '/stocks/product-summary';
      } else if (cleanModule === 'sales') {
        redirectPath = '/sales/product-wise-customer';
      } else if (cleanModule === 'customer_credit_reports' || cleanModule === 'customer-credit-reports') {
        redirectPath = '/sales/customer-credit-reports';
      } else if (cleanModule === 'reports') {
        redirectPath = '/reports/collection_report';
      } else if (cleanModule === 'op_ip_report') {
        redirectPath = '/reports/op_ip_report';
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
