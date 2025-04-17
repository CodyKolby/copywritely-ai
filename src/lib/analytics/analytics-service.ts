
import posthog from 'posthog-js';
import { AnalyticsEvents, CTAButtonProperties } from './events';

class AnalyticsService {
  private scrollDepthTracked = false;

  constructor() {
    // Initialize scroll depth tracking for homepage
    if (window.location.pathname === '/') {
      this.initScrollDepthTracking();
    }
  }

  private initScrollDepthTracking = () => {
    const handleScroll = () => {
      if (this.scrollDepthTracked) return;

      const scrolledToBottom = 
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;

      if (scrolledToBottom) {
        this.trackScrollDepthBottom();
        this.scrollDepthTracked = true;
        // Remove listener after tracking
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll);
  };

  // General page events
  public trackViewPlansPage = () => {
    posthog.capture(AnalyticsEvents.VIEW_PLANS_PAGE);
  };

  public trackClickLoginPage = () => {
    posthog.capture(AnalyticsEvents.CLICK_LOGIN_PAGE);
  };

  public trackUserLoggedIn = () => {
    posthog.capture(AnalyticsEvents.USER_LOGGED_IN);
  };

  private trackScrollDepthBottom = () => {
    posthog.capture(AnalyticsEvents.SCROLL_DEPTH_BOTTOM);
  };

  public trackCTAClick = (properties: CTAButtonProperties) => {
    posthog.capture(AnalyticsEvents.CLICK_CTA_BUTTON, properties);
  };

  // Subscription related events
  public trackClickStartTrial = () => {
    posthog.capture(AnalyticsEvents.CLICK_START_TRIAL);
  };

  public trackTrialStarted = () => {
    console.log('Tracking trial started event');
    posthog.capture(AnalyticsEvents.TRIAL_STARTED);
  };

  public trackTrialConverted = () => {
    console.log('Tracking trial converted event');
    posthog.capture(AnalyticsEvents.TRIAL_CONVERTED);
  };
}

export const analyticsService = new AnalyticsService();
