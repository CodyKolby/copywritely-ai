
import { z } from 'zod';

export const formSchema = z.object({
  ageRange: z.string().min(1, { message: "Proszę wybrać przedział wiekowy" }),
  gender: z.string(),
  competitors: z.array(z.string()).min(3),
  language: z.string().min(1, { message: "Proszę podać język" }),
  biography: z.string().min(10, { message: "Proszę podać więcej szczegółów" }),
  beliefs: z.string().min(10, { message: "Proszę podać więcej szczegółów" }),
  pains: z.array(z.string()).min(5),
  desires: z.array(z.string()).min(5),
  mainOffer: z.string().min(10, { message: "Proszę podać więcej szczegółów" }),
  offerDetails: z.string().min(10, { message: "Proszę podać więcej szczegółów" }),
  benefits: z.array(z.string()).min(5),
  whyItWorks: z.string().min(10, { message: "Proszę podać więcej szczegółów" }),
  experience: z.string().min(10, { message: "Proszę podać więcej szczegółów" }),
});

export type FormValues = z.infer<typeof formSchema>;

export interface TargetAudienceFormProps {
  onSubmit: (data: FormValues, targetAudienceId?: string) => void;
  onCancel: () => void;
  onBack: () => void;
}
