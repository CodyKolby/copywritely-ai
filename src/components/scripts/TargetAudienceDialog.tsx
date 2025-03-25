import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import TargetAudienceForm from './TargetAudienceForm';
import GeneratedScriptDialog from './GeneratedScriptDialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HelpCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { supabase } from '@/integrations/supabase/client';

interface TargetAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  userId: string;
  isPremium: boolean;
}

interface TargetAudience {
  id: string;
  name: string;
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
  const [existingAudiences, setExistingAudiences] = useState<TargetAudience[]>([]);
  const [showScriptDialog, setShowScriptDialog] = useState(false);
  
  useEffect(() => {
    if (open && userId) {
      fetchExistingAudiences();
    }
  }, [open, userId]);
  
  const fetchExistingAudiences = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('target_audiences')
        .select('id, name')
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error fetching target audiences:', error);
        toast.error('Błąd podczas pobierania grup docelowych');
        return;
      }
      
      setExistingAudiences(data || []);
    } catch (error) {
      console.error('Error in fetchExistingAudiences:', error);
      toast.error('Nieoczekiwany błąd podczas pobierania danych');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChoiceSelection = (choice: string) => {
    setAudienceChoice(choice);
    if (choice === 'new') {
      setSelectedAudienceId(null);
    }
  };
  
  const handleExistingAudienceSelect = (audienceId: string) => {
    setSelectedAudienceId(audienceId);
  };
  
  const handleContinue = async () => {
    if (!isPremium) {
      toast.error('Nie posiadasz konta premium', {
        description: 'Ta funkcjonalność jest dostępna tylko dla użytkowników premium.'
      });
      onOpenChange(false);
      return;
    }
    
    if (audienceChoice === 'existing' && selectedAudienceId) {
      try {
        setIsLoading(true);
        
        // Fetch the complete target audience data
        const { data, error } = await supabase
          .from('target_audiences')
          .select('*')
          .eq('id', selectedAudienceId)
          .single();
          
        if (error) {
          console.error('Error fetching target audience details:', error);
          toast.error('Błąd podczas pobierania szczegółów grupy docelowej');
          return;
        }
        
        toast.success('Wybrano grupę docelową', {
          description: 'Twoja grupa docelowa została wybrana do generowania skryptu.'
        });
        
        // Open the script generation dialog
        setShowScriptDialog(true);
        
      } catch (error) {
        console.error('Error in handleContinue:', error);
        toast.error('Nieoczekiwany błąd podczas przetwarzania danych');
      } finally {
        setIsLoading(false);
      }
    } else if (audienceChoice === 'new') {
      setShowForm(true);
    } else {
      toast.error('Wybierz grupę docelową', {
        description: 'Musisz wybrać istniejącą grupę docelową lub stworzyć nową.'
      });
    }
  };
  
  const handleCreateNewAudience = () => {
    if (!isPremium) {
      toast.error('Nie posiadasz konta premium', {
        description: 'Ta funkcjonalność jest dostępna tylko dla użytkowników premium.'
      });
      onOpenChange(false);
      return;
    }
    
    setAudienceChoice('new');
    setShowForm(true);
  };
  
  const handleFormSubmit = async (data: any, targetAudienceId?: string) => {
    if (!isPremium) {
      toast.error('Nie posiadasz konta premium', {
        description: 'Ta funkcjonalność jest dostępna tylko dla użytkowników premium.'
      });
      onOpenChange(false);
      return;
    }

    setIsLoading(true);
    try {
      // The form component now handles saving to Supabase
      toast.success('Zapisano dane grupy docelowej', {
        description: 'Twoje dane zostały zapisane i zostaną wykorzystane do generowania skryptu.'
      });
      
      // If we have a target audience ID, store it and open script dialog
      if (targetAudienceId) {
        setSelectedAudienceId(targetAudienceId);
        setShowScriptDialog(true);
      }
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
  
  const handleScriptDialogClose = () => {
    setShowScriptDialog(false);
    onOpenChange(false); // Close the parent dialog as well
  };

  return (
    <>
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
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copywrite-teal"></div>
                    </div>
                  ) : existingAudiences.length > 0 ? (
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
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <HelpCircle className="mx-auto h-12 w-12 opacity-50 mb-2" />
                      <p>Nie masz jeszcze żadnych grup docelowych.</p>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <button
                      onClick={handleCreateNewAudience}
                      className="text-copywrite-teal hover:text-copywrite-teal-dark font-medium underline transition-colors"
                    >
                      Stwórz nową grupę docelową
                    </button>
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
      
      {/* Script Generation Dialog */}
      <GeneratedScriptDialog
        open={showScriptDialog}
        onOpenChange={handleScriptDialogClose}
        targetAudienceId={selectedAudienceId || ''}
        templateId={templateId}
      />
    </>
  );
};

export default TargetAudienceDialog;
