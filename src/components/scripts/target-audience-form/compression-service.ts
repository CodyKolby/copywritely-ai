
import { FormValues } from './types';

/**
 * Utility function to compress form data using text processing techniques
 * This simulates what would typically be done by an AI/NLP service in production
 */
export const compressFormData = async (data: any): Promise<any> => {
  try {
    console.log("Beginning data compression process");
    
    // Ensure we strip out any advertisingGoal field
    const { advertisingGoal, ...dataWithoutAdvertisingGoal } = data;
    
    // This would typically be an API call to an AI service
    // Here we're just simulating the delay and doing some basic compression
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a deep copy to avoid mutating the original data
    const result = JSON.parse(JSON.stringify(dataWithoutAdvertisingGoal));
    
    // Process text fields - trim whitespace and remove duplicate spaces
    if (result.mainOffer) {
      result.mainOffer = result.mainOffer.trim().replace(/\s+/g, ' ');
      console.log("Compressed mainOffer:", result.mainOffer);
    }
    
    if (result.offerDetails) {
      result.offerDetails = result.offerDetails.trim().replace(/\s+/g, ' ');
      console.log("Compressed offerDetails:", result.offerDetails);
    }
    
    if (result.language) {
      result.language = result.language.trim().replace(/\s+/g, ' ');
    }
    
    if (result.biography) {
      result.biography = result.biography.trim().replace(/\s+/g, ' ');
      console.log("Compressed biography:", result.biography);
    }
    
    if (result.beliefs) {
      result.beliefs = result.beliefs.trim().replace(/\s+/g, ' ');
      console.log("Compressed beliefs:", result.beliefs);
    }
    
    if (result.whyItWorks) {
      result.whyItWorks = result.whyItWorks.trim().replace(/\s+/g, ' ');
      console.log("Compressed whyItWorks:", result.whyItWorks);
    }
    
    if (result.experience) {
      result.experience = result.experience.trim().replace(/\s+/g, ' ');
      console.log("Compressed experience:", result.experience);
    }
    
    // Process array fields - trim each item and filter empty ones
    if (Array.isArray(result.competitors)) {
      result.competitors = result.competitors
        .map((item: string) => item?.trim().replace(/\s+/g, ' ') || "")
        .filter(Boolean);
      console.log("Compressed competitors:", result.competitors);
    }
    
    if (Array.isArray(result.pains)) {
      result.pains = result.pains
        .map((item: string) => item?.trim().replace(/\s+/g, ' ') || "")
        .filter(Boolean);
      console.log("Compressed pains:", result.pains);
    }
    
    if (Array.isArray(result.desires)) {
      result.desires = result.desires
        .map((item: string) => item?.trim().replace(/\s+/g, ' ') || "")
        .filter(Boolean);
      console.log("Compressed desires:", result.desires);
    }
    
    if (Array.isArray(result.benefits)) {
      result.benefits = result.benefits
        .map((item: string) => item?.trim().replace(/\s+/g, ' ') || "")
        .filter(Boolean);
      console.log("Compressed benefits:", result.benefits);
    }
    
    console.log("Data compression process completed");
    
    // In a real implementation, this is where AI would summarize/compress the data
    return result;
  } catch (error) {
    console.error("Error during data compression:", error);
    // On error, return the original data to avoid blocking the flow
    return data;
  }
};
