
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { checkPremiumStatus } from '@/contexts/auth/premium-utils';
import { TargetAudienceDialogProps } from './types';

export const useTargetAudienceDialog = ({
  open,
  onOpenChange,
  templateId,
  userId,
  isPremium
}: TargetAudienceDialogProps) => {
  const [showForm, setShowForm] = useState(false);
  const [audienceChoice, setAudienceChoice] = useState<'existing' | 'new' | null>(null);
  const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(null);
  const [existingAudiences, setExistingAudiences] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showScriptDialog, setShowScriptDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [advertisingGoal, setAdvertisingGoal] = useState<string>('');
  const [emailStyle, setEmailStyle] = useState<string | null>(null);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showEmailStyleDialog, setShowEmailStyleDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verifiedPremium, setVerifiedPremium] = useState<boolean | null>(null);

  // Verify premium status when dialog opens
  useEffect(() => {
    if (open && userId) {
      // Verify premium status again to be sure
      const verifyPremium = async () => {
        try {
          // First check database directly for fastest response
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('is_premium')
            .eq('id', userId)
            .single();
            
          if (!error && profile?.is_premium) {
            console.log('[TARGET-AUDIENCE] Premium confirmed from database');
            setVerifiedPremium(true);
            return;
          }
          
          // If not confirmed from database, use the full check
          const result = await checkPremiumStatus(userId, false);
          setVerifiedPremium(result);
        } catch (e) {
          console.error('[TARGET-AUDIENCE] Error verifying premium:', e);
          // Fallback to prop
          setVerifiedPremium(isPremium);
        }
      };
      
      verifyPremium();
    }
  }, [open, userId, isPremium]);

  // Fetch existing target audiences when dialog opens
  useEffect(() => {
    if (open && userId) {
      fetchExistingAudiences();
    }
  }, [open, userId]);

  const fetchExistingAudiences = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('target_audiences')
        .select('id, name, age_range, gender')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setExistingAudiences(data || []);
    } catch (error) {
      console.error('Error fetching target audiences:', error);
      toast.error('Nie udało się pobrać grup docelowych');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoiceSelection = (choice: 'existing' | 'new') => {
    setAudienceChoice(choice);
  };

  const handleExistingAudienceSelect = (id: string) => {
    setSelectedAudienceId(id);
  };

  const handleContinue = () => {
    // Final premium check before proceeding
    if (!isPremium && !verifiedPremium) {
      onOpenChange(false);
      toast.error('Ta funkcja wymaga konta Premium', {
        description: 'Wykup subskrypcję, aby uzyskać dostęp do tej funkcji.',
        dismissible: true
      });
      return;
    }
    
    if (audienceChoice === 'existing' && selectedAudienceId) {
      handleNextStep();
    } else if (audienceChoice === 'new') {
      setShowForm(true);
    } else {
      toast.error('Wybierz istniejącą grupę docelową lub utwórz nową');
    }
  };

  const handleCreateNewAudience = () => {
    // Final premium check before proceeding
    if (!isPremium && !verifiedPremium) {
      onOpenChange(false);
      toast.error('Ta funkcja wymaga konta Premium', {
        description: 'Wykup subskrypcję, aby uzyskać dostęp do tej funkcji.',
        dismissible: true
      });
      return;
    }
    
    setShowForm(true);
  };

  const handleFormSubmit = async (values: any) => {
    setIsProcessing(true);
    
    try {
      // Store the target audience in the database
      const { data, error } = await supabase
        .from('target_audiences')
        .insert({
          ...values,
          user_id: userId
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      setSelectedAudienceId(data.id);
      handleNextStep();
    } catch (error) {
      console.error('Error creating target audience:', error);
      toast.error('Nie udało się utworzyć grupy docelowej');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextStep = () => {
    if (templateId === 'email') {
      setShowEmailStyleDialog(true);
    } else {
      setShowGoalDialog(true);
    }
    setShowForm(false);
  };

  const handleBack = () => {
    setShowForm(false);
    setAudienceChoice(null);
    setSelectedAudienceId(null);
  };

  const handleGoalSubmit = (values: { objective: string }) => {
    setAdvertisingGoal(values.objective);
    setShowGoalDialog(false);
    setShowScriptDialog(true);
    onOpenChange(false);
  };

  const handleGoalBack = () => {
    setShowGoalDialog(false);
    if (audienceChoice === 'new') {
      setShowForm(true);
    } else {
      setShowForm(false);
      setAudienceChoice('existing');
    }
  };

  const handleEmailStyleSubmit = (values: { style: string }) => {
    setEmailStyle(values.style);
    setShowEmailStyleDialog(false);
    setShowEmailDialog(true);
    onOpenChange(false);
  };

  const handleEmailStyleBack = () => {
    setShowEmailStyleDialog(false);
    if (audienceChoice === 'new') {
      setShowForm(true);
    } else {
      setShowForm(false);
      setAudienceChoice('existing');
    }
  };

  const handleScriptDialogClose = () => {
    setShowScriptDialog(false);
    setSelectedAudienceId(null);
    setAdvertisingGoal('');
  };

  const handleEmailDialogClose = () => {
    setShowEmailDialog(false);
    setSelectedAudienceId(null);
    setEmailStyle(null);
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
