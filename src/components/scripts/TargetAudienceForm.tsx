
import React, { useState, KeyboardEvent, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
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
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Tabs, TabsContent } from '@/components/ui/tabs';

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
  onBack: () => void;
}

const InfoTooltip = ({ text }: { text: string }) => (
  <TooltipProvider>
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
  </TooltipProvider>
);

const TOTAL_STEPS = 13;

const TargetAudienceForm = ({ onSubmit, onCancel, onBack }: TargetAudienceFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  
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
    mode: 'onChange',
  });

  const currentValues = useWatch({
    control: form.control
  });

  const goToNextStep = async () => {
    // Check validity of current step
    let isValid = true;

    switch (currentStep) {
      case 1: // Age Range
        isValid = await form.trigger('ageRange');
        break;
      case 2: // Gender
        isValid = await form.trigger('gender');
        break;
      case 3: // Competitors
        isValid = await form.trigger('competitors');
        break;
      case 4: // Language
        isValid = await form.trigger('language');
        break;
      case 5: // Biography
        isValid = await form.trigger('biography');
        break;
      case 6: // Beliefs
        isValid = await form.trigger('beliefs');
        break;
      case 7: // Pains
        isValid = await form.trigger('pains');
        break;
      case 8: // Desires
        isValid = await form.trigger('desires');
        break;
      case 9: // Main Offer
        isValid = await form.trigger('mainOffer');
        break;
      case 10: // Offer Details
        isValid = await form.trigger('offerDetails');
        break;
      case 11: // Benefits
        isValid = await form.trigger('benefits');
        break;
      case 12: // Why It Works
        isValid = await form.trigger('whyItWorks');
        break;
      case 13: // Experience
        isValid = await form.trigger('experience');
        break;
    }

    if (isValid) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(currentStep + 1);
      } else {
        // Submit the form if we're on the last step
        form.handleSubmit(handleSubmit)();
      }
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const handleSubmit = (data: FormValues) => {
    onSubmit(data);
  };

  // Handle Enter key press to navigate to the next step
  const handleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      goToNextStep();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <FormField
            control={form.control}
            name="ageRange"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel className="flex-1 text-lg font-medium">Ile lat ma Twój idealny klient?</FormLabel>
                  <InfoTooltip text="Określ przybliżony zakres wieku Twoich idealnych klientów." />
                </div>
                <FormControl>
                  <Input placeholder="np. 25-45" {...field} className="mt-2" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 2:
        return (
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <div className="flex items-center">
                  <FormLabel className="flex-1 text-lg font-medium">Jakiej płci jest Twój idealny klient?</FormLabel>
                  <InfoTooltip text="Wybierz płeć Twojego idealnego klienta." />
                </div>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="space-y-3 mt-4"
                  >
                    <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-slate-50">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="flex-1 cursor-pointer">Mężczyzna</Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-slate-50">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="flex-1 cursor-pointer">Kobieta</Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-slate-50">
                      <RadioGroupItem value="any" id="any" />
                      <Label htmlFor="any" className="flex-1 cursor-pointer">Nie ma znaczenia</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 3:
        return (
          <div>
            <div className="flex items-center mb-4">
              <Label className="flex-1 text-lg font-medium">Wymień 3 Twoich głównych konkurentów.</Label>
              <InfoTooltip text="Wymień 3 swoich konkurentów, opisz jaki problem rozwiązują, w jaki sposób pracują i dlaczego to co robią jest niewystarczające lub jakie są problemy z ich usługami/produktami." />
            </div>
            <div className="space-y-4">
              {[0, 1, 2].map((index) => (
                <FormField
                  key={index}
                  control={form.control}
                  name={`competitors.${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Konkurent {index + 1}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={`Co oferuje, problemy z produktami/usługami`} 
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
        );
      case 4:
        return (
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel className="flex-1 text-lg font-medium">Specyficzny język używany przez twojego klienta</FormLabel>
                  <InfoTooltip text="Zastanów się, jak Twoi klienci mówią o swoim problemie 'na głos' – w wiadomościach, komentarzach, rozmowach, mailach. Nie chodzi o to, jak Ty byś to opisał – ale o ich potoczny, surowy język. Bez filtrowania." />
                </div>
                <FormControl>
                  <Textarea 
                    placeholder='np. "nie mam siły", "Czuję się wypalona", "Mam dość bycia pomijaną"' 
                    {...field} 
                    className="mt-2"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 5:
        return (
          <FormField
            control={form.control}
            name="biography"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel className="flex-1 text-lg font-medium">Biografia klienta</FormLabel>
                  <InfoTooltip text="Opisz swojego klienta - szablonową historię która go doprowadza do momentu gdzie potrzebuje Twojej pomocy i ma problem który rozwiązujesz." />
                </div>
                <FormControl>
                  <Textarea 
                    className="min-h-[150px] mt-2"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 6:
        return (
          <FormField
            control={form.control}
            name="beliefs"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel className="flex-1 text-lg font-medium">Przekonania do wdrożenia</FormLabel>
                  <InfoTooltip text="Jakie przekonania musi nabyć by rozwiązać swój problem." />
                </div>
                <FormControl>
                  <Textarea 
                    placeholder='"Nie musisz być idealny, żeby zacząć", "Można budować dochodowy biznes bez rezygnowania z etatu"' 
                    {...field} 
                    className="mt-2"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 7:
        return (
          <div>
            <div className="flex items-center mb-4">
              <Label className="flex-1 text-lg font-medium">Jakie bóle/problemy odczuwa Twój klient na co dzień?</Label>
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
                      <FormLabel className="text-sm">Problem {index + 1}</FormLabel>
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
        );
      case 8:
        return (
          <div>
            <div className="flex items-center mb-4">
              <Label className="flex-1 text-lg font-medium">O czym marzy, co pragnie zmienić tu i teraz?</Label>
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
                      <FormLabel className="text-sm">Pragnienie {index + 1}</FormLabel>
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
        );
      case 9:
        return (
          <FormField
            control={form.control}
            name="mainOffer"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel className="flex-1 text-lg font-medium">Jak brzmi Twoja główna oferta?</FormLabel>
                  <InfoTooltip text="Wytłumacz nam konkretnie, komu pomagasz, z jakim konkretnym problemem i w jaki konkretny sposób to robisz. Bez ogólników, bez lania wody – jedno zdanie, które pokazuje, co robisz i dla kogo." />
                </div>
                <FormControl>
                  <Textarea 
                    placeholder="Pomagam kobietom po 30. odzyskać energię i zbudować pewność siebie dzięki spersonalizowanemu planowi treningowemu." 
                    {...field} 
                    className="mt-2"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 10:
        return (
          <FormField
            control={form.control}
            name="offerDetails"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel className="flex-1 text-lg font-medium">Rozwiń, co dokładnie oferujesz?</FormLabel>
                  <InfoTooltip text="Napisz prostym językiem – jakbyś tłumaczył znajomemu: co robisz, jak pracujesz, z kim itd." />
                </div>
                <FormControl>
                  <Textarea 
                    className="min-h-[150px] mt-2"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 11:
        return (
          <div>
            <div className="flex items-center mb-4">
              <Label className="flex-1 text-lg font-medium">Jakie korzyści klient otrzyma w ramach twojego programu/współpracy?</Label>
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
                      <FormLabel className="text-sm">Korzyść {index + 1}</FormLabel>
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
        );
      case 12:
        return (
          <FormField
            control={form.control}
            name="whyItWorks"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel className="flex-1 text-lg font-medium">Dlaczego twój produkt działa tak dobrze?</FormLabel>
                  <InfoTooltip text="Wyjaśnij, co sprawia, że Twoja oferta przynosi efekty. Konkretne podejście, sposób pracy, doświadczenie, struktura procesu, sposób wdrażania wiedzy, cokolwiek, co sprawia, że klient osiąga rezultaty szybciej, skuteczniej lub trwalej niż gdzie indziej." />
                </div>
                <FormControl>
                  <Textarea 
                    className="min-h-[150px] mt-2"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 13:
        return (
          <FormField
            control={form.control}
            name="experience"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel className="flex-1 text-lg font-medium">Jakie masz doświadczenie w tej branży?</FormLabel>
                  <InfoTooltip text="Wytłumacz, dlaczego klienci mieliby Ci zaufać. Napisz, ile lat działasz w tej branży, jakie masz na koncie konkretne wyniki, z kim pracowałeś, jakie projekty zrealizowałeś." />
                </div>
                <FormControl>
                  <Textarea 
                    className="min-h-[150px] mt-2"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <Form {...form}>
        <form className="space-y-6" onKeyDown={handleKeyDown}>
          <div className="py-4">
            <Tabs value={currentStep.toString()}>
              <TabsContent value={currentStep.toString()} className="mt-0">
                {renderStepContent()}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Button 
                type="button" 
                variant="outline" 
                onClick={goToPreviousStep}
              >
                {currentStep === 1 ? 'Wróć' : 'Poprzedni krok'}
              </Button>
              
              <div className="text-sm text-gray-500">
                Krok {currentStep} z {TOTAL_STEPS}
              </div>
              
              <Button 
                type="button" 
                onClick={goToNextStep}
              >
                {currentStep === TOTAL_STEPS ? 'Zapisz i kontynuuj' : 'Następny krok'}
              </Button>
            </div>
            
            <Pagination>
              <PaginationContent>
                {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink 
                      isActive={currentStep === index + 1}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentStep(index + 1);
                      }}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
              </PaginationContent>
            </Pagination>
          </div>
        </form>
      </Form>
    </TooltipProvider>
  );
};

export default TargetAudienceForm;
