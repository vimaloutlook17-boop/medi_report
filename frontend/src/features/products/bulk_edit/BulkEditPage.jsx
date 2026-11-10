import React, { useEffect } from 'react';
import { useAuth } from '../../../AuthContext';
import { apiConfig } from '../../../config';

export default function BulkEditPage() {
  const { token, setAuthToken } = useAuth();

  useEffect(() => {
    // Extract token directly from URL query parameters if present
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const shopId = urlParams.get('shop_id');
    
    if (urlToken && setAuthToken) {
      setAuthToken(urlToken);
    }

    const activeToken = urlToken || token || localStorage.getItem('jwt_token') || '';
    
    let downloadUrl = `${apiConfig.base_url}/products/bulk-edit`;
    const queryParts = [];
    if (activeToken) {
      queryParts.push(`token=${encodeURIComponent(activeToken)}`);
    }
    if (shopId) {
      queryParts.push(`shop_id=${encodeURIComponent(shopId)}`);
    }
    if (queryParts.length > 0) {
      downloadUrl += `?${queryParts.join('&')}`;
    }

    // Direct browser redirect to trigger immediate file stream download
    window.location.href = downloadUrl;
  }, []);

  return null;
}
