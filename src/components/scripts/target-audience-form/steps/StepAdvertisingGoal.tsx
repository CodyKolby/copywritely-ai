
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import InfoTooltip from '../InfoTooltip';
import { FormValues } from '../types';

interface StepAdvertisingGoalProps {
  form: UseFormReturn<FormValues>;
}

const StepAdvertisingGoal = ({ form }: StepAdvertisingGoalProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-900">Cel reklamy</h2>
      <p className="text-gray-600 mb-4">
        Opisz jaki konkretny cel chcesz osiągnąć przy pomocy tej reklamy.
      </p>

      <FormField
        control={form.control}
        name="advertisingGoal"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5">
              Cel reklamy
              <InfoTooltip content="Opisz jaki cel chciałbyś osiągnąć przy pomocy tej reklamy" />
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="Umówienie darmowej konsultacji na stronie internetowej"
                className="min-h-[120px] resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default StepAdvertisingGoal;
