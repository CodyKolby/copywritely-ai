
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
        <InfoTooltip text="Jakie są główne bóle, problemy w jego biznesie/życiu, które chciałby rozwiązać a związane są z Twoją usługa czy produktem. Wymień 5 i uporządkuj od najważniejszego do najmniej ważnego. Co muszą naprawić, rozwiązać tu i teraz, żeby poprawić swoją sytuację. Wszystkie pola są wymagane." />
      </div>
      <p className="text-amber-600 mb-4 font-medium">Wszystkie pola są obowiązkowe. Wypełnij każde pole, aby przejść dalej.</p>
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((index) => (
          <FormField
            key={index}
            control={form.control}
            name={`pains.${index}`}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center">
                  Problem {index + 1}
                  <span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder={
                      index === 0 ? "Brak klientów" : 
                      index === 1 ? "Niepewność finansowa" : 
                      index === 2 ? "Niskie poczucie wartości" :
                      index === 3 ? "Problemy jelitowe po większości posiłków" :
                      "Brak czasu na gotowanie"
                    } 
                    {...field} 
                    className={fieldState.error ? "border-red-500" : ""}
                    required
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
