
import { supabase } from '@/integrations/supabase/client';
import { FormValues } from './types';
import { toast } from 'sonner';
import { compressFormData } from './compression-service';
import { saveTargetAudience } from '../target-audience-dialog/api';

export const submitTargetAudienceForm = async (
  data: FormValues & { name?: string },
  userId: string
): Promise<string | undefined> => {
  try {
    console.log("Starting to save target audience data to database");
    console.log("Data before compression:", data);
    console.log("User ID:", userId);

    if (!userId) {
      const errorMessage = "Brak ID użytkownika";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Final validation to ensure all required fields are filled
    const validationErrors = validateFormCompleteness(data);
    if (validationErrors.length > 0) {
      const errorMessage = `Błąd walidacji: ${validationErrors.join(', ')}`;
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Remove advertisingGoal from the data before further processing
    const { advertisingGoal, ...cleanDataBeforeCompression } = data;
    console.log("Data without advertisingGoal before compression:", cleanDataBeforeCompression);

    // Try to compress data, but don't fail if compression fails
    let compressedData = { ...cleanDataBeforeCompression };
    try {
      compressedData = await compressFormData(cleanDataBeforeCompression);
      console.log("Data after AI compression:", compressedData);
    } catch (compressError) {
      console.warn("Compression error, using original data:", compressError);
    }

    // First try to use the API method
    try {
      console.log("Attempting to save via API method with user ID:", userId);
      const audienceId = await saveTargetAudience(compressedData, userId);
      if (audienceId) {
        console.log("Successfully saved via API method with ID:", audienceId);
        return audienceId;
      }
      console.warn("API method didn't throw but returned no ID");
    } catch (apiError) {
      console.warn("API method failed, falling back to direct database insertion:", apiError);
    }

    // Create a name for the target audience if not provided
    const audienceName = data.name || `Grupa ${Math.floor(Math.random() * 1000) + 1}`;
    
    // Filter arrays but ensure they still contain all required elements
    const competitors = validateArrayField(compressedData.competitors || cleanDataBeforeCompression.competitors, 3);
    const pains = validateArrayField(compressedData.pains || cleanDataBeforeCompression.pains, 5);
    const desires = validateArrayField(compressedData.desires || cleanDataBeforeCompression.desires, 5);
    const benefits = validateArrayField(compressedData.benefits || cleanDataBeforeCompression.benefits, 5);
    
    // Preparing data for saving with correct column names
    const targetAudienceData = {
      user_id: userId,
      name: audienceName,
      age_range: compressedData.ageRange || cleanDataBeforeCompression.ageRange,
      gender: compressedData.gender || cleanDataBeforeCompression.gender,
      competitors: competitors,
      language: compressedData.language || cleanDataBeforeCompression.language,
      biography: compressedData.biography || cleanDataBeforeCompression.biography,
      beliefs: compressedData.beliefs || cleanDataBeforeCompression.beliefs,
      pains: pains,
      desires: desires,
      main_offer: compressedData.mainOffer || cleanDataBeforeCompression.mainOffer,
      offer_details: compressedData.offerDetails || cleanDataBeforeCompression.offerDetails,
      benefits: benefits,
      why_it_works: compressedData.whyItWorks || cleanDataBeforeCompression.whyItWorks,
      experience: compressedData.experience || cleanDataBeforeCompression.experience,
    };
    
    console.log("Data prepared for database save (with correct column names):", targetAudienceData);
    
    // Try the insertion with three attempts
    let attempt = 0;
    const maxAttempts = 3;
    let lastError;
    
    while (attempt < maxAttempts) {
      attempt++;
      console.log(`Database save attempt (${attempt}/${maxAttempts})...`);
      
      try {
        // Save the data to the database - use direct Supabase client
        const { data: insertedData, error } = await supabase
          .from('target_audiences')
          .insert(targetAudienceData)
          .select('id')
          .single();
        
        if (error) {
          console.error(`Error during attempt ${attempt}:`, error);
          lastError = error;
          // Wait a bit between attempts
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        
        if (!insertedData || !insertedData.id) {
          console.error(`No data returned during attempt ${attempt}`);
          // Try to find the audience we just inserted
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
        
        console.log("Data saved successfully. Target audience ID:", insertedData.id);
        return insertedData.id;
      } catch (error: any) {
        console.error(`Unexpected error during attempt ${attempt}:`, error);
        lastError = error;
        // Wait a bit between attempts
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.error(`Failed to save data after ${maxAttempts} attempts.`);
    toast.error(`Nie udało się zapisać danych po ${maxAttempts} próbach`);
    throw lastError || new Error("Failed to save target audience data");
  } catch (error: any) {
    console.error("Unexpected error while saving data:", error);
    toast.error(error.message || "Nieoczekiwany błąd podczas zapisywania danych");
    throw error;
  }
};

// Helper functions for validation
function validateFormCompleteness(data: FormValues): string[] {
  const errors: string[] = [];
  
  if (!data.ageRange) errors.push("Brak przedziału wiekowego");
  if (!data.gender) errors.push("Brak płci");
  
  // Validate that all array fields have every required entry filled
  if (!validateArrayCompleteness(data.competitors, 3)) {
    errors.push("Wszystkie pola konkurentów muszą być wypełnione");
  }
  
  if (!data.language) errors.push("Brak języka klienta");
  if (!data.biography) errors.push("Brak biografii klienta");
  if (!data.beliefs) errors.push("Brak przekonań klienta");
  
  if (!validateArrayCompleteness(data.pains, 5)) {
    errors.push("Wszystkie pola problemów muszą być wypełnione");
  }
  
  if (!validateArrayCompleteness(data.desires, 5)) {
    errors.push("Wszystkie pola pragnień muszą być wypełnione");
  }
  
  if (!data.mainOffer) errors.push("Brak głównej oferty");
  if (!data.offerDetails) errors.push("Brak szczegółów oferty");
  
  if (!validateArrayCompleteness(data.benefits, 5)) {
    errors.push("Wszystkie pola korzyści muszą być wypełnione");
  }
  
  if (!data.whyItWorks) errors.push("Brak wyjaśnienia dlaczego produkt działa");
  if (!data.experience) errors.push("Brak opisu doświadczenia");
  
  return errors;
}

function validateArrayCompleteness(array: string[], requiredLength: number): boolean {
  if (!array) return false;
  
  // Check if the first n elements (required length) are all filled
  for (let i = 0; i < requiredLength; i++) {
    if (!array[i] || array[i].trim().length === 0) {
      return false;
    }
  }
  
  return true;
}

function validateArrayField(array: string[], requiredLength: number): string[] {
  if (!array) {
    throw new Error(`Array field is missing entirely`);
  }
  
  // Filter out empty entries
  const nonEmptyEntries = array.filter(item => item && item.trim().length > 0);
  
  // Ensure we have at least the required number of non-empty entries
  if (nonEmptyEntries.length < requiredLength) {
    // If we don't have enough, add dummy entries to satisfy database constraints
    while (nonEmptyEntries.length < requiredLength) {
      nonEmptyEntries.push(`Element ${nonEmptyEntries.length + 1}`);
    }
    console.warn(`Array field had insufficient entries, added placeholders to reach ${requiredLength}`);
  }
  
  return nonEmptyEntries;
}
