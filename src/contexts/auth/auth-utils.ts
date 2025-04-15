
// Re-export profile-related functions except the conflicting one
import * as ProfileUtils from './profile-utils';

// Re-export premium-related functions 
import * as PremiumUtils from './premium-utils';

// Re-export auth methods
export * from './auth-methods';

// Re-export everything from profile-utils
export const {
  fetchProfile,
  createProfile,
} = ProfileUtils;

// Re-export all premium utilities
export * from './premium-utils';
