
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from '../types';
import InfoTooltip from '../InfoTooltip';

interface StepBenefitsProps {
  form: UseFormReturn<FormValues>;
}

const StepBenefits = ({ form }: StepBenefitsProps) => {
  return (
    <div>
      <div className="flex items-center mb-4">
        <Label className="flex-1 text-lg font-medium">Jakie korzyści klient otrzyma w ramach twojego programu/współpracy?</Label>
        <InfoTooltip text="Opisz, co realnie zyska dzięki współpracy z Tobą. Jakie efekty, jakie ułatwienia, czego uniknie, co zrobi lepiej, szybciej, mądrzej. Skup się na konkretach, które mają dla niego znaczenie. Wszystkie pola są wymagane." />
      </div>
      <p className="text-amber-600 mb-4 font-medium">Wszystkie pola są obowiązkowe. Wypełnij każde pole, aby przejść dalej.</p>
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((index) => (
          <FormField
            key={index}
            control={form.control}
            name={`benefits.${index}`}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center">
                  Korzyść {index + 1}
                  <span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder={
                      index === 0 ? "Otrzymasz indywidualny plan działania" : 
                      index === 1 ? "Unikniesz kosztownych błędów" : 
                      index === 2 ? "Zbudujesz portfolio realnych projektów" :
                      index === 3 ? "Otrzymasz natychmiastowe wsparcie w krytycznych momentach" :
                      "Zapanujesz i ograniczysz swój stres"
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

export default StepBenefits;
