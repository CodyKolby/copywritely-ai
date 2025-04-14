
import { UseTargetAudienceDialogReturn, TargetAudienceDialogProps } from '../types';
import { useAudienceDialogState } from './useAudienceDialogState';
import { usePremiumVerification } from './usePremiumVerification';
import { usePremiumValidator } from './usePremiumValidator';
import { useAudienceData } from './useAudienceData';

/**
 * Main hook for managing the Target Audience Dialog functionality
 * This is a direct replacement for the original useTargetAudienceDialog.tsx
 */
export function useTargetAudienceDialog(props: TargetAudienceDialogProps): UseTargetAudienceDialogReturn {
  const { open, onOpenChange, templateId, userId, isPremium } = props;
  
  // Verify premium status
  const { verifiedPremium } = usePremiumVerification(userId, isPremium);
  
  // Use the audience data hook for fetching and deleting audiences
  const { existingAudiences, isLoading, handleDeleteAudience } = useAudienceData(userId, open);
  
  // Use premium validator
  const premiumValidator = usePremiumValidator(
    userId, 
    isPremium,
    verifiedPremium
  );
  
  // Use the main dialog state hook
  const dialogState = useAudienceDialogState({
    open,
    onOpenChange,
    templateId,
    userId: userId || '',
    isPremium
  });

  // Return the combined state and methods
  return {
    ...dialogState,
    existingAudiences: existingAudiences || dialogState.existingAudiences,
    isLoading: isLoading || dialogState.isLoading,
    handleDeleteAudience,
    validatePremiumStatus: premiumValidator.validatePremiumStatus,
  };
}
