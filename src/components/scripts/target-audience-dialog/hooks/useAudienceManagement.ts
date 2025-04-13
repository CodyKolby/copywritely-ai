
import { useCallback } from 'react';
import { toast } from 'sonner';
import { AudienceChoice } from '../types';

interface AudienceManagementProps {
  setIsLoading: (isLoading: boolean) => void;
  setExistingAudiences: (audiences: any[]) => void;
  setSelectedAudienceId: (id: string | null) => void;
  setAudienceChoice: (choice: AudienceChoice) => void;
  setShowForm: (show: boolean) => void;
  setShowGoalDialog: (show: boolean) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  audienceChoice: AudienceChoice;
  selectedAudienceId: string | null;
}

export const useAudienceManagement = (userId: string, props: AudienceManagementProps) => {
  const {
    setAudienceChoice,
    setSelectedAudienceId,
    setShowForm,
    setShowGoalDialog,
    setIsProcessing,
    audienceChoice,
    selectedAudienceId
  } = props;

  // Handle audience choice selection
  const handleChoiceSelection = useCallback((choice: AudienceChoice) => {
    setAudienceChoice(choice);
    
    if (choice === 'new') {
      setSelectedAudienceId(null);
    }
  }, [setAudienceChoice, setSelectedAudienceId]);

  // Handle existing audience selection
  const handleExistingAudienceSelect = useCallback((id: string) => {
    setSelectedAudienceId(id);
  }, [setSelectedAudienceId]);

  // Handle continue button click
  const handleContinue = useCallback(() => {
    if (!userId) {
      toast.error('User ID is required');
      return;
    }
    
    if (!audienceChoice) {
      toast.error('Proszę wybrać opcję');
      return;
    }

    // For existing audiences, check if one is selected
    if (audienceChoice === 'existing' && !selectedAudienceId) {
      toast.error('Proszę wybrać grupę docelową');
      return;
    }
    
    setIsProcessing(true);
    setShowGoalDialog(true);
  }, [audienceChoice, selectedAudienceId, userId, setIsProcessing, setShowGoalDialog]);

  // Handle create new audience button
  const handleCreateNewAudience = useCallback(() => {
    if (!userId) {
      toast.error('User ID is required');
      return;
    }
    
    setIsProcessing(true);
    setShowForm(true);
  }, [userId, setIsProcessing, setShowForm]);

  return {
    handleChoiceSelection,
    handleExistingAudienceSelect,
    handleContinue,
    handleCreateNewAudience,
  };
};
