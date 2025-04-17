
// Enumerated event names for type safety
export const AnalyticsEvents = {
  VIEW_PLANS_PAGE: 'view_plans_page',
  CLICK_LOGIN_PAGE: 'click_login_page',
  USER_LOGGED_IN: 'user_logged_in',
  SCROLL_DEPTH_BOTTOM: 'scroll_depth_bottom',
  CLICK_CTA_BUTTON: 'click_cta_button',
  CLICK_START_TRIAL: 'click_start_trial',
  TRIAL_STARTED: 'trial_started',
  TRIAL_CONVERTED: 'trial_converted',
} as const;

// Type for CTA button properties
export interface CTAButtonProperties {
  button_id: string;
  button_text?: string;
}
