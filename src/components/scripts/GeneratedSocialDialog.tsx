
import React, { useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useScriptGeneration } from './generated-script-dialog/useScriptGeneration';
import { useAuth } from '@/contexts/auth/AuthContext';
import LoadingState from './generated-script-dialog/LoadingState';
import ScriptDisplay from './generated-script-dialog/ScriptDisplay';
import ErrorState from './generated-script-dialog/ErrorState';
import ActionButtons from './generated-script-dialog/ActionButtons';
import { SocialMediaPlatform } from './SocialMediaPlatformDialog';

interface GeneratedSocialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetAudienceId: string;
  templateId: string;
  advertisingGoal: string;
  platform?: SocialMediaPlatform;
}

const GeneratedSocialDialog: React.FC<GeneratedSocialDialogProps> = ({
  open,
  onOpenChange,
  targetAudienceId,
  templateId,
  advertisingGoal,
  platform,
}) => {
  const { user } = useAuth();
  
  // Use the script generation hook
  const {
    isLoading,
    generatedScript,
    currentHook,
    error,
    isGeneratingNewScript,
    isSaving,
    projectSaved,
    projectId,
    handleRetry,
    handleViewProject,
  } = useScriptGeneration(open, targetAudienceId, templateId, advertisingGoal, user?.id, platform);
  
  const showLoading = isLoading || isGeneratingNewScript;
  const dialogId = 'social-dialog';
  const contentId = 'social-content';
  
  // Log the script generation state
  React.useEffect(() => {
    if (open) {
      console.log("Social post generation dialog state:", {
        isLoading,
        templateId,
        platform: platform?.label || 'unknown',
        advertisingGoal,
        error: error ? true : false,
        isGeneratingNewScript,
        projectSaved
      });
    }
  }, [open, isLoading, templateId, platform, advertisingGoal, error, isGeneratingNewScript, projectSaved]);

  // Generate a stable key for the dialog
  const dialogKey = `${templateId}-${targetAudienceId}-${platform?.key || 'unknown'}-${open ? 'open' : 'closed'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={dialogKey}>
      <DialogContent 
        className="max-w-[700px] p-0 rounded-xl overflow-hidden bg-white" 
        aria-describedby={contentId}
        id={dialogId}
      >
        <DialogTitle className="sr-only">Wygenerowany post dla {platform?.label || 'mediów społecznościowych'}</DialogTitle>
        
        {showLoading ? (
          <LoadingState stage="script" />
        ) : error ? (
          <ErrorState error={error} onRetry={handleRetry} />
        ) : (
          <>
            <div id={contentId}>
              <ScriptDisplay 
                script={generatedScript} 
                bestHook={currentHook} 
                adStructure="social"
              />
            </div>
            
            <ActionButtons 
              isSaving={isSaving}
              projectSaved={projectSaved}
              projectId={projectId}
              onViewProject={handleViewProject}
              isGeneratingNewScript={isGeneratingNewScript}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GeneratedSocialDialog;
