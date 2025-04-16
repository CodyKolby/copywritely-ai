
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

// Improved direct data insertion function with more detailed error handling and logging
export const saveTargetAudience = async (data: any, userId: string): Promise<string | undefined> => {
  if (!userId) {
    console.error('No user ID provided for saving target audience');
    throw new Error('No user ID provided for saving target audience');
  }
  
  try {
    console.log('Direct database insertion starting with userId:', userId);
    console.log('Data to save:', data);
    
    // Generate a name if not provided
    const audienceName = data.name || generateAudienceName(data.ageRange || data.age_range, data.mainOffer || data.main_offer);
    console.log('Using audience name:', audienceName);
    
    // Map field names to match database schema
    const dbData = {
      user_id: userId,
      name: audienceName,
      age_range: data.age_range || data.ageRange || '',
      gender: data.gender || '',
      competitors: Array.isArray(data.competitors) ? data.competitors.filter(Boolean) : [],
      language: data.language || '',
      biography: data.biography || '',
      beliefs: data.beliefs || '',
      pains: Array.isArray(data.pains) ? data.pains.filter(Boolean) : [],
      desires: Array.isArray(data.desires) ? data.desires.filter(Boolean) : [],
      main_offer: data.main_offer || data.mainOffer || '',
      offer_details: data.offer_details || data.offerDetails || '',
      benefits: Array.isArray(data.benefits) ? data.benefits.filter(Boolean) : [],
      why_it_works: data.why_it_works || data.whyItWorks || '',
      experience: data.experience || ''
    };
    
    console.log('Mapped data for database insertion:', dbData);
    
    // Verify all required fields are present and valid
    const requiredFields = [
      'user_id', 'name', 'age_range', 'gender', 'language', 
      'biography', 'beliefs', 'main_offer', 'offer_details',
      'why_it_works', 'experience'
    ];
    
    const arrayFields = ['competitors', 'pains', 'desires', 'benefits'];
    
    // Validate required fields
    for (const field of requiredFields) {
      if (!dbData[field] || dbData[field].trim() === '') {
        console.error(`Missing required field: ${field}`);
        throw new Error(`Brak wymaganego pola: ${field}`);
      }
    }
    
    // Validate array fields
    for (const field of arrayFields) {
      if (!Array.isArray(dbData[field]) || dbData[field].length < 1) {
        console.error(`Missing or invalid array field: ${field}`);
        if (!Array.isArray(dbData[field])) {
          dbData[field] = ['Element 1']; // Fallback with at least one item
        }
      }
    }
    
    // Add retry logic for database insertion
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Database insertion attempt ${attempts}/${maxAttempts}`);
      
      try {
        // Insert into the database with simpler query first
        const { data: insertData, error } = await supabase
          .from('target_audiences')
          .insert(dbData)
          .select('id')
          .single();
          
        if (error) {
          console.error(`Error saving target audience (attempt ${attempts}):`, error);
          lastError = error;
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        
        if (!insertData || !insertData.id) {
          console.error('Insertion succeeded but no ID was returned');
          
          // Try to find the just-inserted record
          const { data: findData } = await supabase
            .from('target_audiences')
            .select('id')
            .eq('user_id', userId)
            .eq('name', audienceName)
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (findData && findData.length > 0) {
            console.log('Found inserted audience by query:', findData[0].id);
            return findData[0].id;
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        
        console.log('Successfully saved target audience with ID:', insertData.id);
        return insertData.id;
      } catch (insertError) {
        console.error(`Attempt ${attempts} failed with error:`, insertError);
        lastError = insertError;
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // After all attempts fail, log the detailed error and throw
    console.error(`Failed to save target audience after ${maxAttempts} attempts. Last error:`, lastError);
    throw lastError || new Error('Failed to save target audience after multiple attempts');
  } catch (error) {
    console.error('Error in saveTargetAudience:', error);
    toast.error('Nie udało się zapisać grupy docelowej: ' + (error instanceof Error ? error.message : 'Nieznany błąd'));
    throw error;
  }
};
