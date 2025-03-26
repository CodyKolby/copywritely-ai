
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from '../types';
import InfoTooltip from '../InfoTooltip';

interface StepBeliefsProps {
  form: UseFormReturn<FormValues>;
}

const StepBeliefs = ({ form }: StepBeliefsProps) => {
  return (
    <FormField
      control={form.control}
      name="beliefs"
      render={({ field, fieldState }) => (
        <FormItem>
          <div className="flex items-center">
            <FormLabel className="flex-1 text-lg font-medium">Przekonania do wdrożenia</FormLabel>
            <InfoTooltip text="Jakie przekonania musi nabyć by rozwiązać swój problem." />
          </div>
          <FormControl>
            <Textarea 
              placeholder='"Nie musisz być idealny, żeby zacząć", "Można budować dochodowy biznes bez rezygnowania z etatu"' 
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

export default StepBeliefs;
