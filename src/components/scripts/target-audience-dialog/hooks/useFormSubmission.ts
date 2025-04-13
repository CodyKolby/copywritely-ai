
import { useState } from 'react';
import { toast } from 'sonner';

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
      
      // Pass the cleaned data to submitAudienceForm
      const audienceId = await submitAudienceForm(dataToSubmit);
      console.log("Audience created with ID:", audienceId);
      
      if (audienceId) {
        // Refresh audience list
        await fetchExistingAudiences();
        return audienceId;
      } else {
        throw new Error("No audience ID returned");
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
