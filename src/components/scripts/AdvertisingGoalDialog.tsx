
import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HelpCircle } from 'lucide-react';

interface AdvertisingGoalDialogProps {
  onSubmit: (goal: string) => void;
  onBack: () => void;
  onCancel: () => void;
}

const formSchema = z.object({
  advertisingGoal: z.string().min(10, {
    message: "Proszę opisać cel reklamy w minimum 10 znakach",
  }),
});

const AdvertisingGoalDialog = ({ onSubmit, onBack, onCancel }: AdvertisingGoalDialogProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      advertisingGoal: "",
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values.advertisingGoal);
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="text-2xl font-semibold">Cel reklamy</DialogTitle>
        <DialogDescription>
          Opisz jaki konkretny cel chcesz osiągnąć przy pomocy tej reklamy.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="advertisingGoal"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Cel reklamy
                  <div className="cursor-help text-gray-500 hover:text-gray-700" title="Opisz jaki cel chciałbyś osiągnąć przy pomocy tej reklamy">
                    <HelpCircle size={16} />
                  </div>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Umówienie darmowej konsultacji na stronie internetowej"
                    className="min-h-[150px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Anuluj
              </Button>
              <Button type="button" variant="outline" onClick={onBack}>
                Wstecz
              </Button>
            </div>
            <Button type="submit" className="bg-copywrite-teal hover:bg-copywrite-teal-dark text-white">
              Dalej
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </div>
  );
};

export default AdvertisingGoalDialog;
