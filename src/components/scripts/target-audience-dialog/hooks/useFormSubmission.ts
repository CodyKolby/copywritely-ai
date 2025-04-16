
import { useState } from 'react';
import { toast } from 'sonner';
import { submitTargetAudienceForm } from '../../target-audience-form/submission-utils';

/**
 * Hook to handle form submission logic
 */
export const useFormSubmission = (
  userId: string | undefined,
  submitAudienceForm: (values: any) => Promise<string | undefined>,
  fetchExistingAudiences: () => Promise<void>
) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFormSubmit = async (values: any): Promise<string | undefined> => {
    try {
      console.log("Form submission started");
      setIsProcessing(true);
      
      if (!userId) {
        console.error("No user ID provided");
        toast.error('Nie jesteś zalogowany');
        setIsProcessing(false);
        return;
      }
      
      // Create a clean copy of values without advertisingGoal
      const { advertisingGoal, ...dataToSubmit } = values;
      console.log("Values for submission (without advertisingGoal):", dataToSubmit);
      
      // Try both methods of submission to ensure data is saved
      let audienceId: string | undefined;
      
      try {
        // First attempt: use the direct submission utility
        audienceId = await submitTargetAudienceForm(dataToSubmit, userId);
        console.log("Audience saved using direct submission with ID:", audienceId);
      } catch (submissionError) {
        console.error("Direct submission failed, falling back to second method:", submissionError);
        
        // Second attempt: use the passed submitAudienceForm function
        audienceId = await submitAudienceForm(dataToSubmit);
        console.log("Audience saved using fallback method with ID:", audienceId);
      }
      
      if (audienceId) {
        // Refresh audience list to ensure we have the latest data
        await fetchExistingAudiences();
        return audienceId;
      } else {
        throw new Error("No audience ID returned from either submission method");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error('Nie udało się utworzyć grupy docelowej');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    setIsProcessing,
    handleFormSubmit
  };
};
