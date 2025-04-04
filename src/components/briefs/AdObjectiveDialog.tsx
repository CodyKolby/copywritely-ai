
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export const adObjectives = [
  { id: 'awareness', title: 'Zwiększenie świadomości marki' },
  { id: 'consideration', title: 'Zainteresowanie produktem' },
  { id: 'leads', title: 'Generowanie leadów' },
  { id: 'conversion', title: 'Konwersja i sprzedaż' },
];

interface AdObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { objective: string }) => void;
}

const formSchema = z.object({
  objective: z.string().min(1, {
    message: "Wybór celu reklamowego jest wymagany",
  }),
});

const AdObjectiveDialog = ({ open, onOpenChange, onSubmit }: AdObjectiveDialogProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      objective: 'awareness', // Set a default value instead of empty string
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Wybierz cel reklamowy</DialogTitle>
          <DialogDescription>
            Wybór celu kampanii reklamowej pomoże nam dopasować odpowiednie elementy briefu.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="objective"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Cel kampanii reklamowej</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-2"
                    >
                      {adObjectives.map((objective) => (
                        <FormItem 
                          key={objective.id} 
                          className="flex items-center space-x-3 space-y-0 border rounded-md p-3 hover:bg-gray-50"
                        >
                          <FormControl>
                            <RadioGroupItem value={objective.id} />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer w-full">
                            {objective.title}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

export default AdObjectiveDialog;
