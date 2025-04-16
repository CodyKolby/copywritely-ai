
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
    // Add longer delay to simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
    
    // Simulate more sophisticated language processing
    // In a real implementation, an AI would optimize these fields
    
    // Add a simulated "AI comprehension" step
    console.log("Performing AI comprehension analysis...");
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a production implementation, this would be where AI would:
    // 1. Remove redundant information
    // 2. Extract key concepts
    // 3. Optimize language for marketing effectiveness
    // 4. Ensure consistent tone
    // 5. Remove irrelevant details
    
    console.log("Data compression process completed");
    
    return result;
  } catch (error) {
    console.error("Error during data compression:", error);
    // On error, return the original data to avoid blocking the flow
    return data;
  }
};
