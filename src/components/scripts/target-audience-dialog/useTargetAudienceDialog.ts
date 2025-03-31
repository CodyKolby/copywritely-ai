
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { fetchExistingAudiences, fetchTargetAudienceDetails } from './api';

interface UseTargetAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  userId: string;
  isPremium: boolean;
}

export const useTargetAudienceDialog = ({
  open,
  userId,
  isPremium,
}: UseTargetAudienceDialogProps) => {
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
      return false;
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
      return true;
    } else if (audienceChoice === 'new') {
      setShowForm(true);
      return true;
    } else {
      toast.error('Wybierz grupę docelową', {
        description: 'Musisz wybrać istniejącą grupę docelową lub stworzyć nową.',
        dismissible: true
      });
      return false;
    }
  };

  const handleCreateNewAudience = () => {
    if (!isPremium) {
      toast.error('Nie posiadasz konta premium', {
        description: 'Ta funkcjonalność jest dostępna tylko dla użytkowników premium.',
        dismissible: true
      });
      return false;
    }
    
    setAudienceChoice('new');
    setShowForm(true);
    return true;
  };

  const handleFormSubmit = async (data: any, targetAudienceId?: string) => {
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
    return true;
  };

  return {
    isLoading,
    showForm,
    audienceChoice,
    selectedAudienceId,
    existingAudiences,
    showScriptDialog,
    showGoalDialog,
    advertisingGoal,
    handleChoiceSelection,
    handleExistingAudienceSelect,
    handleContinue,
    handleCreateNewAudience,
    handleFormSubmit,
    handleBack,
    handleGoalSubmit,
    handleGoalBack,
    handleScriptDialogClose,
  };
};
