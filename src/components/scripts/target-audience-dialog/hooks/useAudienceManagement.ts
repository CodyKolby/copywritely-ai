
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
  transitionToDialog: (closeDialog: () => void, openDialog: () => void) => void;
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
    transitionToDialog,
    audienceChoice,
    selectedAudienceId
  } = props;

  // Handle audience choice selection
  const handleChoiceSelection = useCallback((choice: AudienceChoice) => {
    console.log(`Selected audience choice: ${choice}`);
    setAudienceChoice(choice);
    
    if (choice === 'new') {
      setSelectedAudienceId(null);
    }
  }, [setAudienceChoice, setSelectedAudienceId]);

  // Handle existing audience selection
  const handleExistingAudienceSelect = useCallback((id: string) => {
    console.log(`Selected audience ID: ${id}`);
    setSelectedAudienceId(id);
  }, [setSelectedAudienceId]);

  // Handle continue button click
  const handleContinue = useCallback(() => {
    console.log('Continue button clicked');
    
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
    
    // Move to goal dialog
    transitionToDialog(
      () => {}, // No dialog to close
      () => setShowGoalDialog(true)
    );
  }, [
    audienceChoice, 
    selectedAudienceId, 
    setIsProcessing, 
    transitionToDialog, 
    setShowGoalDialog
  ]);

  // Handle create new audience button
  const handleCreateNewAudience = useCallback(() => {
    console.log('Create new audience button clicked');
    setIsProcessing(true);
    
    transitionToDialog(
      () => {}, // No dialog to close
      () => setShowForm(true)
    );
  }, [setIsProcessing, transitionToDialog, setShowForm]);

  return {
    handleChoiceSelection,
    handleExistingAudienceSelect,
    handleContinue,
    handleCreateNewAudience,
  };
};
