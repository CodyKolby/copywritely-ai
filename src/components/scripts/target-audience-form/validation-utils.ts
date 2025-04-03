
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from './types';

export async function validateStep(step: number, form: UseFormReturn<FormValues>): Promise<boolean> {
  try {
    const fields = getFieldsForStep(step);
    
    // For array fields, validate at least one item is not empty
    if (step === 3 || step === 7 || step === 8 || step === 11) {
      const values = form.getValues();
      
      // Check which step we're on and validate the corresponding array
      if (step === 3) { // Competitors
        const competitors = values.competitors;
        if (!competitors.some(item => item.trim().length > 0)) {
          form.setError('competitors.0', { 
            type: 'manual', 
            message: 'Proszę podać przynajmniej jednego konkurenta' 
          });
          return false;
        }
      } 
      else if (step === 7) { // Pains
        const pains = values.pains;
        if (!pains.some(item => item.trim().length > 0)) {
          form.setError('pains.0', { 
            type: 'manual', 
            message: 'Proszę podać przynajmniej jeden problem' 
          });
          return false;
        }
      }
      else if (step === 8) { // Desires
        const desires = values.desires;
        if (!desires.some(item => item.trim().length > 0)) {
          form.setError('desires.0', { 
            type: 'manual', 
            message: 'Proszę podać przynajmniej jedno pragnienie' 
          });
          return false;
        }
      }
      else if (step === 11) { // Benefits
        const benefits = values.benefits;
        if (!benefits.some(item => item.trim().length > 0)) {
          form.setError('benefits.0', { 
            type: 'manual', 
            message: 'Proszę podać przynajmniej jedną korzyść' 
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
