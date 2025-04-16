
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TargetAudience } from './types';

export const fetchExistingAudiences = async (userId: string): Promise<TargetAudience[]> => {
  if (!userId || userId === 'test-user-id') {
    console.log('Using empty or test user ID, returning empty array');
    return [];
  }
  
  try {
    console.log("Fetching audiences for user ID:", userId);
    const { data, error } = await supabase
      .from('target_audiences')
      .select('id, name')
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error fetching target audiences:', error);
      toast.error('Błąd podczas pobierania grup docelowych');
      return [];
    }
    
    console.log(`Found ${data?.length || 0} audiences for user:`, data);
    return data || [];
  } catch (error) {
    console.error('Error in fetchExistingAudiences:', error);
    toast.error('Nieoczekiwany błąd podczas pobierania danych');
    return [];
  }
};

export const fetchTargetAudienceDetails = async (audienceId: string) => {
  if (!audienceId) {
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('target_audiences')
      .select('*')
      .eq('id', audienceId)
      .single();
      
    if (error) {
      console.error('Error fetching target audience details:', error);
      toast.error('Błąd podczas pobierania szczegółów grupy docelowej');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchTargetAudienceDetails:', error);
    toast.error('Nieoczekiwany błąd podczas przetwarzania danych');
    return null;
  }
};

export const deleteTargetAudience = async (audienceId: string): Promise<boolean> => {
  if (!audienceId) {
    toast.error('Nie można usunąć grupy docelowej - brak identyfikatora');
    return false;
  }
  
  try {
    const { error } = await supabase
      .from('target_audiences')
      .delete()
      .eq('id', audienceId);
      
    if (error) {
      console.error('Error deleting target audience:', error);
      toast.error('Błąd podczas usuwania grupy docelowej');
      return false;
    }
    
    toast.success('Grupa docelowa została usunięta');
    return true;
  } catch (error) {
    console.error('Error in deleteTargetAudience:', error);
    toast.error('Nieoczekiwany błąd podczas usuwania grupy');
    return false;
  }
};

export const generateAudienceName = (ageRange?: string, mainOffer?: string): string => {
  const defaultName = `Grupa ${Math.floor(Math.random() * 1000) + 1}`;
  
  if (!ageRange && !mainOffer) {
    return defaultName;
  }
  
  // Extract key information from the main offer if available
  if (mainOffer) {
    // Try to extract a short summary from the main offer (first part of the sentence)
    const mainOfferText = mainOffer.trim();
    
    // Get the first part of the sentence (max 40 chars)
    const shortOffer = mainOfferText.length > 40 
      ? mainOfferText.substring(0, 40) + '...' 
      : mainOfferText;
      
    // Combine with age range if available
    if (ageRange) {
      return `${shortOffer} (${ageRange})`;
    }
    
    return shortOffer;
  }
  
  // If only age range is available
  if (ageRange) {
    return `Grupa wiekowa ${ageRange}`;
  }
  
  return defaultName;
};

// New direct data insertion function with improved error handling, debugging and retries
export const saveTargetAudience = async (data: any, userId: string): Promise<string | undefined> => {
  if (!userId) {
    console.error('No user ID provided for saving target audience');
    throw new Error('No user ID provided for saving target audience');
  }
  
  try {
    console.log('Direct database insertion starting with userId:', userId);
    console.log('Data to save:', data);
    
    // If data already has user_id, use it; otherwise set it
    const userIdToUse = data.user_id || userId;
    console.log('Using user ID for insertion:', userIdToUse);
    
    // Map field names to match database schema if needed
    const dbData = {
      user_id: userIdToUse,
      name: data.name || generateAudienceName(data.ageRange, data.mainOffer),
      age_range: data.age_range || data.ageRange,
      gender: data.gender,
      competitors: Array.isArray(data.competitors) ? data.competitors.filter(Boolean) : 
                 (Array.isArray(data.competitors) ? data.competitors.filter(Boolean) : []),
      language: data.language,
      biography: data.biography,
      beliefs: data.beliefs,
      pains: Array.isArray(data.pains) ? data.pains.filter(Boolean) : 
            (Array.isArray(data.pains) ? data.pains.filter(Boolean) : []),
      desires: Array.isArray(data.desires) ? data.desires.filter(Boolean) : 
              (Array.isArray(data.desires) ? data.desires.filter(Boolean) : []),
      main_offer: data.main_offer || data.mainOffer,
      offer_details: data.offer_details || data.offerDetails,
      benefits: Array.isArray(data.benefits) ? data.benefits.filter(Boolean) : 
               (Array.isArray(data.benefits) ? data.benefits.filter(Boolean) : []),
      why_it_works: data.why_it_works || data.whyItWorks,
      experience: data.experience
    };
    
    console.log('Mapped data for database insertion:', dbData);
    
    // Add retry logic for database insertion
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Database insertion attempt ${attempts}/${maxAttempts}`);
      
      try {
        // Insert into the database
        const { data: responseData, error } = await supabase
          .from('target_audiences')
          .insert(dbData)
          .select('id')
          .single();
          
        if (error) {
          console.error(`Error saving target audience (attempt ${attempts}):`, error);
          lastError = error;
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retry
          continue;
        }
        
        if (!responseData || !responseData.id) {
          console.error(`No ID returned from successful insertion (attempt ${attempts})`);
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retry
          continue;
        }
        
        console.log('Successfully saved target audience with ID:', responseData.id);
        return responseData.id;
      } catch (insertError) {
        console.error(`Attempt ${attempts} failed with error:`, insertError);
        lastError = insertError;
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retry
      }
    }
    
    // After all attempts fail, log the detailed error and throw
    console.error(`Failed to save target audience after ${maxAttempts} attempts. Last error:`, lastError);
    throw lastError || new Error('Failed to save target audience after multiple attempts');
  } catch (error) {
    console.error('Error in saveTargetAudience:', error);
    throw error;
  }
};
