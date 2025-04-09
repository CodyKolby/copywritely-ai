
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';
import { useCallback } from 'react';

interface AudienceManagementDeps {
  setIsLoading: (value: boolean) => void;
  setExistingAudiences: (value: any[]) => void;
  setSelectedAudienceId: (value: string | null) => void;
  setAudienceChoice: (value: 'existing' | 'new' | null) => void;
  setShowForm: (value: boolean) => void;
  setShowGoalDialog: (value: boolean) => void;
  setIsProcessing: (value: boolean) => void;
  transitionToDialog?: (closeDialog: () => void, openDialog: () => void) => void;
  audienceChoice: 'existing' | 'new' | null;
  selectedAudienceId: string | null;
}

export const useAudienceManagement = (
  userId: string,
  deps: AudienceManagementDeps
) => {
  const { session } = useAuth();

  // Choice selection handler - memoized with useCallback
  const handleChoiceSelection = useCallback((choice: 'existing' | 'new') => {
    console.log(`Selected audience choice: ${choice}`);
    deps.setAudienceChoice(choice);
    deps.setIsProcessing(false); // Reset processing state when changing choice
  }, [deps]);

  // Handlers for existing audience selection - memoized with useCallback
  const handleExistingAudienceSelect = useCallback((audienceId: string) => {
    console.log(`Selected audience ID: ${audienceId}`);
    deps.setSelectedAudienceId(audienceId);
    deps.setIsProcessing(false); // Reset processing state when changing selection
  }, [deps]);

  // Continue button handler - memoized with useCallback
  const handleContinue = useCallback(() => {
    if (!userId) {
      toast.error('Musisz być zalogowany, aby kontynuować');
      return;
    }
    
    try {
      console.log('Continue button clicked, moving to goal dialog');
      
      // Ustawiam flagę przetwarzania
      deps.setIsProcessing(true);
      
      if (deps.transitionToDialog) {
        // Użyj nowego mechanizmu przejść jeśli jest dostępny
        deps.transitionToDialog(
          () => {}, // Nie zamykamy bieżącego dialogu
          () => deps.setShowGoalDialog(true)
        );
      } else {
        // Fallback do starego podejścia
        deps.setShowGoalDialog(true);
        
        // Reset z opóźnieniem
        setTimeout(() => {
          deps.setIsProcessing(false);
        }, 100);
      }
    } catch (error) {
      console.error("Error in continue flow:", error);
      deps.setIsProcessing(false);
    }
  }, [userId, deps]);

  // Handler for creating a new audience - memoized with useCallback
  const handleCreateNewAudience = useCallback(() => {
    if (!userId) {
      toast.error('Musisz być zalogowany, aby kontynuować');
      return;
    }
    
    try {
      console.log('Create new audience button clicked, showing form');
      deps.setIsProcessing(true);
      
      if (deps.transitionToDialog) {
        // Użyj nowego mechanizmu przejść
        deps.transitionToDialog(
          () => {}, // Nie zamykamy bieżącego dialogu
          () => deps.setShowForm(true)
        );
      } else {
        // Fallback do starego podejścia
        deps.setShowForm(true);
        deps.setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error showing form:", error);
      deps.setIsProcessing(false);
    }
  }, [userId, deps]);

  return {
    handleChoiceSelection,
    handleExistingAudienceSelect,
    handleContinue,
    handleCreateNewAudience
  };
};
