
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
      
      // Add proper validation before submission
      const requiredFields = ['ageRange', 'gender', 'language', 'biography', 'beliefs', 
                             'mainOffer', 'offerDetails', 'whyItWorks', 'experience'];
      
      for (const field of requiredFields) {
        if (!dataToSubmit[field] || dataToSubmit[field].trim() === '') {
          const errorMessage = `Brak wymaganego pola: ${field}`;
          console.error(errorMessage);
          toast.error(errorMessage);
          setIsProcessing(false);
          return undefined;
        }
      }
      
      // Validate array fields
      const arrayFieldRequirements = {
        'competitors': 3,
        'pains': 5,
        'desires': 5,
        'benefits': 5
      };
      
      for (const [field, requiredCount] of Object.entries(arrayFieldRequirements)) {
        if (!Array.isArray(dataToSubmit[field]) || 
            dataToSubmit[field].filter(item => item && item.trim() !== '').length < requiredCount) {
          const errorMessage = `Pole ${field} wymaga co najmniej ${requiredCount} niepustych elementów`;
          console.error(errorMessage);
          toast.error(errorMessage);
          setIsProcessing(false);
          return undefined;
        }
      }
      
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
      
      // Method 3: Fallback to direct Supabase insertion
      if (!savedSuccessfully) {
        try {
          console.log("Attempting direct Supabase insertion");
          
          // Create a properly formatted object for Supabase
          const dbData = {
            user_id: userId,
            name: `Grupa ${Math.floor(Math.random() * 1000) + 1}`,
            age_range: dataToSubmit.ageRange || '',
            gender: dataToSubmit.gender || '',
            competitors: Array.isArray(dataToSubmit.competitors) ? 
              dataToSubmit.competitors.filter(Boolean).slice(0, 3) : ['Competitor 1', 'Competitor 2', 'Competitor 3'],
            language: dataToSubmit.language || '',
            biography: dataToSubmit.biography || '',
            beliefs: dataToSubmit.beliefs || '',
            pains: Array.isArray(dataToSubmit.pains) ? 
              dataToSubmit.pains.filter(Boolean).slice(0, 5) : ['Pain 1', 'Pain 2', 'Pain 3', 'Pain 4', 'Pain 5'],
            desires: Array.isArray(dataToSubmit.desires) ? 
              dataToSubmit.desires.filter(Boolean).slice(0, 5) : ['Desire 1', 'Desire 2', 'Desire 3', 'Desire 4', 'Desire 5'],
            main_offer: dataToSubmit.mainOffer || '',
            offer_details: dataToSubmit.offerDetails || '',
            benefits: Array.isArray(dataToSubmit.benefits) ? 
              dataToSubmit.benefits.filter(Boolean).slice(0, 5) : ['Benefit 1', 'Benefit 2', 'Benefit 3', 'Benefit 4', 'Benefit 5'],
            why_it_works: dataToSubmit.whyItWorks || '',
            experience: dataToSubmit.experience || ''
          };
          
          // Import Supabase client directly to avoid circular dependencies
          const { supabase } = await import('@/integrations/supabase/client');
          
          // Add retry mechanism for direct insertion
          let attempts = 0;
          const maxAttempts = 3;
          
          while (attempts < maxAttempts && !savedSuccessfully) {
            attempts++;
            console.log(`Direct insertion attempt ${attempts}/${maxAttempts}`);
            
            try {
              const { data: insertData, error } = await supabase
                .from('target_audiences')
                .insert(dbData)
                .select('id')
                .single();
                
              if (error) {
                console.error(`Error in direct insertion attempt ${attempts}:`, error);
                await new Promise(resolve => setTimeout(resolve, 500));
                continue;
              }
              
              if (insertData && insertData.id) {
                console.log("Direct insertion successful with ID:", insertData.id);
                audienceId = insertData.id;
                savedSuccessfully = true;
                break;
              } else {
                console.error("Direct insertion returned no data");
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            } catch (insertError) {
              console.error(`Error in direct insertion attempt ${attempts}:`, insertError);
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        } catch (directError) {
          console.error("Direct Supabase insertion failed:", directError);
        }
      }
      
      // Method 4: Last resort - try passed submitAudienceForm function
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
        toast.error("Nie udało się zapisać grupy docelowej po wielu próbach");
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
