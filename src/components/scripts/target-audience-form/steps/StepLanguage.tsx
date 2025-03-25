
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from '../types';
import InfoTooltip from '../InfoTooltip';

interface StepLanguageProps {
  form: UseFormReturn<FormValues>;
}

const StepLanguage = ({ form }: StepLanguageProps) => {
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
};

export default StepLanguage;
