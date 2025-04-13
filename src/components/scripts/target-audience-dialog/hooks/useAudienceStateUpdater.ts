
import { useEffect } from 'react';

/**
 * Hook to update dialog state based on audience data
 */
export const useAudienceStateUpdater = (
  existingAudiences: any[],
  isLoading: boolean,
  isCompressing: boolean,
  setExistingAudiences: (audiences: any[]) => void,
  setIsLoading: (isLoading: boolean) => void
) => {
  // Set state from audience data
  useEffect(() => {
    setExistingAudiences(existingAudiences);
    setIsLoading(isLoading || isCompressing);
  }, [existingAudiences, isLoading, isCompressing, setExistingAudiences, setIsLoading]);
};
