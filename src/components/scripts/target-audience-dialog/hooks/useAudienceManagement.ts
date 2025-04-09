
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
  audienceChoice: 'existing' | 'new' | null;
  selectedAudienceId: string | null;
}

export const useAudienceManagement = (
  userId: string,
  deps: AudienceManagementDeps
) => {
  const { session } = useAuth();

  // Choice selection handler
  const handleChoiceSelection = (choice: 'existing' | 'new') => {
    deps.setAudienceChoice(choice);
    deps.setIsProcessing(false); // Reset processing state when changing choice
  };

  // Handlers for existing audience selection
  const handleExistingAudienceSelect = (audienceId: string) => {
    deps.setSelectedAudienceId(audienceId);
    deps.setIsProcessing(false); // Reset processing state when changing selection
  };

  // Continue button handler
  const handleContinue = () => {
    if (!userId) {
      toast.error('Musisz być zalogowany, aby kontynuować');
      return;
    }
    
    try {
      // Set processing state for UI feedback
      deps.setIsProcessing(true);
      
      // Always show goal dialog next
      deps.setShowGoalDialog(true);
      
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
      deps.setShowForm(true);
      deps.setIsProcessing(false); // Reset processing state when showing form
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
