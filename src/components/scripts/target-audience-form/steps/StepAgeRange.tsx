
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from '../types';
import InfoTooltip from '../InfoTooltip';

interface StepAgeRangeProps {
  form: UseFormReturn<FormValues>;
}

const StepAgeRange = ({ form }: StepAgeRangeProps) => {
  return (
    <FormField
      control={form.control}
      name="ageRange"
      render={({ field, fieldState }) => (
        <FormItem>
          <div className="flex items-center">
            <FormLabel className="flex-1 text-lg font-medium">Ile lat ma Twój idealny klient?</FormLabel>
            <InfoTooltip text="Określ przybliżony zakres wieku Twoich idealnych klientów." />
          </div>
          <FormControl>
            <Input 
              placeholder="np. 25-45" 
              {...field} 
              className={`mt-2 ${fieldState.error ? "border-red-500" : ""}`} 
            />
          </FormControl>
          <FormMessage className="text-red-500" />
        </FormItem>
      )}
    />
  );
};

export default StepAgeRange;
