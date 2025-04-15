
import { useCallback } from 'react';
import { trackEvent } from '@/lib/posthog';

export const useAnalytics = () => {
  const track = useCallback((eventName: string, properties?: Record<string, any>) => {
    trackEvent(eventName, properties);
  }, []);

  return { track };
};
