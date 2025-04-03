
import { useCallback } from 'react';
import { toast } from 'sonner';
import { fetchExistingAudiences } from '../api';
import { FormValues } from '../../target-audience-form/types';

export const useAudienceManagement = (
  userId: string | undefined,
  state: {
    setIsLoading: (loading: boolean) => void;
    setExistingAudiences: (audiences: any[]) => void;
    setSelectedAudienceId: (id: string | null) => void;
    setAudienceChoice: (choice: 'existing' | 'new' | null) => void;
    setShowForm: (show: boolean) => void;
    setShowGoalDialog: (show: boolean) => void;
    setIsProcessing: (processing: boolean) => void;
  }
) => {
  const {
    setIsLoading,
    setExistingAudiences,
    setSelectedAudienceId,
    setAudienceChoice,
    setShowForm,
    setShowGoalDialog,
    setIsProcessing
  } = state;

  // Load existing target audiences for the user
  const loadExistingAudiences = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const audiences = await fetchExistingAudiences(userId);
      setExistingAudiences(audiences);
    } catch (error) {
      console.error('Error loading existing target audiences:', error);
      toast.error('Nie udało się załadować istniejących grup docelowych');
    } finally {
      setIsLoading(false);
    }
  }, [userId, setIsLoading, setExistingAudiences]);

  // Handle audience choice selection (new or existing)
  const handleChoiceSelection = (choice: 'existing' | 'new' | null) => {
    setAudienceChoice(choice);
    
    if (choice === 'new') {
      setSelectedAudienceId(null);
    }
  };

  // Handle existing audience selection
  const handleExistingAudienceSelect = (audienceId: string) => {
    setSelectedAudienceId(audienceId);
  };

  // Handle continue button click in selection screen
  const handleContinue = () => {
    const choice = state.setAudienceChoice as any;
    if (choice === 'new') {
      setShowForm(true);
    } else if (choice === 'existing' && state.setSelectedAudienceId) {
      setShowGoalDialog(true);
    }
  };

  // Shortcut to create new audience without selection
  const handleCreateNewAudience = () => {
    setAudienceChoice('new');
    setShowForm(true);
  };

  // Handle form submission (create new target audience)
  const handleFormSubmit = async (data: FormValues, targetAudienceId?: string) => {
    if (state.setIsProcessing) {
      return;
    }
    
    try {
      setIsProcessing(true);
      
      if (targetAudienceId) {
        setSelectedAudienceId(targetAudienceId);
        setShowForm(false);
        setShowGoalDialog(true);
      } else {
        toast.error('Nie udało się pobrać ID grupy docelowej');
      }
    } catch (error) {
      console.error('Error handling form submission:', error);
      toast.error('Wystąpił błąd podczas przetwarzania formularza');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    loadExistingAudiences,
    handleChoiceSelection,
    handleExistingAudienceSelect,
    handleContinue,
    handleCreateNewAudience,
    handleFormSubmit
  };
};
