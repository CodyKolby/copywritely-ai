
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Form, FormField, FormItem } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

export const adObjectives = [
  {
    id: 'website_visits',
    title: 'Zwiększenie liczby odwiedzin na stronie internetowej'
  },
  {
    id: 'digital_product',
    title: 'Sprzedaż produktu cyfrowego'
  },
  {
    id: 'sales_call',
    title: 'Umówienie rozmowy sprzedażowej'
  },
  {
    id: 'event_signup',
    title: 'Zapisanie się na wydarzenie lub listę mailingową'
  }
];

export const adObjectiveSchema = z.object({
  objective: z.string().min(1, "Wybierz cel dla reklamy")
});

export type AdObjectiveFormValues = z.infer<typeof adObjectiveSchema>;

interface AdObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdObjectiveFormValues) => void;
  isPremium?: boolean; // Make isPremium optional with a default value
}

const AdObjectiveDialog = ({ open, onOpenChange, onSubmit, isPremium = false }: AdObjectiveDialogProps) => {
  const adObjectiveForm = useForm<AdObjectiveFormValues>({
    resolver: zodResolver(adObjectiveSchema),
    defaultValues: {
      objective: '',
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Jaki cel reklama ma mieć?</DialogTitle>
          <DialogDescription>
            Wybierz cel kampanii reklamowej.
          </DialogDescription>
        </DialogHeader>
        
        {!isPremium ? (
          <div className="py-4">
            <Alert variant="destructive" className="mb-4">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Premium feature</AlertTitle>
              <AlertDescription>
                Brief generation is only available for premium users. Upgrade your account to access this feature.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-full"
              >
                Anuluj
              </Button>
              <Button 
                onClick={() => window.location.href = '/pricing'} 
                className="bg-copywrite-teal hover:bg-copywrite-teal-dark transition-colors rounded-full"
              >
                View Pricing
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...adObjectiveForm}>
            <form onSubmit={adObjectiveForm.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={adObjectiveForm.control}
                name="objective"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="gap-3"
                    >
                      {adObjectives.map((objective) => (
                        <div 
                          key={objective.id} 
                          className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                            field.value === objective.id 
                              ? 'bg-copywrite-teal text-white' 
                              : 'bg-copywrite-teal-light text-copywrite-teal hover:bg-copywrite-teal hover:text-white'
                          }`}
                          onClick={() => field.onChange(objective.id)}
                        >
                          <Label 
                            htmlFor={objective.id} 
                            className={`font-medium cursor-pointer flex-1 ${field.value === objective.id ? 'text-white' : ''}`}
                          >
                            {objective.title}
                          </Label>
                          <RadioGroupItem 
                            value={objective.id} 
                            id={objective.id} 
                            className="data-[state=checked]:border-white data-[state=checked]:bg-white/20"
                          />
                        </div>
                      ))}
                    </RadioGroup>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="rounded-full px-6"
                >
                  Anuluj
                </Button>
                <Button 
                  type="submit" 
                  className="bg-copywrite-teal hover:bg-copywrite-teal-dark transition-colors rounded-full px-6"
                  disabled={!adObjectiveForm.watch('objective')}
                >
                  Dalej
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdObjectiveDialog;
