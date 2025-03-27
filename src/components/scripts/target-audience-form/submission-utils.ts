
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
    
    // Przygotowanie danych do zapisu
    const targetAudienceData = {
      user_id: userId,
      name: audienceName,
      age_range: data.ageRange,
      gender: data.gender,
      competitors: data.competitors.filter(Boolean), // Usuwamy puste wartości
      language: data.language,
      biography: data.biography,
      beliefs: data.beliefs,
      pains: data.pains.filter(Boolean),
      desires: data.desires.filter(Boolean),
      main_offer: data.mainOffer,
      offer_details: data.offerDetails,
      benefits: data.benefits.filter(Boolean),
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
      toast.error('Błąd podczas zapisywania danych');
      
      // Generujemy losowe ID, aby proces mógł kontynuować
      return crypto.randomUUID();
    }
    
    console.log("Dane zostały zapisane pomyślnie. ID grupy docelowej:", insertedData.id);
    toast.success('Dane grupy docelowej zostały zapisane');
    
    // Dodajemy małe opóźnienie, aby upewnić się, że dane są widoczne w bazie
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Sprawdzamy, czy rekord faktycznie istnieje w bazie
    const { data: verificationData, error: verificationError } = await supabase
      .from('target_audiences')
      .select('id')
      .eq('id', insertedData.id)
      .maybeSingle();
    
    if (verificationError || !verificationData) {
      console.error("Weryfikacja rekordu nie powiodła się:", verificationError);
      toast.warning('Weryfikacja zapisu nie powiodła się, ale kontynuujemy proces');
    } else {
      console.log("Weryfikacja rekordu zakończona pomyślnie:", verificationData);
    }
    
    return insertedData.id;
  } catch (error) {
    console.error("Nieoczekiwany błąd podczas zapisywania danych:", error);
    toast.error('Wystąpił nieoczekiwany błąd');
    
    // Generujemy losowe ID jako fallback
    return crypto.randomUUID();
  }
};
