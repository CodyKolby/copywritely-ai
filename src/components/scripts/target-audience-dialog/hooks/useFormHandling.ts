
import { useCallback } from 'react';

interface FormHandlingProps {
  setSelectedAudienceId: (id: string | null) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setIsTransitioning: (isTransitioning: boolean) => void;
  setShowForm: (show: boolean) => void;
  goToNextStep: () => void;
}

/**
 * Hook for handling form submission and navigation
 */
export const useFormHandling = ({
  setSelectedAudienceId,
  setIsProcessing,
  setIsTransitioning,
  setShowForm,
  goToNextStep
}: FormHandlingProps) => {
  // Handle form submission
  const handleFormSubmit = useCallback((audienceId: string) => {
    setSelectedAudienceId(audienceId);
    setIsProcessing(true);
    
    // Hide the form and go to the next step
    setIsTransitioning(true);
    setTimeout(() => {
      setShowForm(false);
      goToNextStep();
    }, 300);
  }, [goToNextStep]);

  // Handle back button in form
  const handleBack = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowForm(false);
      setIsTransitioning(false);
    }, 300);
  }, []);

  return {
    handleFormSubmit,
    handleBack
  };
};
