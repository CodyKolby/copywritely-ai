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

export const saveTargetAudience = async (data: any, userId: string): Promise<string | undefined> => {
  if (!userId) {
    console.error('No user ID provided for saving target audience');
    toast.error('Nie jesteś zalogowany');
    return undefined;
  }
  
  try {
    console.log('Direct database insertion starting with userId:', userId);
    console.log('Data to save:', JSON.stringify(data));
    
    // Generate a name if not provided
    const audienceName = data.name || generateAudienceName(data.ageRange || data.age_range, data.mainOffer || data.main_offer);
    console.log('Using audience name:', audienceName);
    
    // Normalize data to ensure all fields are in the right format
    const dbData = {
      user_id: userId,
      name: audienceName,
      age_range: data.age_range || data.ageRange || '',
      gender: data.gender || '',
      competitors: Array.isArray(data.competitors) 
        ? data.competitors.filter(Boolean).slice(0, 10)
        : ['Konkurent 1', 'Konkurent 2', 'Konkurent 3'],
      language: data.language || '',
      biography: data.biography || '',
      beliefs: data.beliefs || '',
      pains: Array.isArray(data.pains) 
        ? data.pains.filter(Boolean).slice(0, 10)
        : ['Problem 1', 'Problem 2', 'Problem 3', 'Problem 4', 'Problem 5'],
      desires: Array.isArray(data.desires) 
        ? data.desires.filter(Boolean).slice(0, 10)
        : ['Pragnienie 1', 'Pragnienie 2', 'Pragnienie 3', 'Pragnienie 4', 'Pragnienie 5'],
      main_offer: data.main_offer || data.mainOffer || '',
      offer_details: data.offer_details || data.offerDetails || '',
      benefits: Array.isArray(data.benefits) 
        ? data.benefits.filter(Boolean).slice(0, 10)
        : ['Korzyść 1', 'Korzyść 2', 'Korzyść 3', 'Korzyść 4', 'Korzyść 5'],
      why_it_works: data.why_it_works || data.whyItWorks || '',
      experience: data.experience || ''
    };
    
    console.log('Mapped data for database insertion:', JSON.stringify(dbData));
    
    // Simple direct insertion approach with max 5 retries
    for (let attempt = 1; attempt <= 5; attempt++) {
      console.log(`Insertion attempt ${attempt}/5`);
      
      try {
        const { data: insertData, error } = await supabase
          .from('target_audiences')
          .insert(dbData)
          .select('id')
          .single();
          
        if (error) {
          console.error(`Error on attempt ${attempt}:`, error);
          
          if (attempt === 5) {
            toast.error('Nie udało się zapisać grupy docelowej po wielu próbach');
            return undefined;
          }
          
          // Wait a bit before retry
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        
        if (!insertData || !insertData.id) {
          console.error(`No ID returned on attempt ${attempt}`);
          
          if (attempt === 5) {
            toast.error('Błąd podczas zapisywania - brak zwróconego identyfikatora');
            return undefined;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        
        // Success!
        console.log('Successfully inserted target audience with ID:', insertData.id);
        toast.success('Grupa docelowa została utworzona');
        
        return insertData.id;
      } catch (attemptError) {
        console.error(`Exception on attempt ${attempt}:`, attemptError);
        
        if (attempt === 5) {
          toast.error('Nieoczekiwany błąd podczas zapisywania');
          return undefined;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return undefined;
  } catch (error) {
    console.error('Fatal error in saveTargetAudience:', error);
    toast.error('Krytyczny błąd podczas zapisywania grupy docelowej');
    return undefined;
  }
};
