
import { z } from 'zod';

export const formSchema = z.object({
  ageRange: z.string().min(1, { message: "Proszę wybrać przedział wiekowy" }),
  gender: z.string().min(1, { message: "Proszę wybrać płeć" }),
  competitors: z.array(z.string().min(1, { message: "Proszę wypełnić to pole" })),
  language: z.string().min(1, { message: "Proszę podać język używany przez klienta" }),
  biography: z.string().min(10, { message: "Proszę podać więcej szczegółów w biografii" }),
  beliefs: z.string().min(10, { message: "Proszę podać więcej szczegółów o przekonaniach" }),
  pains: z.array(z.string().min(1, { message: "Proszę wypełnić to pole" })),
  desires: z.array(z.string().min(1, { message: "Proszę wypełnić to pole" })),
  mainOffer: z.string().min(10, { message: "Proszę podać więcej szczegółów o głównej ofercie" }),
  offerDetails: z.string().min(10, { message: "Proszę podać więcej szczegółów oferty" }),
  benefits: z.array(z.string().min(1, { message: "Proszę wypełnić to pole" })),
  whyItWorks: z.string().min(10, { message: "Proszę wyjaśnić dlaczego produkt działa" }),
  experience: z.string().min(10, { message: "Proszę podać więcej szczegółów o doświadczeniu" }),
});

export type FormValues = z.infer<typeof formSchema>;

export interface TargetAudienceFormProps {
  onSubmit: (data: FormValues, targetAudienceId?: string) => void;
  onCancel: () => void;
  onBack: () => void;
}
