
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import TargetAudienceForm from './TargetAudienceForm';
import GeneratedScriptDialog from './GeneratedScriptDialog';
import { toast } from 'sonner';
import { TargetAudienceDialogProps } from './target-audience-dialog/types';
import { fetchExistingAudiences, fetchTargetAudienceDetails } from './target-audience-dialog/api';
import DialogSelectionContent from './target-audience-dialog/DialogSelectionContent';

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
  const [existingAudiences, setExistingAudiences] = useState([]);
  const [showScriptDialog, setShowScriptDialog] = useState(false);
  
  useEffect(() => {
    if (open && userId) {
      loadExistingAudiences();
    }
  }, [open, userId]);
  
  const loadExistingAudiences = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    const audiences = await fetchExistingAudiences(userId);
    setExistingAudiences(audiences);
    setIsLoading(false);
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
        
        const audienceData = await fetchTargetAudienceDetails(selectedAudienceId);
        
        if (audienceData) {
          toast.success('Wybrano grupę docelową', {
            description: 'Twoja grupa docelowa została wybrana do generowania skryptu.'
          });
          
          // Open the script generation dialog
          setShowScriptDialog(true);
        }
        
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
            <DialogSelectionContent
              isPremium={isPremium}
              isLoading={isLoading}
              existingAudiences={existingAudiences}
              selectedAudienceId={selectedAudienceId}
              audienceChoice={audienceChoice}
              handleExistingAudienceSelect={handleExistingAudienceSelect}
              handleChoiceSelection={handleChoiceSelection}
              handleCreateNewAudience={handleCreateNewAudience}
              handleContinue={handleContinue}
              handleCancel={handleCancel}
            />
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
