
import { supabase } from '@/integrations/supabase/client';
import { FormValues } from './types';
import { toast } from 'sonner';

export const submitTargetAudienceForm = async (
  data: FormValues & { name?: string },
  userId: string
): Promise<string | undefined> => {
  try {
    console.log("Rozpoczynam zapisywanie danych grupy docelowej do bazy");
    console.log("Dane do zapisania:", data);
    console.log("User ID:", userId);

    // Tworzymy nazwę grupy docelowej, jeśli nie została podana
    const audienceName = data.name || `Grupa ${Math.floor(Math.random() * 1000) + 1}`;
    
    // Filter out empty strings from array fields
    const competitors = data.competitors.filter(item => item.trim().length > 0);
    const pains = data.pains.filter(item => item.trim().length > 0);
    const desires = data.desires.filter(item => item.trim().length > 0);
    const benefits = data.benefits.filter(item => item.trim().length > 0);
    
    // Ensure we have at least one item in each required array
    if (competitors.length === 0 || pains.length === 0 || desires.length === 0 || benefits.length === 0) {
      throw new Error("Wymagane pola tablicowe nie mogą być puste");
    }
    
    // Przygotowanie danych do zapisu
    const targetAudienceData = {
      user_id: userId,
      name: audienceName,
      age_range: data.ageRange,
      gender: data.gender,
      competitors: competitors,
      language: data.language,
      biography: data.biography,
      beliefs: data.beliefs,
      pains: pains,
      desires: desires,
      main_offer: data.mainOffer,
      offer_details: data.offerDetails,
      benefits: benefits,
      why_it_works: data.whyItWorks,
      experience: data.experience,
    };
    
    console.log("Dane przygotowane do zapisu w bazie:", targetAudienceData);
    
    // Zapisanie danych do bazy
    const { data: insertedData, error } = await supabase
      .from('target_audiences')
      .insert(targetAudienceData)
      .select('id')
      .single();
    
    if (error) {
      console.error("Błąd podczas zapisywania danych:", error);
      throw new Error(`Błąd podczas zapisywania danych: ${error.message}`);
    }
    
    console.log("Dane zostały zapisane pomyślnie. ID grupy docelowej:", insertedData.id);
    
    return insertedData.id;
  } catch (error) {
    console.error("Nieoczekiwany błąd podczas zapisywania danych:", error);
    throw error;
  }
};
