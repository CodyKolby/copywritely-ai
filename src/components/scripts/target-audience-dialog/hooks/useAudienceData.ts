
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { compressFormData } from '../../target-audience-form/compression-service';
import { deleteTargetAudience, generateAudienceName } from '../api';

export const useAudienceData = (userId: string | undefined, open: boolean) => {
  const [existingAudiences, setExistingAudiences] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompressing, setIsCompressing] = useState(false);
  const [hasRefreshedAfterCreation, setHasRefreshedAfterCreation] = useState(false);
  
  // Add a flag to prevent excessive fetching
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const isFetchingRef = useRef<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch existing target audiences when the dialog opens, but with throttling
  useEffect(() => {
    if (open && userId) {
      const now = Date.now();
      // Only fetch if it's been more than 2 seconds since last fetch
      if (now - lastFetchTime > 2000 && !isFetchingRef.current) {
        fetchExistingAudiences();
      }
    }
    
    // Clear any pending refresh timeout when component unmounts
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [open, userId]);

  // Handle post-creation refresh with delay and without constant retries
  useEffect(() => {
    if (hasRefreshedAfterCreation && !isFetchingRef.current) {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        console.log("Performing one-time post-creation audience refresh");
        fetchExistingAudiences();
        setHasRefreshedAfterCreation(false);
        refreshTimeoutRef.current = null;
      }, 500);
    }
  }, [hasRefreshedAfterCreation, userId]);

  const fetchExistingAudiences = async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log("Already fetching audiences, skipping duplicate request");
      return;
    }
    
    // Early exit if no user ID
    if (!userId) {
      console.log("No user ID provided, skipping audience fetch");
      setIsLoading(false);
      return;
    }
    
    try {
      setLastFetchTime(Date.now());
      setIsLoading(true);
      isFetchingRef.current = true;
      setHasError(false);
      
      console.log("Fetching target audiences for user:", userId);
      const { data, error } = await supabase
        .from('target_audiences')
        .select('id, name')
        .eq('user_id', userId);

      if (error) {
        console.error("Error fetching target audiences:", error);
        setHasError(true);
        throw error;
      }

      console.log("Fetched target audiences:", data);
      setExistingAudiences(data || []);
      
      // Clear error toast if previous attempts failed
      if (hasError) {
        toast.success('Pobrano grupy docelowe');
      }
    } catch (error) {
      console.error('Error fetching target audiences:', error);
      // Limit notifications to avoid spamming
      if (!hasError) {
        toast.error('Nie udało się pobrać grup docelowych');
        setHasError(true);
      }
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleDeleteAudience = async (audienceId: string) => {
    try {
      setIsLoading(true);
      const success = await deleteTargetAudience(audienceId);
      
      if (success) {
        // Update the audience list after successful deletion
        await fetchExistingAudiences();
      }
    } catch (error) {
      console.error('Error deleting audience:', error);
      toast.error('Nie udało się usunąć grupy docelowej');
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
      
      // Generate a better name based on main offer and age range
      const audienceName = generateAudienceName(
        dataToSubmit.ageRange,
        dataToSubmit.mainOffer
      );
      
      // Mapowanie nazw pól z camelCase na snake_case używane w bazie danych
      const targetAudienceData = {
        user_id: userId,
        name: audienceName,
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
      
      // Mark for refresh on next dialog cycle
      setHasRefreshedAfterCreation(true);
      
      // Schedule a one-time refresh
      setTimeout(() => {
        fetchExistingAudiences();
      }, 1000);
      
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

  // Add a manual refresh method
  const manualRefresh = () => {
    if (!isFetchingRef.current) {
      console.log("Manually refreshing audiences");
      fetchExistingAudiences();
    }
  };

  return {
    existingAudiences,
    isLoading,
    isCompressing,
    hasError,
    handleFormSubmit,
    fetchExistingAudiences,
    handleDeleteAudience,
    manualRefresh
  };
};
