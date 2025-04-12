
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from '../types';
import InfoTooltip from '../InfoTooltip';

interface StepDesiresProps {
  form: UseFormReturn<FormValues>;
}

const StepDesires = ({ form }: StepDesiresProps) => {
  return (
    <div>
      <div className="flex items-center mb-4">
        <Label className="flex-1 text-lg font-medium">O czym marzy, co pragnie zmienić tu i teraz?</Label>
        <InfoTooltip text="Jakie są główne ich pragnienia, których szybkie osiągnięcie znacznie poprawi ich sytuacje, są to elementy które chcieliby by wydarzyły się już jak najszybciej, co da im największa różnicę, wzrost, zysk. Wymień 5 i uporządkuj od najważniejszego do najmniej ważnego. Wszystkie pola są wymagane." />
      </div>
      <p className="text-amber-600 mb-4 font-medium">Wszystkie pola są obowiązkowe. Wypełnij każde pole, aby przejść dalej.</p>
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((index) => (
          <FormField
            key={index}
            control={form.control}
            name={`desires.${index}`}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center">
                  Pragnienie {index + 1}
                  <span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder={
                      index === 0 ? "Chcę zarabiać więcej, ale bez pracy po nocach" : 
                      index === 1 ? "Chcę znów poczuć się atrakcyjna" : 
                      index === 2 ? "Stały, przewidywalny napływ leadów" :
                      index === 3 ? "Poprawa jakości życia i komfortu codziennego funkcjonowania" :
                      "Lepsze samopoczucie psychiczne i emocjonalne"
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

export default StepDesires;
