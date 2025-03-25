
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import TargetAudienceForm from './TargetAudienceForm';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HelpCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

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
                Wybierz jedną z istniejących grup docelowych lub stwórz nową, aby dostosować skrypt do Twoich potrzeb.
              </DialogDescription>
            </DialogHeader>
            
            {!isPremium ? (
              <div className="py-4">
                <Alert variant="destructive" className="mb-4">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertTitle>Premium feature</AlertTitle>
                  <AlertDescription>
                    Target audience creation is only available for premium users. Upgrade your account to access this feature.
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
              <div className="py-4">
                {existingAudiences.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-medium text-lg mb-3">Istniejące grupy docelowe</h3>
                    <ScrollArea className="h-[200px] w-full rounded-md border">
                      <div className="space-y-2 p-3">
                        {existingAudiences.map((audience) => (
                          <div 
                            key={audience.id}
                            className={`flex items-center justify-between rounded-md p-3 cursor-pointer transition-colors ${
                              selectedAudienceId === audience.id 
                                ? 'bg-copywrite-teal text-white' 
                                : 'bg-copywrite-teal-light text-copywrite-teal hover:bg-copywrite-teal hover:text-white'
                            }`}
                            onClick={() => {
                              handleExistingAudienceSelect(audience.id);
                              handleChoiceSelection('existing');
                            }}
                          >
                            <span className="font-medium">{audience.name}</span>
                            <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                              selectedAudienceId === audience.id 
                                ? 'border-white bg-white/20' 
                                : 'border-copywrite-teal'
                            }`}>
                              {selectedAudienceId === audience.id && (
                                <div className="h-3 w-3 rounded-full bg-white" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
                
                <div 
                  className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors mb-6 ${
                    audienceChoice === 'new' 
                      ? 'bg-copywrite-teal text-white' 
                      : 'bg-copywrite-teal-light text-copywrite-teal hover:bg-copywrite-teal hover:text-white'
                  }`}
                  onClick={() => handleChoiceSelection('new')}
                >
                  <span className="font-medium">Stwórz nową grupę docelową</span>
                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                    audienceChoice === 'new' 
                      ? 'border-white bg-white/20' 
                      : 'border-copywrite-teal'
                  }`}>
                    {audienceChoice === 'new' && (
                      <div className="h-3 w-3 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                
                <DialogFooter className="mt-6">
                  <Button variant="outline" onClick={handleCancel} className="rounded-full px-6">
                    Anuluj
                  </Button>
                  <Button 
                    onClick={handleContinue}
                    disabled={!audienceChoice}
                    className="bg-copywrite-teal hover:bg-copywrite-teal-dark text-white rounded-full px-6"
                  >
                    Dalej
                  </Button>
                </DialogFooter>
              </div>
            )}
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
