
import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import LoadingState from './generated-script-dialog/LoadingState';
import ScriptDisplay from './generated-script-dialog/ScriptDisplay';
import { GeneratedScriptDialogProps } from './generated-script-dialog/types';
import { useAuth } from '@/contexts/auth/AuthContext';
import DialogHeader from './generated-script-dialog/DialogHeader';
import ErrorState from './generated-script-dialog/ErrorState';
import ActionButtons from './generated-script-dialog/ActionButtons';
import { useScriptGeneration } from './generated-script-dialog/useScriptGeneration';

const GeneratedScriptDialog = ({
  open,
  onOpenChange,
  targetAudienceId,
  templateId,
  advertisingGoal = '',
  socialMediaPlatform,
}: GeneratedScriptDialogProps) => {
  const { user } = useAuth();
  
  // Prevent duplicate renders by using a stable key
  const dialogKey = `${templateId}-${targetAudienceId}-${open ? 'open' : 'closed'}`;
  
  const {
    isLoading,
    generatedScript,
    currentHook,
    currentHookIndex,
    totalHooks,
    error,
    isGeneratingNewScript,
    isSaving,
    projectSaved,
    projectId,
    handleRetry,
    handleGenerateWithNextHook,
    handleViewProject,
    rawResponse,
    debugInfo
  } = useScriptGeneration(open, targetAudienceId, templateId, advertisingGoal, user?.id, socialMediaPlatform);
  
  const showLoading = isLoading || isGeneratingNewScript;
  const dialogId = 'script-dialog';
  const contentId = 'script-content';
  
  // Determine if this is a social media post
  const isSocialMediaPost = templateId === 'social';
  
  // Determine if this is an ad (PAS framework)
  const isAdTemplate = templateId === 'ad';
  
  // Determine the loading stage
  const loadingStage = isGeneratingNewScript ? 'script' : undefined;
  
  // Log the script generation state
  React.useEffect(() => {
    if (open) {
      console.log("Script generation dialog state:", {
        isLoading,
        templateId,
        isSocialMediaPost,
        isAdTemplate,
        currentHookIndex,
        totalHooks,
        error: error ? true : false,
        isGeneratingNewScript,
        projectSaved
      });
    }
  }, [open, isLoading, templateId, isSocialMediaPost, isAdTemplate, currentHookIndex, totalHooks, error, isGeneratingNewScript, projectSaved]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={dialogKey}>
      <DialogContent 
        className="max-w-[700px] p-0 rounded-xl overflow-hidden bg-white" 
        aria-describedby={contentId}
        id={dialogId}
      >
        <DialogTitle className="sr-only">Wygenerowany skrypt</DialogTitle>
        
        {/* Show DialogHeader only when not loading and not for social media posts */}
        {!showLoading && !isSocialMediaPost && (
          <DialogHeader 
            currentHookIndex={currentHookIndex}
            totalHooks={totalHooks}
            isLoading={isLoading}
            isGeneratingNewScript={isGeneratingNewScript}
          />
        )}

        {showLoading ? (
          <LoadingState stage={loadingStage} />
        ) : error ? (
          <ErrorState error={error} onRetry={handleRetry} />
        ) : (
          <>
            <div id={contentId}>
              <ScriptDisplay 
                script={generatedScript} 
                bestHook={currentHook} 
                hookIndex={currentHookIndex}
                totalHooks={totalHooks}
                adStructure={isSocialMediaPost ? 'social' : isAdTemplate ? 'PAS' : 'generic'}
                rawResponse={rawResponse}
                debugInfo={debugInfo}
              />
            </div>
            
            <ActionButtons 
              isSaving={isSaving}
              projectSaved={projectSaved}
              projectId={projectId}
              currentHookIndex={currentHookIndex}
              totalHooks={totalHooks}
              onGenerateNew={handleGenerateWithNextHook}
              onViewProject={handleViewProject}
              isGeneratingNewScript={isGeneratingNewScript}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GeneratedScriptDialog;
