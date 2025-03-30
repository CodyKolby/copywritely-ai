
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from './types';

export async function validateStep(step: number, form: UseFormReturn<FormValues>): Promise<boolean> {
  try {
    const fields = getFieldsForStep(step);
    
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
