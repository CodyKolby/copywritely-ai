
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from '../types';
import InfoTooltip from '../InfoTooltip';

interface StepPainsProps {
  form: UseFormReturn<FormValues>;
}

const StepPains = ({ form }: StepPainsProps) => {
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
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm">Problem {index + 1}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={index === 0 ? "Brak klientów" : index === 1 ? "Niepewność finansowa" : "Niskie poczucie wartości"} 
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

export default StepPains;
