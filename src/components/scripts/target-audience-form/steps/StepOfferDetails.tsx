
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from '../types';
import InfoTooltip from '../InfoTooltip';

interface StepOfferDetailsProps {
  form: UseFormReturn<FormValues>;
}

const StepOfferDetails = ({ form }: StepOfferDetailsProps) => {
  return (
    <FormField
      control={form.control}
      name="offerDetails"
      render={({ field, fieldState }) => (
        <FormItem>
          <div className="flex items-center">
            <FormLabel className="flex-1 text-lg font-medium">Rozwiń, co dokładnie oferujesz?</FormLabel>
            <InfoTooltip text="Napisz prostym językiem – jakbyś tłumaczył znajomemu: co robisz, jak pracujesz, z kim itd." />
          </div>
          <FormControl>
            <Textarea 
              placeholder="Opisz dokładnie swój produkt/usługę, przebieg współpracy, efekty"
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

export default StepOfferDetails;
