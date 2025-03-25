
import { FormValues } from './types';

/**
 * Validates a specific step in the target audience form
 * @param currentStep The current step to validate
 * @param form The form object containing the form data and methods
 * @returns A boolean indicating if the validation passed
 */
export const validateStep = async (
  currentStep: number, 
  form: any
): Promise<boolean> => {
  try {
    let isValid = false;
      
    // Define validation logic based on current step
    switch (currentStep) {
      case 1:
        isValid = await form.trigger('ageRange');
        break;
      case 2:
        isValid = await form.trigger('gender');
        break;
      case 3:
        // Validate all three competitor fields
        isValid = await form.trigger('competitors');
        // Additional check for each individual competitor field
        const competitors = form.getValues('competitors');
        if (competitors.some(comp => !comp || comp.trim() === '')) {
          isValid = false;
          form.setError('competitors', {
            type: 'manual',
            message: 'Proszę wypełnić wszystkie pola konkurentów'
          });
        }
        break;
      case 4:
        isValid = await form.trigger('language');
        break;
      case 5:
        isValid = await form.trigger('biography');
        break;
      case 6:
        isValid = await form.trigger('beliefs');
        break;
      case 7:
        // Validate all pain fields
        isValid = await form.trigger('pains');
        const pains = form.getValues('pains');
        if (pains.some(pain => !pain || pain.trim() === '')) {
          isValid = false;
          form.setError('pains', {
            type: 'manual',
            message: 'Proszę wypełnić wszystkie pola problemów'
          });
        }
        break;
      case 8:
        // Validate all desire fields
        isValid = await form.trigger('desires');
        const desires = form.getValues('desires');
        if (desires.some(desire => !desire || desire.trim() === '')) {
          isValid = false;
          form.setError('desires', {
            type: 'manual',
            message: 'Proszę wypełnić wszystkie pola pragnień'
          });
        }
        break;
      case 9:
        isValid = await form.trigger('mainOffer');
        break;
      case 10:
        isValid = await form.trigger('offerDetails');
        break;
      case 11:
        // Validate all benefit fields
        isValid = await form.trigger('benefits');
        const benefits = form.getValues('benefits');
        if (benefits.some(benefit => !benefit || benefit.trim() === '')) {
          isValid = false;
          form.setError('benefits', {
            type: 'manual',
            message: 'Proszę wypełnić wszystkie pola korzyści'
          });
        }
        break;
      case 12:
        isValid = await form.trigger('whyItWorks');
        break;
      case 13:
        isValid = await form.trigger('experience');
        break;
      default:
        break;
    }

    return isValid;
  } catch (error) {
    console.error("Validation error:", error);
    return false;
  }
};
