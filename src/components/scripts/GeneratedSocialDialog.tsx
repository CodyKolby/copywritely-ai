
import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth/AuthContext';
import { SocialMediaPlatform } from './SocialMediaPlatformDialog';
import { useSocialGeneration } from './generated-social-dialog/useSocialGeneration';
import DialogHeader from './generated-social-dialog/DialogHeader';
import SocialDisplay from './generated-social-dialog/SocialDisplay';
import LoadingState from './generated-social-dialog/LoadingState';
import ErrorState from './generated-social-dialog/ErrorState';
import ActionButtons from './generated-social-dialog/ActionButtons';

interface GeneratedSocialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetAudienceId: string;
  templateId: string;
  advertisingGoal?: string;
  platform?: SocialMediaPlatform;
}

const GeneratedSocialDialog = ({
  open,
  onOpenChange,
  targetAudienceId,
  templateId,
  advertisingGoal = '',
  platform,
}: GeneratedSocialDialogProps) => {
  const { user } = useAuth();
  
  // Prevent duplicate renders by using a stable key
  const dialogKey = `${templateId}-${targetAudienceId}-${open ? 'open' : 'closed'}`;
  
  const {
    isLoading,
    error,
    generatedContent,
    isGeneratingNewContent,
    isSaving,
    projectSaved,
    projectId,
    hookResponse,
    handleRetry,
    saveToProject,
    handleViewProject,
  } = useSocialGeneration({
    open,
    targetAudienceId,
    templateId,
    advertisingGoal,
    platform,
    userId: user?.id
  });
  
  const showLoading = isLoading || isGeneratingNewContent;
  const dialogId = 'social-dialog';
  const contentId = 'social-content';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={dialogKey}>
      <DialogContent 
        className="max-w-[700px] p-0 rounded-xl overflow-hidden bg-white" 
        aria-describedby={contentId}
        id={dialogId}
      >
        <DialogTitle className="sr-only">Wygenerowany post w social media</DialogTitle>
        
        {!showLoading && (
          <DialogHeader />
        )}

        {showLoading ? (
          <LoadingState stage={isGeneratingNewContent ? 'content' : undefined} />
        ) : error ? (
          <ErrorState error={error} onRetry={handleRetry} />
        ) : (
          <>
            <div id={contentId}>
              <SocialDisplay 
                platform={platform?.label || 'Meta'}
                content={generatedContent} 
                finalIntro={hookResponse?.finalIntro}
              />
            </div>
            
            <ActionButtons 
              isSaving={isSaving}
              projectSaved={projectSaved}
              projectId={projectId}
              onViewProject={handleViewProject}
              isGeneratingNewContent={isGeneratingNewContent}
              onSave={saveToProject}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GeneratedSocialDialog;
