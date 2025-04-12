
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from './types';

export async function validateStep(step: number, form: UseFormReturn<FormValues>): Promise<boolean> {
  try {
    const fields = getFieldsForStep(step);
    
    // For array fields, validate all items are filled
    if (step === 3 || step === 7 || step === 8 || step === 11) {
      const values = form.getValues();
      
      // Check which step we're on and validate the corresponding array
      if (step === 3) { // Competitors
        const competitors = values.competitors;
        // Check if all competitors fields are filled (all 3 required)
        if (!competitors.every((item, index) => index >= 3 || item.trim().length > 0)) {
          form.setError('competitors.0', { 
            type: 'manual', 
            message: 'Proszę wypełnić wszystkie pola konkurentów' 
          });
          return false;
        }
      } 
      else if (step === 7) { // Pains
        const pains = values.pains;
        // Check if all pains fields are filled (all 5 required)
        if (!pains.every((item, index) => index >= 5 || item.trim().length > 0)) {
          form.setError('pains.0', { 
            type: 'manual', 
            message: 'Proszę wypełnić wszystkie pola problemów' 
          });
          return false;
        }
      }
      else if (step === 8) { // Desires
        const desires = values.desires;
        // Check if all desires fields are filled (all 5 required)
        if (!desires.every((item, index) => index >= 5 || item.trim().length > 0)) {
          form.setError('desires.0', { 
            type: 'manual', 
            message: 'Proszę wypełnić wszystkie pola pragnień' 
          });
          return false;
        }
      }
      else if (step === 11) { // Benefits
        const benefits = values.benefits;
        // Check if all benefits fields are filled (all 5 required)
        if (!benefits.every((item, index) => index >= 5 || item.trim().length > 0)) {
          form.setError('benefits.0', { 
            type: 'manual', 
            message: 'Proszę wypełnić wszystkie pola korzyści' 
          });
          return false;
        }
      }
    }
    
    // For non-array fields, use the normal trigger
    const result = await form.trigger(fields as any);
    return result;
  } catch (error) {
    console.error("Error in validateStep:", error);
    return false;
  }
}

function getFieldsForStep(step: number): (keyof FormValues)[] {
  switch (step) {
    case 1:
      return ['ageRange'];
    case 2:
      return ['gender'];
    case 3:
      return ['competitors'];
    case 4:
      return ['language'];
    case 5:
      return ['biography'];
    case 6:
      return ['beliefs'];
    case 7:
      return ['pains'];
    case 8:
      return ['desires'];
    case 9:
      return ['mainOffer'];
    case 10:
      return ['offerDetails'];
    case 11:
      return ['benefits'];
    case 12:
      return ['whyItWorks'];
    case 13:
      return ['experience'];
    default:
      return [];
  }
}
