
import posthog from 'posthog-js';

// Initialize PostHog with environment variables
export const initPostHog = () => {
  posthog.init(
    'phc_INAofSEDbqKM55bsqFARJ1dC6Esd4K4ptGMxMuOKd5O',
    {
      api_host: 'https://eu.i.posthog.com',
      loaded: (posthog) => {
        if (import.meta.env.DEV) {
          // In development, log events to console
          posthog.debug();
        }
      },
      autocapture: true,
    }
  );
  
  return posthog;
};

// Utility function for tracking events
export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>
) => {
  posthog.capture(eventName, properties);
};

// Export posthog instance for direct access if needed
export { posthog };
