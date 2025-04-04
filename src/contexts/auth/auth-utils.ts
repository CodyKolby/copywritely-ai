
// Re-export profile-related functions except the conflicting one
import * as ProfileUtils from './profile-utils';

// Re-export premium-related functions 
import * as PremiumUtils from './premium-utils';

// Re-export auth methods
export * from './auth-methods';

// Re-export everything from profile-utils except updatePremiumStatus
export const {
  fetchProfile,
  createProfile,
  // Explicitly exclude updatePremiumStatus
} = ProfileUtils;

// Re-export all premium utilities
export * from './premium-utils';
