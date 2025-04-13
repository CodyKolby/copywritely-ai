
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const useAudienceData = (userId: string | undefined, open: boolean) => {
  const [existingAudiences, setExistingAudiences] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing target audiences
  useEffect(() => {
    if (open && userId) {
      fetchExistingAudiences();
    }
  }, [open, userId]);

  const fetchExistingAudiences = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching target audiences for user:", userId);
      const { data, error } = await supabase
        .from('target_audiences')
        .select('id, name')
        .eq('user_id', userId);

      if (error) {
        console.error("Error fetching target audiences:", error);
        throw error;
      }

      console.log("Fetched target audiences:", data);
      setExistingAudiences(data || []);
    } catch (error) {
      console.error('Error fetching target audiences:', error);
      toast.error('Nie udało się pobrać grup docelowych');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (values: any): Promise<string | undefined> => {
    try {
      setIsLoading(true);
      
      // Ensure we don't have advertisingGoal in the values
      const { advertisingGoal, ...dataToSubmit } = values;
      
      console.log("Prepared data for Supabase:", dataToSubmit);
      
      // Mapowanie nazw pól z camelCase na snake_case używane w bazie danych
      const targetAudienceData = {
        user_id: userId,
        name: dataToSubmit.name || `Grupa ${Math.floor(Math.random() * 1000) + 1}`,
        age_range: dataToSubmit.ageRange,
        gender: dataToSubmit.gender,
        competitors: dataToSubmit.competitors,
        language: dataToSubmit.language,
        biography: dataToSubmit.biography,
        beliefs: dataToSubmit.beliefs,
        pains: dataToSubmit.pains,
        desires: dataToSubmit.desires,
        main_offer: dataToSubmit.mainOffer,
        offer_details: dataToSubmit.offerDetails,
        benefits: dataToSubmit.benefits,
        why_it_works: dataToSubmit.whyItWorks,
        experience: dataToSubmit.experience,
      };
      
      console.log("Data to submit with snake_case field names:", targetAudienceData);
      
      // Store the target audience in the database
      const { data, error } = await supabase
        .from('target_audiences')
        .insert(targetAudienceData)
        .select('id')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Success - show a success toast and refresh audiences
      toast.success('Grupa docelowa została utworzona pomyślnie!');
      
      // Refresh the list of target audiences
      await fetchExistingAudiences();
      
      console.log("Successfully created target audience with ID:", data.id);
      return data.id;
    } catch (error) {
      console.error('Error creating target audience:', error);
      // Don't show the error toast here since it will be handled by the calling component
      throw error; // Rethrow to allow the calling code to handle it
    } finally {
      setIsLoading(false);
    }
  };

  return {
    existingAudiences,
    isLoading,
    handleFormSubmit,
    fetchExistingAudiences
  };
};
