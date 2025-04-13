
import { FormValues } from './types';

// Kompresja danych formularza - symulacja procesu kompresji
export const compressFormData = async (data: any): Promise<any> => {
  try {
    console.log("Rozpoczynam kompresję danych formularza");
    
    // Ensure we strip out any advertisingGoal field
    const { advertisingGoal, ...dataWithoutAdvertisingGoal } = data;
    
    // Symulacja opóźnienia procesu kompresji - w rzeczywistych warunkach
    // tutaj byłoby wywołanie API AI lub innej usługi kompresującej dane
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Process each field
    const result = { ...dataWithoutAdvertisingGoal };
    
    // Example of field compression (simulated)
    console.log("Kompresja pola offerDetails rozpoczęta");
    if (result.offerDetails) {
      result.offerDetails = result.offerDetails.trim();
    }
    console.log("Kompresja pola offerDetails zakończona pomyślnie");
    
    console.log("Kompresja pola language rozpoczęta");
    if (result.language) {
      result.language = result.language.trim();
    }
    console.log("Kompresja pola language zakończona pomyślnie");
    
    console.log("Kompresja pola beliefs rozpoczęta");
    if (result.beliefs) {
      result.beliefs = result.beliefs.trim();
    }
    console.log("Kompresja pola beliefs zakończona pomyślnie");
    
    console.log("Kompresja pola biography rozpoczęta");
    if (result.biography) {
      result.biography = result.biography.trim();
    }
    console.log("Kompresja pola biography zakończona pomyślnie");
    
    console.log("Kompresja pola competitors rozpoczęta");
    if (result.competitors) {
      result.competitors = result.competitors.map((item: string) => item.trim());
    }
    console.log("Kompresja pola competitors zakończona pomyślnie");
    
    console.log("Kompresja pola whyItWorks rozpoczęta");
    if (result.whyItWorks) {
      result.whyItWorks = result.whyItWorks.trim();
    }
    console.log("Kompresja pola whyItWorks zakończona pomyślnie");
    
    console.log("Kompresja pola experience rozpoczęta");
    if (result.experience) {
      result.experience = result.experience.trim();
    }
    console.log("Kompresja pola experience zakończona pomyślnie");
    
    console.log("Kompresja danych formularza zakończona");
    
    return result;
  } catch (error) {
    console.error("Błąd podczas kompresji danych:", error);
    // On error, return the original data to avoid blocking the flow
    return data;
  }
};
