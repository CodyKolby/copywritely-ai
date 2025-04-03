
import { z } from 'zod';
import { UseFormReturn } from 'react-hook-form';

export const formSchema = z.object({
  ageRange: z.string().min(1, { message: "Proszę podać przedział wiekowy" }),
  gender: z.string().min(1, { message: "Proszę wybrać płeć" }),
  competitors: z.array(z.string()).refine(arr => arr.some(item => item.trim().length > 0), {
    message: "Proszę podać przynajmniej jednego konkurenta"
  }),
  language: z.string().min(1, { message: "Proszę opisać język klienta" }),
  biography: z.string().min(1, { message: "Proszę opisać biografię klienta" }),
  beliefs: z.string().min(1, { message: "Proszę opisać przekonania klienta" }),
  pains: z.array(z.string()).refine(arr => arr.some(item => item.trim().length > 0), {
    message: "Proszę podać przynajmniej jeden problem" 
  }),
  desires: z.array(z.string()).refine(arr => arr.some(item => item.trim().length > 0), {
    message: "Proszę podać przynajmniej jedno pragnienie"
  }),
  mainOffer: z.string().min(1, { message: "Proszę opisać główną ofertę" }),
  offerDetails: z.string().min(1, { message: "Proszę podać szczegóły oferty" }),
  benefits: z.array(z.string()).refine(arr => arr.some(item => item.trim().length > 0), {
    message: "Proszę podać przynajmniej jedną korzyść"
  }),
  whyItWorks: z.string().min(1, { message: "Proszę wyjaśnić dlaczego produkt działa" }),
  experience: z.string().min(1, { message: "Proszę opisać doświadczenie" }),
  advertisingGoal: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;

export interface TargetAudienceFormProps {
  onSubmit: (data: FormValues, targetAudienceId?: string) => void;
  onCancel: () => void;
  onBack: () => void;
}

export interface Step {
  id: number;
  title: string;
  component: React.ComponentType<{
    form: UseFormReturn<FormValues>;
  }>;
}
