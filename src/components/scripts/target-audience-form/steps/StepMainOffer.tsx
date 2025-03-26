
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from '../types';
import InfoTooltip from '../InfoTooltip';

interface StepMainOfferProps {
  form: UseFormReturn<FormValues>;
}

const StepMainOffer = ({ form }: StepMainOfferProps) => {
  return (
    <FormField
      control={form.control}
      name="mainOffer"
      render={({ field, fieldState }) => (
        <FormItem>
          <div className="flex items-center">
            <FormLabel className="flex-1 text-lg font-medium">Jak brzmi Twoja główna oferta?</FormLabel>
            <InfoTooltip text="Wytłumacz nam konkretnie, komu pomagasz, z jakim konkretnym problemem i w jaki konkretny sposób to robisz. Bez ogólników, bez lania wody – jedno zdanie, które pokazuje, co robisz i dla kogo." />
          </div>
          <FormControl>
            <Textarea 
              placeholder="Pomagam kobietom po 30. odzyskać energię i zbudować pewność siebie dzięki spersonalizowanemu planowi treningowemu." 
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

export default StepMainOffer;
