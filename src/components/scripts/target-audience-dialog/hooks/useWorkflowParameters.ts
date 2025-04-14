
import { useState, useCallback } from 'react';
import { EmailStyle } from '../../EmailStyleDialog';
import { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';

/**
 * Hook for managing workflow parameters like goal, email style, etc.
 */
export const useWorkflowParameters = () => {
  // State for additional parameters
  const [advertisingGoal, setAdvertisingGoal] = useState<string>('');
  const [emailStyle, setEmailStyle] = useState<EmailStyle>('direct-sales'); // Updated to use EmailStyle type
  const [socialMediaPlatform, setSocialMediaPlatform] = useState<SocialMediaPlatform | undefined>(undefined);
  
  // Reset parameters function
  const resetParameters = useCallback(() => {
    setAdvertisingGoal('');
    setEmailStyle('direct-sales');
    setSocialMediaPlatform(undefined);
  }, []);

  return {
    advertisingGoal,
    setAdvertisingGoal,
    emailStyle,
    setEmailStyle,
    socialMediaPlatform,
    setSocialMediaPlatform,
    resetParameters
  };
};
