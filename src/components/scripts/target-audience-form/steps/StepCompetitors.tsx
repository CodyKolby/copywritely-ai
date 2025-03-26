
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from '../types';
import InfoTooltip from '../InfoTooltip';

interface StepCompetitorsProps {
  form: UseFormReturn<FormValues>;
}

const StepCompetitors = ({ form }: StepCompetitorsProps) => {
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
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm">Konkurent {index + 1}</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder={`Nazwa konkurenta, co oferuje, problemy z jego produktami/usługami`} 
                    {...field} 
                    className={fieldState.error ? "border-red-500" : ""}
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default StepCompetitors;
