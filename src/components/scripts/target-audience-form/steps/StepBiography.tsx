
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from '../types';
import InfoTooltip from '../InfoTooltip';

interface StepBiographyProps {
  form: UseFormReturn<FormValues>;
}

const StepBiography = ({ form }: StepBiographyProps) => {
  return (
    <FormField
      control={form.control}
      name="biography"
      render={({ field, fieldState }) => (
        <FormItem>
          <div className="flex items-center">
            <FormLabel className="flex-1 text-lg font-medium">Biografia klienta</FormLabel>
            <InfoTooltip text="Opisz swojego klienta - szablonową historię która go doprowadza do momentu gdzie potrzebuje Twojej pomocy i ma problem który rozwiązujesz." />
          </div>
          <FormControl>
            <Textarea 
              placeholder="Opisz życie swojego klienta przed i po skorzystaniu z Twojej oferty"
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

export default StepBiography;
