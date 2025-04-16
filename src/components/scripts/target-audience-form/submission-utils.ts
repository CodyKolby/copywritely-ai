
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
    console.log("Rozpoczynam zapisywanie danych grupy docelowej do bazy");
    console.log("Dane przed kompresją:", data);
    console.log("User ID:", userId);

    // Final validation to ensure all required fields are filled
    const validationErrors = validateFormCompleteness(data);
    if (validationErrors.length > 0) {
      const errorMessage = `Błąd walidacji: ${validationErrors.join(', ')}`;
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Remove advertisingGoal from the data before further processing
    const { advertisingGoal, ...cleanDataBeforeCompression } = data;
    console.log("Dane bez advertisingGoal przed kompresją:", cleanDataBeforeCompression);

    // Try to compress data, but don't fail if compression fails
    let compressedData = { ...cleanDataBeforeCompression };
    try {
      compressedData = await compressFormData(cleanDataBeforeCompression);
      console.log("Dane po kompresji przez AI:", compressedData);
    } catch (compressError) {
      console.warn("Błąd kompresji, używam oryginalnych danych:", compressError);
    }

    // First try to use the API method
    try {
      return await saveTargetAudience(compressedData, userId);
    } catch (apiError) {
      console.warn("API method failed, falling back to direct database insertion:", apiError);
    }

    // Tworzymy nazwę grupy docelowej, jeśli nie została podana
    const audienceName = data.name || `Grupa ${Math.floor(Math.random() * 1000) + 1}`;
    
    // Filter arrays but ensure they still contain all required elements
    const competitors = validateArrayField(compressedData.competitors || cleanDataBeforeCompression.competitors, 3);
    const pains = validateArrayField(compressedData.pains || cleanDataBeforeCompression.pains, 5);
    const desires = validateArrayField(compressedData.desires || cleanDataBeforeCompression.desires, 5);
    const benefits = validateArrayField(compressedData.benefits || cleanDataBeforeCompression.benefits, 5);
    
    // Przygotowanie danych do zapisu z odpowiednimi nazwami kolumn
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
    
    console.log("Dane przygotowane do zapisu w bazie (z poprawnymi nazwami kolumn):", targetAudienceData);
    
    // Try the insertion with three attempts
    let attempt = 0;
    const maxAttempts = 3;
    let lastError;
    
    while (attempt < maxAttempts) {
      attempt++;
      console.log(`Próba zapisania danych (${attempt}/${maxAttempts})...`);
      
      try {
        // Zapisanie danych do bazy - use direct Supabase client
        const { data: insertedData, error } = await supabase
          .from('target_audiences')
          .insert(targetAudienceData)
          .select('id')
          .single();
        
        if (error) {
          console.error(`Błąd podczas próby ${attempt}:`, error);
          lastError = error;
          // Wait a bit between attempts
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        
        console.log("Dane zostały zapisane pomyślnie. ID grupy docelowej:", insertedData.id);
        return insertedData.id;
      } catch (error: any) {
        console.error(`Nieoczekiwany błąd podczas próby ${attempt}:`, error);
        lastError = error;
        // Wait a bit between attempts
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.error(`Nie udało się zapisać danych po ${maxAttempts} próbach.`);
    throw lastError || new Error("Nie udało się zapisać danych grupy docelowej");
  } catch (error: any) {
    console.error("Nieoczekiwany błąd podczas zapisywania danych:", error);
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
  if (!array || !validateArrayCompleteness(array, requiredLength)) {
    throw new Error(`Pole tablicowe nie zawiera wszystkich ${requiredLength} wymaganych elementów`);
  }
  
  // Return only non-empty entries, but ensure we have at least the required number
  const nonEmptyEntries = array.filter(item => item.trim().length > 0);
  
  if (nonEmptyEntries.length < requiredLength) {
    throw new Error(`Pole tablicowe musi mieć co najmniej ${requiredLength} niepustych elementów`);
  }
  
  return nonEmptyEntries;
}
