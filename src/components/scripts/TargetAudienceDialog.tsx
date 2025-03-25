
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import TargetAudienceForm from './TargetAudienceForm';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

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
  const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(null);
  
  // Mock existing target audiences
  const existingAudiences = [
    { id: '1', name: 'Grupa docelowa numer 1' },
    { id: '2', name: 'Grupa docelowa numer 2' },
  ];
  
  const handleChoiceSelection = (choice: string) => {
    setAudienceChoice(choice);
    if (choice === 'new') {
      setSelectedAudienceId(null);
    }
  };
  
  const handleExistingAudienceSelect = (audienceId: string) => {
    setSelectedAudienceId(audienceId);
  };
  
  const handleContinue = () => {
    if (!isPremium) {
      toast.error('Nie posiadasz konta premium', {
        description: 'Ta funkcjonalność jest dostępna tylko dla użytkowników premium.'
      });
      onOpenChange(false);
      return;
    }
    
    if (audienceChoice === 'existing' && selectedAudienceId) {
      // Here you would fetch the selected audience and use it
      console.log(`Selected audience ID: ${selectedAudienceId}`);
      toast.success('Wybrano grupę docelową', {
        description: 'Twoja grupa docelowa została wybrana do generowania skryptu.'
      });
      onOpenChange(false);
    } else if (audienceChoice === 'new') {
      setShowForm(true);
    } else {
      toast.error('Wybierz grupę docelową', {
        description: 'Musisz wybrać istniejącą grupę docelową lub stworzyć nową.'
      });
    }
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
    setSelectedAudienceId(null);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        {!showForm ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Wybierz grupę docelową dla której chcesz stworzyć skrypt
              </DialogTitle>
              <DialogDescription>
                Jakiś tekst dotyczący tego okna, coś może tłumaczącego itd.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              {existingAudiences.length > 0 && (
                <div className="mb-6 bg-red-500 rounded-lg p-4">
                  <ScrollArea className="h-[200px] w-full">
                    <div className="space-y-3">
                      {existingAudiences.map((audience) => (
                        <div 
                          key={audience.id}
                          className="flex items-center justify-between bg-blue-600 rounded-full p-4 text-white"
                          onClick={() => {
                            handleExistingAudienceSelect(audience.id);
                            handleChoiceSelection('existing');
                          }}
                        >
                          <span className="font-medium">{audience.name}</span>
                          <div className="h-8 w-8 rounded-full bg-sky-300 flex items-center justify-center">
                            {selectedAudienceId === audience.id && (
                              <div className="h-4 w-4 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
              
              <div className="flex items-center space-x-3 mb-6">
                <div 
                  className="h-8 w-8 rounded-full bg-sky-300 flex items-center justify-center cursor-pointer"
                  onClick={() => handleChoiceSelection('new')}
                >
                  {audienceChoice === 'new' && (
                    <div className="h-4 w-4 rounded-full bg-white" />
                  )}
                </div>
                <Label htmlFor="new" className="cursor-pointer text-white">Stwórz nową grupę docelową</Label>
              </div>
              
              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={handleCancel} className="rounded-full px-8 py-6">
                  Anuluj
                </Button>
                <Button 
                  onClick={handleContinue} 
                  disabled={!audienceChoice}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6"
                >
                  Dalej
                </Button>
              </div>
            </div>
          </>
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
