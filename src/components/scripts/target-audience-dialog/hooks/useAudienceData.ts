
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { compressFormData } from '../../target-audience-form/compression-service';

export const useAudienceData = (userId: string | undefined, open: boolean) => {
  const [existingAudiences, setExistingAudiences] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompressing, setIsCompressing] = useState(false);

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
      setIsCompressing(true);
      
      // Ensure we don't have advertisingGoal in the values
      const { advertisingGoal, ...dataToSubmit } = values;
      
      console.log("Starting data compression and submission process");
      
      // Start compression of form data
      console.log("Compressing form data...");
      let compressedData;
      try {
        compressedData = await compressFormData(dataToSubmit);
        console.log("Data compression complete:", compressedData);
      } catch (compressError) {
        console.warn("Compression failed, using original data:", compressError);
        compressedData = dataToSubmit;
      }
      
      // Mapowanie nazw pól z camelCase na snake_case używane w bazie danych
      const targetAudienceData = {
        user_id: userId,
        name: compressedData.name || dataToSubmit.name || `Grupa ${Math.floor(Math.random() * 1000) + 1}`,
        age_range: compressedData.ageRange || dataToSubmit.ageRange,
        gender: compressedData.gender || dataToSubmit.gender,
        competitors: compressedData.competitors || dataToSubmit.competitors,
        language: compressedData.language || dataToSubmit.language,
        biography: compressedData.biography || dataToSubmit.biography,
        beliefs: compressedData.beliefs || dataToSubmit.beliefs,
        pains: compressedData.pains || dataToSubmit.pains,
        desires: compressedData.desires || dataToSubmit.desires,
        main_offer: compressedData.mainOffer || dataToSubmit.mainOffer,
        offer_details: compressedData.offerDetails || dataToSubmit.offerDetails,
        benefits: compressedData.benefits || dataToSubmit.benefits,
        why_it_works: compressedData.whyItWorks || dataToSubmit.whyItWorks,
        experience: compressedData.experience || dataToSubmit.experience,
      };
      
      console.log("Data prepared for database submission:", targetAudienceData);
      
      // Add a slight delay to ensure UI shows loading state
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
      setIsCompressing(false);
      setIsLoading(false);
    }
  };

  return {
    existingAudiences,
    isLoading,
    isCompressing,
    handleFormSubmit,
    fetchExistingAudiences
  };
};
