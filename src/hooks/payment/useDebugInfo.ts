
import { useState } from 'react';

export type DebugInfo = Record<string, string>;

export function useDebugInfo() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    'Debug Info': 'No data collected yet'
  });

  // Collect debug info for troubleshooting
  const collectDebugInfo = (userData?: any) => {
    const info: DebugInfo = {
      'Timestamp': new Date().toISOString(),
      'User ID': userData?.id || 'Not logged in',
      'User Email': userData?.email || 'Not available',
      'Browser': navigator.userAgent,
      'Window Location': window.location.href,
      'localStorage.userEmail': localStorage.getItem('userEmail') || 'Not set',
      'sessionStorage.redirectingToStripe': sessionStorage.getItem('redirectingToStripe') || 'Not set',
      'sessionStorage.stripeCheckoutInProgress': sessionStorage.getItem('stripeCheckoutInProgress') || 'Not set'
    };
    
    console.log('Debug info collected:', info);
    setDebugInfo(info);
    return info;
  };

  return { debugInfo, collectDebugInfo };
}
