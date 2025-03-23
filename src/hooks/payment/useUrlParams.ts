
import { useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

/**
 * Hook to handle URL parameters related to payment processing
 */
export function useUrlParams() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Check for URL parameters
  const isCanceled = searchParams.get('canceled') === 'true';
  
  // Clean up the URL when needed
  const cleanupUrlParams = useCallback(() => {
    if (searchParams.has('canceled')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('canceled');
      const newUrl = newParams.toString() 
        ? `${window.location.pathname}?${newParams}` 
        : window.location.pathname;
      navigate(newUrl, { replace: true });
    }
  }, [searchParams, navigate]);
  
  return {
    isCanceled,
    cleanupUrlParams
  };
}
