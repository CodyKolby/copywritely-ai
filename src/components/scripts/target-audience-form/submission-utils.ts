
import { FormValues } from './types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Submits the target audience form data to Supabase
 * @param data The form data to submit
 * @param userId The ID of the current user
 * @returns The ID of the created target audience, or undefined if there was an error
 */
export const submitTargetAudienceForm = async (
  data: FormValues,
  userId: string
): Promise<string | undefined> => {
  try {
    if (!userId) {
      console.error("No user ID found");
      toast.error('Nie znaleziono identyfikatora użytkownika');
      return undefined;
    }
    
    // Auto-generate a name for the target audience if not provided
    const audienceName = `Grupa docelowa - ${data.ageRange}, ${data.gender}`;
    
    // Insert data into Supabase
    const { data: insertedData, error } = await supabase
      .from('target_audiences')
      .insert({
        name: audienceName,
        user_id: userId,
        age_range: data.ageRange,
        gender: data.gender,
        competitors: data.competitors,
        language: data.language,
        biography: data.biography,
        beliefs: data.beliefs,
        pains: data.pains,
        desires: data.desires,
        main_offer: data.mainOffer,
        offer_details: data.offerDetails,
        benefits: data.benefits,
        why_it_works: data.whyItWorks,
        experience: data.experience
      })
      .select();
    
    if (error) {
      console.error("Error saving to Supabase:", error);
      toast.error('Wystąpił błąd podczas zapisywania danych');
      return undefined;
    }
    
    console.log("Data saved to Supabase:", insertedData);
    toast.success('Dane zostały zapisane');
    
    // Return the created audience ID
    if (insertedData && insertedData.length > 0) {
      return insertedData[0].id;
    }
    
    return undefined;
  } catch (error) {
    console.error("Form submission error:", error);
    toast.error('Wystąpił błąd podczas wysyłania formularza');
    return undefined;
  }
};
