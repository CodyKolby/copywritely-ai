
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

export type GenerationType = 'ai' | 'guided';

interface GenerationTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { generationType: GenerationType; guidanceText?: string }) => void;
  isPremium: boolean;
}

const formSchema = z.object({
  generationType: z.enum(['ai', 'guided']),
  guidanceText: z.string().optional(),
});

const GenerationTypeDialog = ({ open, onOpenChange, onSubmit, isPremium }: GenerationTypeDialogProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      generationType: 'ai' as const, // Use 'as const' to ensure it's the correct type
      guidanceText: '',
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (!isPremium) {
      onOpenChange(false);
      return;
    }
    
    // Ensure generationType is always a valid enum value before submitting
    const formattedValues = {
      generationType: values.generationType as GenerationType,
      guidanceText: values.guidanceText
    };
    onSubmit(formattedValues);
  };

  const generationType = form.watch('generationType');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Wybierz metodę tworzenia briefu</DialogTitle>
          <DialogDescription>
            Wybierz sposób, w jaki chcesz stworzyć swój brief.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="generationType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-2"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="ai" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Generacja AI - automatyczne stworzenie briefu
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="guided" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Tryb asystowany - z Twoimi wskazówkami
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {generationType === 'guided' && (
              <FormField
                control={form.control}
                name="guidanceText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twoje wytyczne do briefu</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Opisz swoje oczekiwania, np. firma, branża, produkt, charakterystyka, grupa docelowa..."
                        className="min-h-[80px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="submit"
                className="bg-copywrite-teal hover:bg-copywrite-teal-dark text-white"
              >
                Generuj brief
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default GenerationTypeDialog;
