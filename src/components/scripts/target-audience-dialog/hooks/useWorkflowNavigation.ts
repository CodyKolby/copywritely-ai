
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AudienceChoice } from '../types';
import { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';
import { EmailStyle } from '../../EmailStyleDialog';

interface WorkflowNavigationProps {
  isPremium: boolean;
  audienceChoice: AudienceChoice;
  selectedAudienceId: string | null;
  onOpenChange: (open: boolean) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setIsTransitioning: (isTransitioning: boolean) => void;
  setShowForm: (show: boolean) => void;
  setShowGoalDialog: (show: boolean) => void;
  setShowEmailStyleDialog: (show: boolean) => void;
  setShowSocialMediaPlatformDialog: (show: boolean) => void;
  setShowScriptDialog: (show: boolean) => void;
  setShowEmailDialog: (show: boolean) => void;
  setShowSocialDialog: (show: boolean) => void;
  templateId: string;
}

/**
 * Hook for handling workflow navigation
 */
export const useWorkflowNavigation = ({
  isPremium,
  audienceChoice,
  selectedAudienceId,
  onOpenChange,
  setIsProcessing,
  setIsTransitioning,
  setShowForm,
  setShowGoalDialog,
  setShowEmailStyleDialog,
  setShowSocialMediaPlatformDialog,
  setShowScriptDialog,
  setShowEmailDialog,
  setShowSocialDialog,
  templateId
}: WorkflowNavigationProps) => {
  const navigate = useNavigate();

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

  return {
    handleContinue,
    goToNextStep,
    handleCreateNewAudience
  };
};
