
import { EmailStyle } from '../../EmailStyleDialog';

/**
 * Hook for managing navigation between different dialog screens
 */
export const useDialogNavigation = (
  state: {
    setShowForm: (show: boolean) => void;
    setShowGoalDialog: (show: boolean) => void;
    setShowEmailStyleDialog: (show: boolean) => void;
    setShowScriptDialog: (show: boolean) => void;
    setShowEmailDialog: (show: boolean) => void;
    setAdvertisingGoal: (goal: string) => void;
    setEmailStyle: (style: EmailStyle | null) => void;
  },
  templateId: string
) => {
  const {
    setShowForm,
    setShowGoalDialog,
    setShowEmailStyleDialog,
    setShowScriptDialog,
    setShowEmailDialog,
    setAdvertisingGoal,
    setEmailStyle
  } = state;

  // Handle back button click in form
  const handleBack = () => {
    setShowForm(false);
  };

  // Handle goal dialog submission
  const handleGoalSubmit = (goal: string) => {
    setAdvertisingGoal(goal);
    
    // If template is email, show email style dialog next
    if (templateId === 'email') {
      setShowGoalDialog(false);
      setShowEmailStyleDialog(true);
    } else {
      // For other templates, show script dialog directly
      setShowGoalDialog(false);
      setShowScriptDialog(true);
    }
  };

  // Handle back button click in goal dialog
  const handleGoalBack = () => {
    setShowGoalDialog(false);
  };

  // Handle email style dialog submission
  const handleEmailStyleSubmit = (style: EmailStyle) => {
    setEmailStyle(style);
    setShowEmailStyleDialog(false);
    setShowEmailDialog(true);
  };

  // Handle back button click in email style dialog
  const handleEmailStyleBack = () => {
    setShowEmailStyleDialog(false);
    setShowGoalDialog(true);
  };

  // Handle script dialog close
  const handleScriptDialogClose = () => {
    setShowScriptDialog(false);
  };

  // Handle email dialog close
  const handleEmailDialogClose = () => {
    setShowEmailDialog(false);
  };

  return {
    handleBack,
    handleGoalSubmit,
    handleGoalBack,
    handleEmailStyleSubmit,
    handleEmailStyleBack,
    handleScriptDialogClose,
    handleEmailDialogClose,
  };
};
