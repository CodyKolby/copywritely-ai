
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from '../types';
import InfoTooltip from '../InfoTooltip';

interface StepExperienceProps {
  form: UseFormReturn<FormValues>;
}

const StepExperience = ({ form }: StepExperienceProps) => {
  return (
    <FormField
      control={form.control}
      name="experience"
      render={({ field, fieldState }) => (
        <FormItem>
          <div className="flex items-center">
            <FormLabel className="flex-1 text-lg font-medium">Jakie masz doświadczenie w tej branży?</FormLabel>
            <InfoTooltip text="Wytłumacz, dlaczego klienci mieliby Ci zaufać. Napisz, ile lat działasz w tej branży, jakie masz na koncie konkretne wyniki, z kim pracowałeś, jakie projekty zrealizowałeś." />
          </div>
          <FormControl>
            <Textarea 
              placeholder="Opisz swoje doświadczenie, lata praktyki, projekty, klientów i wyniki"
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

export default StepExperience;
