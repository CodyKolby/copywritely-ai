
import { z } from 'zod';

// Define form schema
export const formSchema = z.object({
  ageRange: z.string().min(1, { message: 'Proszę podać zakres wieku.' }),
  gender: z.enum(['male', 'female', 'any'], { 
    required_error: 'Proszę wybrać płeć.' 
  }),
  competitors: z.array(z.string().min(1, { message: 'To pole jest wymagane' }))
    .length(3, { message: 'Proszę podać 3 konkurentów.' }),
  language: z.string().min(5, { message: 'Proszę opisać język klienta.' }),
  biography: z.string().min(10, { message: 'Proszę opisać biografię klienta.' }),
  beliefs: z.string().min(5, { message: 'Proszę podać przekonania do wdrożenia.' }),
  pains: z.array(z.string().min(1, { message: 'To pole jest wymagane' }))
    .length(5, { message: 'Proszę podać 5 problemów/bóli.' }),
  desires: z.array(z.string().min(1, { message: 'To pole jest wymagane' }))
    .length(5, { message: 'Proszę podać 5 marzeń/pragnień.' }),
  mainOffer: z.string().min(10, { message: 'Proszę opisać główną ofertę.' }),
  offerDetails: z.string().min(20, { message: 'Proszę rozwinąć ofertę.' }),
  benefits: z.array(z.string().min(1, { message: 'To pole jest wymagane' }))
    .length(5, { message: 'Proszę podać 5 korzyści.' }),
  whyItWorks: z.string().min(20, { message: 'Proszę wyjaśnić, dlaczego produkt działa.' }),
  experience: z.string().min(20, { message: 'Proszę opisać doświadczenie.' }),
});

export type FormValues = z.infer<typeof formSchema>;

export interface TargetAudienceFormProps {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  onBack: () => void;
}
