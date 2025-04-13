
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { compressFormData } from '../../target-audience-form/compression-service';

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
        .select('id, name, age_range, gender')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

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
      
      // Compress form data before saving to database
      console.log("Data before compression:", values);
      let compressedData;
      try {
        compressedData = await compressFormData(values);
        console.log("Data after AI compression:", compressedData);
      } catch (compressError) {
        console.warn("Compression error, using original data:", compressError);
        compressedData = values;
      }
      
      // Store the target audience in the database
      const { data, error } = await supabase
        .from('target_audiences')
        .insert({
          ...compressedData,
          user_id: userId
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      // Refresh the list of target audiences
      await fetchExistingAudiences();
      
      return data.id;
    } catch (error) {
      console.error('Error creating target audience:', error);
      toast.error('Nie udało się utworzyć grupy docelowej');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    existingAudiences,
    isLoading,
    handleFormSubmit
  };
};
