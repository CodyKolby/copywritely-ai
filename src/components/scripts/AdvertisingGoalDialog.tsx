
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HelpCircle, Loader2 } from 'lucide-react';

interface AdvertisingGoalDialogProps {
  onSubmit: (goal: string) => void;
  onBack: () => void;
  onCancel: () => void;
  isProcessing: boolean; 
}

const formSchema = z.object({
  advertisingGoal: z.string().min(10, {
    message: "Proszę opisać następny krok klienta w minimum 10 znakach",
  }),
});

const AdvertisingGoalDialog = ({ onSubmit, onBack, onCancel, isProcessing }: AdvertisingGoalDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      advertisingGoal: "",
    },
  });

  // Reset form state when dialog's processing state changes from true to false
  useEffect(() => {
    if (!isProcessing && submitting) {
      setSubmitting(false);
    }
  }, [isProcessing, submitting]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (isProcessing || submitting) {
      return;
    }
    
    setSubmitting(true);
    console.log("Submitting goal:", values.advertisingGoal);
    onSubmit(values.advertisingGoal);
  };

  // Handle button clicks with debouncing to prevent double-clicks
  // and immediate state change to prevent UI flicker
  const handleBackClick = () => {
    if (isProcessing || submitting) {
      return;
    }
    // Reset the form before navigation
    form.reset();
    // Call the back handler
    onBack();
  };

  const handleCancelClick = () => {
    if (isProcessing || submitting) {
      return;
    }
    // Reset the form before navigation
    form.reset();
    // Call the cancel handler
    onCancel();
  };

  return (
    <div className="space-y-6 p-4">
      <DialogHeader>
        <DialogTitle className="text-2xl font-semibold">Następny krok klienta</DialogTitle>
        <DialogDescription>
          Opisz jaki konkretny krok klient musi wykonać po zobaczeniu reklamy.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 px-2">
          <FormField
            control={form.control}
            name="advertisingGoal"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Jaki jest kolejny krok, który klient musi wykonać?
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help text-gray-500 hover:text-gray-700">
                          <HelpCircle size={16} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="center" className="max-w-xs text-sm p-3 bg-white border border-gray-200 shadow-lg">
                        Wytłumacz bardzo dokładnie i jednoznacznie, co klient powinien zrobić tu i teraz, krok po kroku. 
                        Użyj prostego języka i nie zostawiaj miejsca na domysły. 
                        Im więcej detali, tym lepiej – to podnosi skuteczność wezwania do działania.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Klient ma wejść na stronę przypiętą do reklamy a następnie umówić się na rozmowę"
                    className="min-h-[150px] resize-none"
                    disabled={isProcessing || submitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancelClick} 
                disabled={isProcessing || submitting}
              >
                Anuluj
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBackClick} 
                disabled={isProcessing || submitting}
              >
                Wstecz
              </Button>
            </div>
            <Button 
              type="submit" 
              className="bg-copywrite-teal hover:bg-copywrite-teal-dark text-white"
              disabled={isProcessing || submitting}
            >
              {isProcessing || submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Przetwarzanie...
                </>
              ) : (
                "Dalej"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </div>
  );
};

export default AdvertisingGoalDialog;
