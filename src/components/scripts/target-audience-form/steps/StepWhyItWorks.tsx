
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from '../types';
import InfoTooltip from '../InfoTooltip';

interface StepWhyItWorksProps {
  form: UseFormReturn<FormValues>;
}

const StepWhyItWorks = ({ form }: StepWhyItWorksProps) => {
  return (
    <FormField
      control={form.control}
      name="whyItWorks"
      render={({ field, fieldState }) => (
        <FormItem>
          <div className="flex items-center">
            <FormLabel className="flex-1 text-lg font-medium">Dlaczego twój produkt działa tak dobrze?</FormLabel>
            <InfoTooltip text="Wyjaśnij, co sprawia, że Twoja oferta przynosi efekty. Konkretne podejście, sposób pracy, doświadczenie, struktura procesu, sposób wdrażania wiedzy, cokolwiek, co sprawia, że klient osiąga rezultaty szybciej, skuteczniej lub trwalej niż gdzie indziej." />
          </div>
          <FormControl>
            <Textarea 
              placeholder="Opisz unikalny mechanizm działania Twojego produktu/usługi"
              className={`min-h-[150px] mt-2 ${fieldState.error ? "border-red-500" : ""}`}
              {...field} 
            />
          </FormControl>
          <FormMessage className="text-red-500" />
        </FormItem>
      )}
    />
  );
};

export default StepWhyItWorks;
