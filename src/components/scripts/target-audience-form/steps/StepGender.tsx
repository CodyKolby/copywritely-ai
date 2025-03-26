
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from '../types';
import InfoTooltip from '../InfoTooltip';

interface StepGenderProps {
  form: UseFormReturn<FormValues>;
}

const StepGender = ({ form }: StepGenderProps) => {
  return (
    <FormField
      control={form.control}
      name="gender"
      render={({ field, fieldState }) => (
        <FormItem className="space-y-3">
          <div className="flex items-center">
            <FormLabel className="flex-1 text-lg font-medium">Jakiej płci jest Twój idealny klient?</FormLabel>
            <InfoTooltip text="Wybierz płeć Twojego idealnego klienta." />
          </div>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="space-y-3 mt-4"
            >
              <label 
                htmlFor="male" 
                className={`flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-slate-50 ${fieldState.error ? "border-red-500" : ""}`}
              >
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male" className="flex-1 cursor-pointer">Mężczyzna</Label>
              </label>
              
              <label 
                htmlFor="female" 
                className={`flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-slate-50 ${fieldState.error ? "border-red-500" : ""}`}
              >
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female" className="flex-1 cursor-pointer">Kobieta</Label>
              </label>
              
              <label 
                htmlFor="any" 
                className={`flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-slate-50 ${fieldState.error ? "border-red-500" : ""}`}
              >
                <RadioGroupItem value="any" id="any" />
                <Label htmlFor="any" className="flex-1 cursor-pointer">Nie ma znaczenia</Label>
              </label>
            </RadioGroup>
          </FormControl>
          <FormMessage className="text-red-500" />
        </FormItem>
      )}
    />
  );
};

export default StepGender;
