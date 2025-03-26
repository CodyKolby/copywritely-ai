
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormControl, FormDescription } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

export const formSchema = z.object({
  generationType: z.enum(['ai', 'guided']),
  guidanceText: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;

interface GenerationTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FormValues) => void;
  isPremium: boolean;
}

const GenerationTypeDialog = ({ open, onOpenChange, onSubmit, isPremium }: GenerationTypeDialogProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      generationType: 'ai',
      guidanceText: '',
    },
  });

  const watchGenerationType = form.watch('generationType');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>How would you like to generate your brief?</DialogTitle>
          <DialogDescription>
            Choose between a fully AI-generated brief or provide guidance on what you'd like to include.
          </DialogDescription>
        </DialogHeader>
        
        {!isPremium ? (
          <div className="py-4">
            <Alert variant="destructive" className="mb-4">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle className="text-gray-800 dark:text-white">Premium feature</AlertTitle>
              <AlertDescription className="text-gray-800 dark:text-white">
                Brief generation is only available for premium users. Upgrade your account to access this feature.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => window.location.href = '/pricing'} 
                className="bg-copywrite-teal hover:bg-copywrite-teal-dark transition-colors"
              >
                View Pricing
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="generationType"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ai" id="ai" />
                        <Label htmlFor="ai" className="font-medium">Fully AI-generated</Label>
                      </div>
                      <FormDescription className="ml-6">
                        AI will generate a complete brief based on the selected template.
                      </FormDescription>
                      
                      <div className="flex items-center space-x-2 mt-4">
                        <RadioGroupItem value="guided" id="guided" />
                        <Label htmlFor="guided" className="font-medium">User-guided generation</Label>
                      </div>
                      <FormDescription className="ml-6">
                        Provide specific details about your target audience, product, or campaign goals.
                      </FormDescription>
                    </RadioGroup>
                  </FormItem>
                )}
              />
              
              {watchGenerationType === 'guided' && (
                <FormField
                  control={form.control}
                  name="guidanceText"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="guidanceText">Describe what you need</Label>
                      <FormControl>
                        <Textarea
                          id="guidanceText"
                          placeholder="Example: I need a brief for a fitness business targeting women over 30..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Be specific about your audience, product details, or any particular messages you want to include.
                      </FormDescription>
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-copywrite-teal hover:bg-copywrite-teal-dark transition-colors">
                  Generate Brief
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GenerationTypeDialog;
