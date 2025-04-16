
import { useState } from 'react';
import { toast } from 'sonner';
import { submitTargetAudienceForm } from '../../target-audience-form/submission-utils';
import { saveTargetAudience } from '../api';

/**
 * Hook to handle form submission logic with improved error handling and debugging
 */
export const useFormSubmission = (
  userId: string | undefined,
  submitAudienceForm: (values: any) => Promise<string | undefined>,
  fetchExistingAudiences: () => Promise<void>
) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFormSubmit = async (values: any): Promise<string | undefined> => {
    try {
      console.log("Form submission started in useFormSubmission");
      setIsProcessing(true);
      
      if (!userId) {
        console.error("No user ID provided");
        toast.error('Nie jesteś zalogowany');
        setIsProcessing(false);
        return undefined;
      }
      
      // Create a clean copy of values without advertisingGoal
      const { advertisingGoal, ...dataToSubmit } = values;
      console.log("Values for submission (without advertisingGoal):", dataToSubmit);
      
      // Try multiple methods of submission to ensure data is saved
      let audienceId: string | undefined;
      let savedSuccessfully = false;
      
      // Method 1: Direct API call with better error handling
      try {
        console.log("Attempting direct API save method with user ID:", userId);
        audienceId = await saveTargetAudience(dataToSubmit, userId);
        if (audienceId) {
          console.log("Direct API save successful with ID:", audienceId);
          savedSuccessfully = true;
        } else {
          console.error("Direct API save returned no audience ID");
        }
      } catch (apiError) {
        console.error("Direct API save failed:", apiError);
      }
      
      // Method 2: Form submission util if direct API failed
      if (!savedSuccessfully) {
        try {
          console.log("Attempting form submission util with user ID:", userId);
          audienceId = await submitTargetAudienceForm(dataToSubmit, userId);
          if (audienceId) {
            console.log("Submission util successful with ID:", audienceId);
            savedSuccessfully = true;
          } else {
            console.error("Submission util returned no audience ID");
          }
        } catch (submissionError) {
          console.error("Submission util failed:", submissionError);
        }
      }
      
      // Method 3: Fallback to passed submitAudienceForm function
      if (!savedSuccessfully) {
        try {
          console.log("Attempting fallback submission method");
          audienceId = await submitAudienceForm(dataToSubmit);
          if (audienceId) {
            console.log("Fallback submission successful with ID:", audienceId);
            savedSuccessfully = true;
          } else {
            console.error("Fallback submission returned no audience ID");
          }
        } catch (fallbackError) {
          console.error("Fallback submission failed:", fallbackError);
        }
      }
      
      if (audienceId && savedSuccessfully) {
        // Refresh audience list to ensure we have the latest data
        console.log("Refreshing audience list after successful save");
        await fetchExistingAudiences();
        console.log("Audience list refreshed");
        toast.success('Grupa docelowa została utworzona');
        return audienceId;
      } else {
        console.error("All submission methods failed. No audience ID returned.");
        throw new Error("None of the submission methods succeeded");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error('Nie udało się utworzyć grupy docelowej');
      return undefined;
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
