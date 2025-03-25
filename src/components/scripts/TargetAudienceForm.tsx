
import React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { HelpCircle } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';

// Define form schema
const formSchema = z.object({
  ageRange: z.string().min(1, { message: 'Proszę podać zakres wieku.' }),
  gender: z.enum(['male', 'female', 'any'], { 
    required_error: 'Proszę wybrać płeć.' 
  }),
  competitors: z.array(z.string()).length(3, { message: 'Proszę podać 3 konkurentów.' }),
  language: z.string().min(5, { message: 'Proszę opisać język klienta.' }),
  biography: z.string().min(10, { message: 'Proszę opisać biografię klienta.' }),
  beliefs: z.string().min(5, { message: 'Proszę podać przekonania do wdrożenia.' }),
  pains: z.array(z.string()).length(5, { message: 'Proszę podać 5 problemów/bóli.' }),
  desires: z.array(z.string()).length(5, { message: 'Proszę podać 5 marzeń/pragnień.' }),
  mainOffer: z.string().min(10, { message: 'Proszę opisać główną ofertę.' }),
  offerDetails: z.string().min(20, { message: 'Proszę rozwinąć ofertę.' }),
  benefits: z.array(z.string()).length(5, { message: 'Proszę podać 5 korzyści.' }),
  whyItWorks: z.string().min(20, { message: 'Proszę wyjaśnić, dlaczego produkt działa.' }),
  experience: z.string().min(20, { message: 'Proszę opisać doświadczenie.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface TargetAudienceFormProps {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
}

const InfoTooltip = ({ text }: { text: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" className="h-6 w-6 p-0 rounded-full hover:bg-slate-100">
        <HelpCircle className="h-4 w-4 text-slate-500" />
        <span className="sr-only">Info</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent className="max-w-sm text-sm">
      {text}
    </TooltipContent>
  </Tooltip>
);

const TargetAudienceForm = ({ onSubmit, onCancel }: TargetAudienceFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ageRange: '',
      gender: 'any',
      competitors: ['', '', ''],
      language: '',
      biography: '',
      beliefs: '',
      pains: ['', '', '', '', ''],
      desires: ['', '', '', '', ''],
      mainOffer: '',
      offerDetails: '',
      benefits: ['', '', '', '', ''],
      whyItWorks: '',
      experience: '',
    },
  });

  const handleSubmit = (data: FormValues) => {
    onSubmit(data);
  };

  return (
    <TooltipProvider>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* 1. Age Range */}
            <FormField
              control={form.control}
              name="ageRange"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel className="flex-1">Ile lat ma Twój idealny klient?</FormLabel>
                    <InfoTooltip text="Określ przybliżony zakres wieku Twoich idealnych klientów." />
                  </div>
                  <FormControl>
                    <Input placeholder="np. 25-45" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2. Gender */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <div className="flex items-center">
                    <FormLabel className="flex-1">Jakiej płci jest Twój idealny klient?</FormLabel>
                    <InfoTooltip text="Wybierz płeć Twojego idealnego klienta." />
                  </div>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male">Mężczyzna</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female">Kobieta</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="any" id="any" />
                        <Label htmlFor="any">Nie ma znaczenia</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 3. Competitors */}
            <div>
              <div className="flex items-center mb-2">
                <Label className="flex-1 text-sm font-medium">Wymień 3 Twoich głównych konkurentów.</Label>
                <InfoTooltip text="Wymień 3 swoich konkurentów, opisz jaki problem rozwiązują, w jaki sposób pracują i dlaczego to co robią jest niewystarczające lub jakie są problemy z ich usługami/produktami." />
              </div>
              <div className="space-y-3">
                {[0, 1, 2].map((index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name={`competitors.${index}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder={`Konkurent ${index + 1} - co oferuje, problemy z produktami/usługami`} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* 4. Client Language */}
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel className="flex-1">Specyficzny język używany przez twojego klienta</FormLabel>
                    <InfoTooltip text="Zastanów się, jak Twoi klienci mówią o swoim problemie 'na głos' – w wiadomościach, komentarzach, rozmowach, mailach. Nie chodzi o to, jak Ty byś to opisał – ale o ich potoczny, surowy język. Bez filtrowania." />
                  </div>
                  <FormControl>
                    <Textarea 
                      placeholder='np. "nie mam siły", "Czuję się wypalona", "Mam dość bycia pomijaną"' 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 5. Client Biography */}
            <FormField
              control={form.control}
              name="biography"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel className="flex-1">Biografia klienta</FormLabel>
                    <InfoTooltip text="Opisz swojego klienta - szablonową historię która go doprowadza do momentu gdzie potrzebuje Twojej pomocy i ma problem który rozwiązujesz." />
                  </div>
                  <FormControl>
                    <Textarea 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 6. Beliefs to Implement */}
            <FormField
              control={form.control}
              name="beliefs"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel className="flex-1">Przekonania do wdrożenia</FormLabel>
                    <InfoTooltip text="Jakie przekonania musi nabyć by rozwiązać swój problem." />
                  </div>
                  <FormControl>
                    <Textarea 
                      placeholder='"Nie musisz być idealny, żeby zacząć", "Można budować dochodowy biznes bez rezygnowania z etatu"' 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 7. Client Pains/Problems */}
            <div>
              <div className="flex items-center mb-2">
                <Label className="flex-1 text-sm font-medium">Jakie bóle/problemy odczuwa Twój klient na co dzień?</Label>
                <InfoTooltip text="Jakie są główne bóle, problemy w jego biznesie/życiu, które chciałby rozwiązać a związane są z Twoją usługa czy produktem. Wymień 5 i uporządkuj od najważniejszego do najmniej ważnego. Co muszą naprawić, rozwiązać tu i teraz, żeby poprawić swoją sytuację." />
              </div>
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name={`pains.${index}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder={index === 0 ? "Brak klientów" : index === 1 ? "Niepewność finansowa" : "Niskie poczucie wartości"} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* 8. Client Dreams/Desires */}
            <div>
              <div className="flex items-center mb-2">
                <Label className="flex-1 text-sm font-medium">O czym marzy, co pragnie zmienić tu i teraz?</Label>
                <InfoTooltip text="Jakie są główne ich pragnienia, których szybkie osiągnięcie znacznie poprawi ich sytuacje, są to elementy które chcieliby by wydarzyły się już jak najszybciej, co da im największa różnicę, wzrost, zysk. Wymień 5 i uporządkuj od najważniejszego do najmniej ważnego." />
              </div>
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name={`desires.${index}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder={
                              index === 0 ? "Chcę zarabiać więcej, ale bez pracy po nocach" : 
                              index === 1 ? "Chcę znów poczuć się atrakcyjna" : 
                              "Stały, przewidywalny napływ leadów"
                            } 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* 9. Main Offer */}
            <FormField
              control={form.control}
              name="mainOffer"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel className="flex-1">Jak brzmi Twoja główna oferta?</FormLabel>
                    <InfoTooltip text="Wytłumacz nam konkretnie, komu pomagasz, z jakim konkretnym problemem i w jaki konkretny sposób to robisz. Bez ogólników, bez lania wody – jedno zdanie, które pokazuje, co robisz i dla kogo." />
                  </div>
                  <FormControl>
                    <Textarea 
                      placeholder="Pomagam kobietom po 30. odzyskać energię i zbudować pewność siebie dzięki spersonalizowanemu planowi treningowemu." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 10. Offer Details */}
            <FormField
              control={form.control}
              name="offerDetails"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel className="flex-1">Rozwiń, co dokładnie oferujesz?</FormLabel>
                    <InfoTooltip text="Napisz prostym językiem – jakbyś tłumaczył znajomemu: co robisz, jak pracujesz, z kim itd." />
                  </div>
                  <FormControl>
                    <Textarea 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 11. Client Benefits */}
            <div>
              <div className="flex items-center mb-2">
                <Label className="flex-1 text-sm font-medium">Jakie korzyści klient otrzyma w ramach twojego programu/współpracy?</Label>
                <InfoTooltip text="Opisz, co realnie zyska dzięki współpracy z Tobą. Jakie efekty, jakie ułatwienia, czego uniknie, co zrobi lepiej, szybciej, mądrzej. Skup się na konkretach, które mają dla niego znaczenie." />
              </div>
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name={`benefits.${index}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder={
                              index === 0 ? "Otrzymasz indywidualny plan działania" : 
                              index === 1 ? "Unikniesz kosztownych błędów" : 
                              index === 2 ? "Zbudujesz portfolio realnych projektów" :
                              "Otrzymasz natychmiastowe wsparcie w krytycznych momentach"
                            } 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* 12. Why Product Works */}
            <FormField
              control={form.control}
              name="whyItWorks"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel className="flex-1">Dlaczego twój produkt działa tak dobrze?</FormLabel>
                    <InfoTooltip text="Wyjaśnij, co sprawia, że Twoja oferta przynosi efekty. Konkretne podejście, sposób pracy, doświadczenie, struktura procesu, sposób wdrażania wiedzy, cokolwiek, co sprawia, że klient osiąga rezultaty szybciej, skuteczniej lub trwalej niż gdzie indziej." />
                  </div>
                  <FormControl>
                    <Textarea 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 13. Experience */}
            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel className="flex-1">Jakie masz doświadczenie w tej branży?</FormLabel>
                    <InfoTooltip text="Wytłumacz, dlaczego klienci mieliby Ci zaufać. Napisz, ile lat działasz w tej branży, jakie masz na koncie konkretne wyniki, z kim pracowałeś, jakie projekty zrealizowałeś." />
                  </div>
                  <FormControl>
                    <Textarea 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Anuluj
            </Button>
            <Button type="submit">
              Zapisz i kontynuuj
            </Button>
          </div>
        </form>
      </Form>
    </TooltipProvider>
  );
};

export default TargetAudienceForm;
