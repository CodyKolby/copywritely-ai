
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchExistingAudiences } from './api';
import { AudienceChoice } from './types';
import { EmailStyle } from '../EmailStyleDialog';
import { SocialMediaPlatform } from '../SocialMediaPlatformDialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  userId: string;
  isPremium: boolean;
}

// Define the return type inline instead of importing a non-existent type
interface UseTargetAudienceDialogReturn {
  isLoading: boolean;
  showForm: boolean;
  audienceChoice: AudienceChoice;
  selectedAudienceId: string | null;
  existingAudiences: any[];
  showScriptDialog: boolean;
  showEmailDialog: boolean;
  showSocialDialog: boolean;
  showGoalDialog: boolean;
  showEmailStyleDialog: boolean;
  showSocialMediaPlatformDialog: boolean;
  advertisingGoal: string;
  emailStyle: string;
  socialMediaPlatform: SocialMediaPlatform | undefined;
  isProcessing: boolean;
  isTransitioning: boolean;
  handleChoiceSelection: (choice: AudienceChoice) => void;
  handleExistingAudienceSelect: (id: string) => void;
  handleContinue: () => void;
  handleCreateNewAudience: () => void;
  handleFormSubmit: (audienceId: string) => void;
  handleBack: () => void;
  handleGoalSubmit: (goal: string) => void;
  handleGoalBack: () => void;
  handleEmailStyleSubmit: (style: EmailStyle) => void;
  handleEmailStyleBack: () => void;
  handleSocialMediaPlatformSubmit: (platform: SocialMediaPlatform) => void;
  handleSocialMediaPlatformBack: () => void;
  handleScriptDialogClose: () => void;
  handleEmailDialogClose: () => void;
  handleSocialDialogClose: () => void;
  resetState: () => void;
}

export function useTargetAudienceDialog({
  open,
  onOpenChange,
  templateId,
  userId,
  isPremium
}: Props): UseTargetAudienceDialogReturn {
  // State for audience selection
  const [audienceChoice, setAudienceChoice] = useState<AudienceChoice>(null);
  const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(null);
  
  // State for dialog visibility
  const [showForm, setShowForm] = useState(false);
  const [showScriptDialog, setShowScriptDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showSocialDialog, setShowSocialDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showEmailStyleDialog, setShowEmailStyleDialog] = useState(false);
  const [showSocialMediaPlatformDialog, setShowSocialMediaPlatformDialog] = useState(false);
  
  // State for additional parameters
  const [advertisingGoal, setAdvertisingGoal] = useState<string>('');
  const [emailStyle, setEmailStyle] = useState<string>('direct-sales');
  const [socialMediaPlatform, setSocialMediaPlatform] = useState<SocialMediaPlatform | undefined>(undefined);
  
  // State for loading and transitions
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const navigate = useNavigate();

  // Fetch existing target audiences
  const { data: existingAudiences = [], isLoading } = useQuery({
    queryKey: ['targetAudiences', userId],
    queryFn: () => fetchExistingAudiences(userId),
    enabled: !!userId && open,
    staleTime: 30000, // 30 seconds
  });

  // Reset state when dialog is closed
  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  // Reset state function
  const resetState = useCallback(() => {
    setAudienceChoice(null);
    setSelectedAudienceId(null);
    setShowForm(false);
    setShowScriptDialog(false);
    setShowEmailDialog(false);
    setShowSocialDialog(false);
    setShowGoalDialog(false);
    setShowEmailStyleDialog(false);
    setShowSocialMediaPlatformDialog(false);
    setAdvertisingGoal('');
    setEmailStyle('direct-sales');
    setSocialMediaPlatform(undefined);
    setIsProcessing(false);
    setIsTransitioning(false);
  }, []);

  // Handle audience choice selection
  const handleChoiceSelection = useCallback((choice: AudienceChoice) => {
    setAudienceChoice(choice);
    if (choice === 'new') {
      setSelectedAudienceId(null);
    }
  }, []);

  // Handle existing audience selection
  const handleExistingAudienceSelect = useCallback((id: string) => {
    setSelectedAudienceId(id);
  }, []);

  // Handle continue button click
  const handleContinue = useCallback(() => {
    if (!isPremium) {
      navigate('/pricing');
      onOpenChange(false);
      return;
    }

    setIsProcessing(true);
    
    if (audienceChoice === 'new') {
      // Show the form to create a new audience
      setIsTransitioning(true);
      setTimeout(() => {
        setShowForm(true);
        setIsTransitioning(false);
        setIsProcessing(false);
      }, 300);
    } else if (audienceChoice === 'existing' && selectedAudienceId) {
      // Move to the next step in the workflow
      goToNextStep();
    }
  }, [audienceChoice, selectedAudienceId, isPremium, navigate, onOpenChange]);

  // Go to the next step in the workflow
  const goToNextStep = useCallback(() => {
    setIsTransitioning(true);
    
    // Different workflows based on template type
    if (templateId === 'email') {
      // Email workflow: audience -> goal -> email style -> generate email
      setTimeout(() => {
        setShowGoalDialog(true);
        setIsTransitioning(false);
        setIsProcessing(false);
      }, 300);
    } else if (templateId === 'social') {
      // Social media workflow: audience -> goal -> platform -> generate social post
      setTimeout(() => {
        setShowGoalDialog(true);
        setIsTransitioning(false);
        setIsProcessing(false);
      }, 300);
    } else {
      // Default workflow: audience -> goal -> generate script
      setTimeout(() => {
        setShowGoalDialog(true);
        setIsTransitioning(false);
        setIsProcessing(false);
      }, 300);
    }
  }, [templateId]);

  // Handle create new audience button
  const handleCreateNewAudience = useCallback(() => {
    setIsProcessing(true);
    setIsTransitioning(true);
    setTimeout(() => {
      setShowForm(true);
      setIsTransitioning(false);
      setIsProcessing(false);
    }, 300);
  }, []);

  // Handle form submission
  const handleFormSubmit = useCallback((audienceId: string) => {
    setSelectedAudienceId(audienceId);
    setIsProcessing(true);
    
    // Hide the form and go to the next step
    setIsTransitioning(true);
    setTimeout(() => {
      setShowForm(false);
      goToNextStep();
    }, 300);
  }, [goToNextStep]);

  // Handle back button in form
  const handleBack = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowForm(false);
      setIsTransitioning(false);
    }, 300);
  }, []);

  // Handle goal submission
  const handleGoalSubmit = useCallback((goal: string) => {
    setAdvertisingGoal(goal);
    setIsProcessing(true);
    setIsTransitioning(true);
    
    // Different next steps based on template
    if (templateId === 'email') {
      // For email, go to email style selection
      setTimeout(() => {
        setShowGoalDialog(false);
        setShowEmailStyleDialog(true);
        setIsTransitioning(false);
        setIsProcessing(false);
      }, 300);
    } else if (templateId === 'social') {
      // For social, go to platform selection
      setTimeout(() => {
        setShowGoalDialog(false);
        setShowSocialMediaPlatformDialog(true);
        setIsTransitioning(false);
        setIsProcessing(false);
      }, 300);
    } else {
      // For other templates, go straight to script generation
      setTimeout(() => {
        setShowGoalDialog(false);
        setShowScriptDialog(true);
        setIsTransitioning(false);
        setIsProcessing(false);
      }, 300);
    }
  }, [templateId]);

  // Handle back button in goal dialog
  const handleGoalBack = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowGoalDialog(false);
      setIsTransitioning(false);
    }, 300);
  }, []);

  // Handle email style submission
  const handleEmailStyleSubmit = useCallback((style: EmailStyle) => {
    setEmailStyle(style);
    setIsProcessing(true);
    setIsTransitioning(true);
    setTimeout(() => {
      setShowEmailStyleDialog(false);
      setShowEmailDialog(true);
      setIsTransitioning(false);
      setIsProcessing(false);
    }, 300);
  }, []);

  // Handle back button in email style dialog
  const handleEmailStyleBack = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowEmailStyleDialog(false);
      setShowGoalDialog(true);
      setIsTransitioning(false);
    }, 300);
  }, []);

  // Handle social media platform submission
  const handleSocialMediaPlatformSubmit = useCallback((platform: SocialMediaPlatform) => {
    setSocialMediaPlatform(platform);
    setIsProcessing(true);
    setIsTransitioning(true);
    setTimeout(() => {
      setShowSocialMediaPlatformDialog(false);
      setShowSocialDialog(true);
      setIsTransitioning(false);
      setIsProcessing(false);
    }, 300);
  }, []);

  // Handle back button in social media platform dialog
  const handleSocialMediaPlatformBack = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowSocialMediaPlatformDialog(false);
      setShowGoalDialog(true);
      setIsTransitioning(false);
    }, 300);
  }, []);

  // Handle script dialog close
  const handleScriptDialogClose = useCallback(() => {
    setShowScriptDialog(false);
  }, []);

  // Handle email dialog close
  const handleEmailDialogClose = useCallback(() => {
    setShowEmailDialog(false);
  }, []);
  
  // Handle social dialog close
  const handleSocialDialogClose = useCallback(() => {
    setShowSocialDialog(false);
  }, []);

  return {
    isLoading,
    showForm,
    audienceChoice,
    selectedAudienceId,
    existingAudiences,
    showScriptDialog,
    showEmailDialog,
    showSocialDialog,
    showGoalDialog,
    showEmailStyleDialog,
    showSocialMediaPlatformDialog,
    advertisingGoal,
    emailStyle,
    socialMediaPlatform,
    isProcessing,
    isTransitioning,
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
    handleSocialDialogClose,
    resetState,
  };
}
