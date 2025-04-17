
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function useUrlParams() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCanceled, setIsCanceled] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(location.search);
    const canceled = params.get('canceled');
    const sessionIdParam = params.get('session_id');

    // Check if payment was canceled
    if (canceled === 'true') {
      console.log('Payment canceled detected in URL');
      setIsCanceled(true);
    } else {
      setIsCanceled(false);
    }

    // Check if we have a successful payment with session_id
    if (sessionIdParam) {
      console.log('Payment success detected with session ID:', sessionIdParam);
      setIsSuccessful(true);
      setSessionId(sessionIdParam);
    } else {
      setIsSuccessful(false);
      setSessionId(null);
    }
  }, [location.search]);

  // Function to clean up URL parameters
  const cleanupUrlParams = () => {
    if (isCanceled || isSuccessful) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      console.log('URL parameters cleaned up');
    }
  };

  return {
    isCanceled,
    isSuccessful,
    sessionId,
    cleanupUrlParams
  };
}
