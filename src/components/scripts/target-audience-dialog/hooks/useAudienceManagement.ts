
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';

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

  // Choice selection handler - WAŻNE: musi resetować isProcessing
  const handleChoiceSelection = (choice: 'existing' | 'new') => {
    deps.setAudienceChoice(choice);
    deps.setIsProcessing(false); // Reset processing state when changing choice
  };

  // Handlers for existing audience selection - WAŻNE: musi resetować isProcessing
  const handleExistingAudienceSelect = (audienceId: string) => {
    deps.setSelectedAudienceId(audienceId);
    deps.setIsProcessing(false); // Reset processing state when changing selection
  };

  // Continue button handler - używa mechanizmu przejść sekwencyjnych
  const handleContinue = () => {
    if (!userId) {
      toast.error('Musisz być zalogowany, aby kontynuować');
      return;
    }
    
    try {
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
  };

  // Handler for creating a new audience
  const handleCreateNewAudience = () => {
    if (!userId) {
      toast.error('Musisz być zalogowany, aby kontynuować');
      return;
    }
    
    try {
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
  };

  return {
    handleChoiceSelection,
    handleExistingAudienceSelect,
    handleContinue,
    handleCreateNewAudience
  };
};
