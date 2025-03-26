
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
        if (!isValid) {
          form.setError('ageRange', {
            type: 'manual',
            message: 'Proszę wybrać przedział wiekowy'
          });
        }
        break;
      case 2:
        isValid = await form.trigger('gender');
        if (!isValid) {
          form.setError('gender', {
            type: 'manual',
            message: 'Proszę wybrać płeć'
          });
        }
        break;
      case 3:
        // Validate each competitor field individually
        const competitors = form.getValues('competitors');
        let allCompetitorsValid = true;
        
        for (let i = 0; i < competitors.length; i++) {
          if (!competitors[i] || competitors[i].trim() === '') {
            form.setError(`competitors.${i}`, {
              type: 'manual',
              message: `Proszę wypełnić pole konkurenta ${i + 1}`
            });
            allCompetitorsValid = false;
          }
        }
        
        isValid = allCompetitorsValid;
        break;
      case 4:
        isValid = await form.trigger('language');
        if (!isValid) {
          form.setError('language', {
            type: 'manual',
            message: 'Proszę podać język używany przez klienta'
          });
        }
        break;
      case 5:
        isValid = await form.trigger('biography');
        if (!isValid) {
          form.setError('biography', {
            type: 'manual',
            message: 'Proszę podać biografię klienta'
          });
        }
        break;
      case 6:
        isValid = await form.trigger('beliefs');
        if (!isValid) {
          form.setError('beliefs', {
            type: 'manual',
            message: 'Proszę podać przekonania do wdrożenia'
          });
        }
        break;
      case 7:
        // Validate each pain field individually
        const pains = form.getValues('pains');
        let allPainsValid = true;
        
        for (let i = 0; i < pains.length; i++) {
          if (!pains[i] || pains[i].trim() === '') {
            form.setError(`pains.${i}`, {
              type: 'manual',
              message: `Proszę wypełnić pole problemu ${i + 1}`
            });
            allPainsValid = false;
          }
        }
        
        isValid = allPainsValid;
        break;
      case 8:
        // Validate each desire field individually
        const desires = form.getValues('desires');
        let allDesiresValid = true;
        
        for (let i = 0; i < desires.length; i++) {
          if (!desires[i] || desires[i].trim() === '') {
            form.setError(`desires.${i}`, {
              type: 'manual',
              message: `Proszę wypełnić pole pragnienia ${i + 1}`
            });
            allDesiresValid = false;
          }
        }
        
        isValid = allDesiresValid;
        break;
      case 9:
        isValid = await form.trigger('mainOffer');
        if (!isValid) {
          form.setError('mainOffer', {
            type: 'manual',
            message: 'Proszę podać główną ofertę'
          });
        }
        break;
      case 10:
        isValid = await form.trigger('offerDetails');
        if (!isValid) {
          form.setError('offerDetails', {
            type: 'manual',
            message: 'Proszę podać szczegóły oferty'
          });
        }
        break;
      case 11:
        // Validate each benefit field individually
        const benefits = form.getValues('benefits');
        let allBenefitsValid = true;
        
        for (let i = 0; i < benefits.length; i++) {
          if (!benefits[i] || benefits[i].trim() === '') {
            form.setError(`benefits.${i}`, {
              type: 'manual',
              message: `Proszę wypełnić pole korzyści ${i + 1}`
            });
            allBenefitsValid = false;
          }
        }
        
        isValid = allBenefitsValid;
        break;
      case 12:
        isValid = await form.trigger('whyItWorks');
        if (!isValid) {
          form.setError('whyItWorks', {
            type: 'manual',
            message: 'Proszę wyjaśnić dlaczego produkt działa'
          });
        }
        break;
      case 13:
        isValid = await form.trigger('experience');
        if (!isValid) {
          form.setError('experience', {
            type: 'manual',
            message: 'Proszę podać swoje doświadczenie'
          });
        }
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
