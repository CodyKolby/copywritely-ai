
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { fetchExistingAudiences } from '../api';
import { toast } from 'sonner';
import { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';
import { EmailStyle } from '../../EmailStyleDialog';

export const useTargetAudienceDialog = ({ 
  open, 
  onOpenChange, 
  templateId, 
  userId,
  isPremium
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  userId: string;
  isPremium: boolean;
}) => {
  // Dialog state
  const [showForm, setShowForm] = useState(false);
  const [audienceChoice, setAudienceChoice] = useState<'existing' | 'new' | null>(null);
  const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(null);
  const [existingAudiences, setExistingAudiences] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Dialog flow state
  const [showScriptDialog, setShowScriptDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showEmailStyleDialog, setShowEmailStyleDialog] = useState(false);
  const [showSocialMediaPlatformDialog, setShowSocialMediaPlatformDialog] = useState(false);
  
  // Answer state
  const [advertisingGoal, setAdvertisingGoal] = useState('');
  const [emailStyle, setEmailStyle] = useState<EmailStyle | null>(null);
  const [socialMediaPlatform, setSocialMediaPlatform] = useState<SocialMediaPlatform | null>(null);
  
  const { session } = useAuth();

  useEffect(() => {
    if (open && userId) {
      fetchAudiences();
    }
    
    // Reset state when dialog opens or closes
    if (!open) {
      resetState();
    }

    // When template changes, reset all dialog states
    resetDialogStates();
  }, [open, userId, templateId]);

  const fetchAudiences = async () => {
    setIsLoading(true);
    try {
      const audiences = await fetchExistingAudiences(userId);
      setExistingAudiences(audiences);
    } catch (error) {
      console.error('Błąd pobierania grup docelowych:', error);
      toast.error('Błąd podczas pobierania zapisanych grup docelowych');
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setShowForm(false);
    setAudienceChoice(null);
    setSelectedAudienceId(null);
    setShowScriptDialog(false);
    setShowEmailDialog(false);
    setShowGoalDialog(false);
    setShowEmailStyleDialog(false);
    setShowSocialMediaPlatformDialog(false);
    setAdvertisingGoal('');
    setEmailStyle(null);
    setSocialMediaPlatform(null);
    setIsProcessing(false);
  };

  const resetDialogStates = () => {
    setShowScriptDialog(false);
    setShowEmailDialog(false);
    setShowGoalDialog(false);
    setShowEmailStyleDialog(false);
    setShowSocialMediaPlatformDialog(false);
    setAdvertisingGoal('');
    setEmailStyle(null);
    setSocialMediaPlatform(null);
  };

  // Choice selection handler
  const handleChoiceSelection = (choice: 'existing' | 'new') => {
    setAudienceChoice(choice);
  };

  // Handlers for existing audience selection
  const handleExistingAudienceSelect = (audienceId: string) => {
    setSelectedAudienceId(audienceId);
  };

  // Continue button handler
  const handleContinue = () => {
    if (!isPremium) {
      toast.warning('Ta funkcja jest dostępna tylko dla użytkowników Premium.');
      return;
    }
    
    // Set processing state for UI feedback
    setIsProcessing(true);
    
    // Always show goal dialog first
    setShowGoalDialog(true);
  };

  // Handler for creating a new audience
  const handleCreateNewAudience = () => {
    if (!isPremium) {
      toast.warning('Ta funkcja jest dostępna tylko dla użytkowników Premium.');
      return;
    }
    
    setShowForm(true);
  };

  // Form submission handler
  const handleFormSubmit = async (formData: any) => {
    setIsProcessing(true);
    try {
      // Save the audience
      const response = await fetch('https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/create-target-audience', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          userId: userId,
          audience: formData
        })
      });

      if (!response.ok) {
        throw new Error('Wystąpił błąd podczas zapisywania grupy docelowej');
      }

      const data = await response.json();
      
      if (!data || !data.audience || !data.audience.id) {
        throw new Error('Nieprawidłowa odpowiedź z serwera');
      }
      
      setSelectedAudienceId(data.audience.id);
      
      // Always show goal dialog after form submission
      setShowForm(false);
      setShowGoalDialog(true);
      
    } catch (error) {
      console.error('Błąd zapisywania grupy docelowej:', error);
      toast.error('Błąd podczas zapisywania grupy docelowej');
      setIsProcessing(false);
    }
  };

  // Back button handler
  const handleBack = () => {
    setShowForm(false);
    setAudienceChoice(null);
    setIsProcessing(false);
  };

  // Goal submission handler
  const handleGoalSubmit = (goal: string) => {
    setAdvertisingGoal(goal);
    setShowGoalDialog(false);
    
    // Based on template type, show different dialogs
    if (templateId === 'social') {
      setShowSocialMediaPlatformDialog(true);
    } else if (templateId === 'email') {
      setShowEmailStyleDialog(true);
    } else {
      setShowScriptDialog(true);
    }
    
    setIsProcessing(false);
  };

  // Goal back button handler
  const handleGoalBack = () => {
    setShowGoalDialog(false);
    setIsProcessing(false);
  };

  // Email style submission handler
  const handleEmailStyleSubmit = (style: EmailStyle) => {
    setEmailStyle(style);
    setShowEmailStyleDialog(false);
    setShowEmailDialog(true);
    setIsProcessing(false);
  };

  // Email style back button handler
  const handleEmailStyleBack = () => {
    setShowEmailStyleDialog(false);
    setShowGoalDialog(true);
    setIsProcessing(false);
  };

  // Social media platform submission handler
  const handleSocialMediaPlatformSubmit = (platform: SocialMediaPlatform) => {
    setSocialMediaPlatform(platform);
    setShowSocialMediaPlatformDialog(false);
    setShowScriptDialog(true);
    setIsProcessing(false);
  };

  // Social media platform back button handler
  const handleSocialMediaPlatformBack = () => {
    setShowSocialMediaPlatformDialog(false);
    setShowGoalDialog(true);
    setIsProcessing(false);
  };

  // Script dialog close handler
  const handleScriptDialogClose = () => {
    setShowScriptDialog(false);
    resetState();
  };

  // Email dialog close handler
  const handleEmailDialogClose = () => {
    setShowEmailDialog(false);
    resetState();
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
    showSocialMediaPlatformDialog,
    advertisingGoal,
    emailStyle,
    socialMediaPlatform,
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
    handleSocialMediaPlatformSubmit,
    handleSocialMediaPlatformBack,
    handleScriptDialogClose,
    handleEmailDialogClose,
  };
};
