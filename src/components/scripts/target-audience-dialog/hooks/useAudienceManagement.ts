
import { useCallback, useRef } from 'react';
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

  // Use refs to track and clear timeouts
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dialogTransitionRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeouts when component unmounts or when needed
  const clearAllTimeouts = useCallback(() => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    
    if (dialogTransitionRef.current) {
      clearTimeout(dialogTransitionRef.current);
      dialogTransitionRef.current = null;
    }
  }, []);

  // Handle audience choice selection
  const handleChoiceSelection = useCallback((choice: AudienceChoice) => {
    // Clear any existing timeouts
    clearAllTimeouts();
    
    setAudienceChoice(choice);
    
    if (choice === 'new') {
      setSelectedAudienceId(null);
    }
    
    // Reset processing state when choice changes
    setIsProcessing(false);
  }, [setAudienceChoice, setSelectedAudienceId, setIsProcessing, clearAllTimeouts]);

  // Handle existing audience selection
  const handleExistingAudienceSelect = useCallback((id: string) => {
    // Clear any existing timeouts
    clearAllTimeouts();
    
    setSelectedAudienceId(id);
    
    // Reset processing state when selection changes
    setIsProcessing(false);
  }, [setSelectedAudienceId, setIsProcessing, clearAllTimeouts]);

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
    
    // Clear any existing timeouts first
    clearAllTimeouts();
    
    // First update processing state
    setIsProcessing(true);
    
    // Set up timeout to show goal dialog with proper state management
    dialogTransitionRef.current = setTimeout(() => {
      setShowGoalDialog(true);
      
      // Add another timeout to ensure the dialog is fully rendered
      // before resetting the processing state
      processingTimeoutRef.current = setTimeout(() => {
        setIsProcessing(false);
      }, 500); // Slightly longer timeout to ensure dialog is rendered
    }, 200);

    // Safety timeout to ensure processing state is eventually reset
    // even if something goes wrong with the dialog transitions
    setTimeout(() => {
      setIsProcessing(false);
    }, 3000); // Failsafe timeout
  }, [audienceChoice, selectedAudienceId, userId, setIsProcessing, setShowGoalDialog, clearAllTimeouts]);

  // Handle create new audience button
  const handleCreateNewAudience = useCallback(() => {
    if (!userId) {
      toast.error('User ID is required');
      return;
    }
    
    // Clear any existing timeouts
    clearAllTimeouts();
    
    // First update processing state
    setIsProcessing(true);
    
    // Set up timeout to show form with proper state management
    dialogTransitionRef.current = setTimeout(() => {
      setShowForm(true);
      
      // Add another timeout to ensure the form is fully rendered
      // before resetting the processing state
      processingTimeoutRef.current = setTimeout(() => {
        setIsProcessing(false);
      }, 500); // Slightly longer timeout to ensure form is rendered
    }, 200);

    // Safety timeout to ensure processing state is eventually reset
    // even if something goes wrong with the dialog transitions
    setTimeout(() => {
      setIsProcessing(false);
    }, 3000); // Failsafe timeout
  }, [userId, setIsProcessing, setShowForm, clearAllTimeouts]);

  return {
    handleChoiceSelection,
    handleExistingAudienceSelect,
    handleContinue,
    handleCreateNewAudience,
    clearAllTimeouts,
  };
};
