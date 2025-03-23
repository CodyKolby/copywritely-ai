
import { useState, useCallback } from 'react';

export type DebugInfo = Record<string, string>;

/**
 * Hook to manage debug information for payment processing
 */
export function useDebugInfo() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  
  const collectDebugInfo = useCallback((userData: any = null) => {
    const info: Record<string, string> = {
      'User authenticated': userData ? 'Yes' : 'No',
      'User ID': userData?.id || 'Not logged in',
      'User Email': userData?.email || 'Not available',
      'Browser': navigator.userAgent,
      'URL': window.location.href,
      'Route params': new URLSearchParams(window.location.search).toString() || 'None',
      'stripeCheckoutInProgress': sessionStorage.getItem('stripeCheckoutInProgress') || 'Not set',
      'redirectingToStripe': sessionStorage.getItem('redirectingToStripe') || 'Not set',
      'Timestamp': new Date().toISOString(),
      'localStorage.userEmail': localStorage.getItem('userEmail') || 'Not set'
    };
    
    setDebugInfo(info);
    return info;
  }, []);
  
  return {
    debugInfo,
    collectDebugInfo
  };
}
