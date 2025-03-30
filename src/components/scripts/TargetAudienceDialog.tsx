import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import TargetAudienceForm from './TargetAudienceForm';
import GeneratedScriptDialog from './GeneratedScriptDialog';
import { toast } from 'sonner';
import { TargetAudienceDialogProps } from './target-audience-dialog/types';
import { fetchExistingAudiences, fetchTargetAudienceDetails } from './target-audience-dialog/api';
import DialogSelectionContent from './target-audience-dialog/DialogSelectionContent';
import AdvertisingGoalDialog from './AdvertisingGoalDialog';

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
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [advertisingGoal, setAdvertisingGoal] = useState<string>('');

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
        description: 'Ta funkcjonalność jest dostępna tylko dla użytkowników premium.',
        dismissible: true
      });
      onOpenChange(false);
      return;
    }
    
    if (audienceChoice === 'existing' && selectedAudienceId) {
      try {
        setIsLoading(true);
        
        const audienceData = await fetchTargetAudienceDetails(selectedAudienceId);
        
        if (audienceData) {
          setShowGoalDialog(true);
        }
        
      } catch (error) {
        console.error('Error in handleContinue:', error);
        toast.error('Nieoczekiwany błąd podczas przetwarzania danych', {
          dismissible: true
        });
      } finally {
        setIsLoading(false);
      }
    } else if (audienceChoice === 'new') {
      setShowForm(true);
    } else {
      toast.error('Wybierz grupę docelową', {
        description: 'Musisz wybrać istniejącą grupę docelową lub stworzyć nową.',
        dismissible: true
      });
    }
  };

  const handleCreateNewAudience = () => {
    if (!isPremium) {
      toast.error('Nie posiadasz konta premium', {
        description: 'Ta funkcjonalność jest dostępna tylko dla użytkowników premium.',
        dismissible: true
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
        description: 'Ta funkcjonalność jest dostępna tylko dla użytkowników premium.',
        dismissible: true
      });
      onOpenChange(false);
      return;
    }

    setIsLoading(true);
    try {
      toast.success('Zapisano dane grupy docelowej', {
        dismissible: true
      });
      
      if (targetAudienceId) {
        setSelectedAudienceId(targetAudienceId);
        setShowGoalDialog(true);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Błąd podczas zapisywania danych', {
        description: 'Spróbuj ponownie później lub skontaktuj się z obsługą klienta.',
        dismissible: true
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

  const handleGoalSubmit = (goal: string) => {
    setAdvertisingGoal(goal);
    setShowGoalDialog(false);
    setShowScriptDialog(true);
  };

  const handleGoalBack = () => {
    setShowGoalDialog(false);
    if (showForm) {
      setShowForm(true);
    } else {
      setSelectedAudienceId(null);
      setAudienceChoice(null);
    }
  };

  const handleScriptDialogClose = () => {
    setShowScriptDialog(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          {!showForm && !showGoalDialog ? (
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
          ) : showGoalDialog ? (
            <AdvertisingGoalDialog 
              onSubmit={handleGoalSubmit}
              onBack={handleGoalBack}
              onCancel={handleCancel}
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
      
      <GeneratedScriptDialog
        open={showScriptDialog}
        onOpenChange={handleScriptDialogClose}
        targetAudienceId={selectedAudienceId || ''}
        templateId={templateId}
        advertisingGoal={advertisingGoal}
      />
    </>
  );
};

export default TargetAudienceDialog;
