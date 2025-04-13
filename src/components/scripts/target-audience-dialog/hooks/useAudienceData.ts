
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
      const { data, error } = await supabase
        .from('target_audiences')
        .select('id, name')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      setExistingAudiences(data || []);
    } catch (error) {
      console.error('Error fetching target audiences:', error);
      toast.error('Nie udało się pobrać grup docelowych');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      setIsLoading(true);
      
      // Ensure we don't have advertisingGoal in the values
      const { advertisingGoal, ...dataToSubmit } = values;
      
      console.log("Prepared data for Supabase:", dataToSubmit);
      
      // Store the target audience in the database
      const { data, error } = await supabase
        .from('target_audiences')
        .insert({
          ...dataToSubmit,
          user_id: userId
        })
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
