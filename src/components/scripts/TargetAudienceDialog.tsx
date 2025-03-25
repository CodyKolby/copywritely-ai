
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import TargetAudienceForm from './TargetAudienceForm';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TargetAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  userId: string;
  isPremium: boolean;
}

const TargetAudienceDialog = ({
  open,
  onOpenChange,
  templateId,
  userId,
  isPremium,
}: TargetAudienceDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [audienceChoice, setAudienceChoice] = useState<string | null>(null);
  
  // Mock existing target audiences
  const existingAudiences = [
    { id: '1', name: 'Grupa biznesowa' },
    { id: '2', name: 'Grupa konsumencka' },
  ];
  
  const handleChoiceSelection = (choice: string) => {
    setAudienceChoice(choice);
    if (choice === 'existing' && existingAudiences.length === 0) {
      toast.error('Nie masz zapisanych grup docelowych', {
        description: 'Utwórz najpierw nową grupę docelową.'
      });
      setAudienceChoice('new');
      setShowForm(true);
      return;
    }
    setShowForm(true);
  };
  
  const handleExistingAudienceSelect = (audienceId: string) => {
    if (!isPremium) {
      toast.error('Nie posiadasz konta premium', {
        description: 'Ta funkcjonalność jest dostępna tylko dla użytkowników premium.'
      });
      onOpenChange(false);
      return;
    }
    
    // Here you would fetch the selected audience and use it
    console.log(`Selected audience ID: ${audienceId}`);
    toast.success('Wybrano grupę docelową', {
      description: 'Twoja grupa docelowa została wybrana do generowania skryptu.'
    });
    onOpenChange(false);
  };
  
  const handleFormSubmit = async (data: any) => {
    if (!isPremium) {
      toast.error('Nie posiadasz konta premium', {
        description: 'Ta funkcjonalność jest dostępna tylko dla użytkowników premium.'
      });
      onOpenChange(false);
      return;
    }

    setIsLoading(true);
    try {
      // Here you would typically save the form data to a database
      console.log('Form data submitted:', data);
      
      // Mock API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Zapisano dane grupy docelowej', {
        description: 'Twoje dane zostały zapisane i zostaną wykorzystane do generowania skryptu.'
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Błąd podczas zapisywania danych', {
        description: 'Spróbuj ponownie później lub skontaktuj się z obsługą klienta.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setShowForm(false);
    setAudienceChoice(null);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {!showForm ? 'Wybierz grupę docelową dla której chcesz stworzyć skrypt' : 
             audienceChoice === 'existing' ? 'Wybierz zapisaną grupę docelową' : 
             'Stwórz nową grupę docelową'}
          </DialogTitle>
          <DialogDescription>
            {!showForm && 'Możesz wybrać istniejącą grupę docelową lub stworzyć nową.'}
          </DialogDescription>
        </DialogHeader>
        
        {!showForm ? (
          <div className="py-6">
            <RadioGroup defaultValue={audienceChoice || ''} className="space-y-4">
              <div className="flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-slate-50" 
                   onClick={() => handleChoiceSelection('existing')}>
                <RadioGroupItem value="existing" id="existing" />
                <Label htmlFor="existing" className="flex-1 cursor-pointer">Użyj istniejącej grupy docelowej</Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-slate-50"
                   onClick={() => handleChoiceSelection('new')}>
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new" className="flex-1 cursor-pointer">Stwórz nową grupę docelową</Label>
              </div>
            </RadioGroup>
            
            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={handleCancel}>
                Anuluj
              </Button>
            </div>
          </div>
        ) : audienceChoice === 'existing' ? (
          <div className="py-4">
            <div className="space-y-4">
              {existingAudiences.map((audience) => (
                <div 
                  key={audience.id}
                  className="flex items-center justify-between rounded-md border p-4 cursor-pointer hover:bg-slate-50"
                  onClick={() => handleExistingAudienceSelect(audience.id)}
                >
                  <span>{audience.name}</span>
                  <Button size="sm">Wybierz</Button>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Wróć
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Anuluj
              </Button>
            </div>
          </div>
        ) : (
          <TargetAudienceForm 
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
            onBack={handleBack}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TargetAudienceDialog;
