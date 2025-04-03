
import { useState, useEffect, useCallback } from 'react';
import { fetchExistingAudiences } from './api';
import { toast } from 'sonner';
import { FormValues } from '../target-audience-form/types';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { TargetAudienceDialogOptions } from './types';
import { EmailStyle } from '../EmailStyleDialog';

// Type for audience choice in selection screen
export type AudienceChoice = 'existing' | 'new' | null;

export const useTargetAudienceDialog = ({ 
  open, 
  onOpenChange,
  templateId,
  userId,
  isPremium
}: TargetAudienceDialogOptions) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [existingAudiences, setExistingAudiences] = useState<any[]>([]);
  const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(null);
  const [audienceChoice, setAudienceChoice] = useState<AudienceChoice>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showScriptDialog, setShowScriptDialog] = useState<boolean>(false);
  const [showEmailDialog, setShowEmailDialog] = useState<boolean>(false);
  const [showGoalDialog, setShowGoalDialog] = useState<boolean>(false);
  const [showEmailStyleDialog, setShowEmailStyleDialog] = useState<boolean>(false);
  const [advertisingGoal, setAdvertisingGoal] = useState<string>('');
  const [emailStyle, setEmailStyle] = useState<EmailStyle | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      loadExistingAudiences();
    } else {
      resetState();
    }
  }, [open, userId]);

  const resetState = () => {
    setShowForm(false);
    setShowScriptDialog(false);
    setShowEmailDialog(false);
    setShowGoalDialog(false);
    setShowEmailStyleDialog(false);
    setAudienceChoice(null);
    setSelectedAudienceId(null);
    setAdvertisingGoal('');
    setEmailStyle(null);
    setIsProcessing(false);
  };

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
  }, [userId]);

  // Handle audience choice selection (new or existing)
  const handleChoiceSelection = (choice: AudienceChoice) => {
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
    if (audienceChoice === 'new') {
      setShowForm(true);
    } else if (audienceChoice === 'existing' && selectedAudienceId) {
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
    if (isProcessing) return;
    
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
    isLoading,
    showForm,
    audienceChoice,
    selectedAudienceId,
    existingAudiences,
    showScriptDialog,
    showEmailDialog,
    showGoalDialog,
    showEmailStyleDialog,
    advertisingGoal,
    emailStyle,
    isProcessing,
    handleChoiceSelection,
    handleExistingAudienceSelect,
    handleContinue,
    handleCreateNewAudience,
    handleFormSubmit,
    handleBack,
    handleGoalSubmit,
    handleGoalBack,
    handleEmailStyleSubmit,
    handleEmailStyleBack,
    handleScriptDialogClose,
    handleEmailDialogClose,
  };
};
