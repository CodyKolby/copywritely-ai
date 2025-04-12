
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import LoadingState from './generated-script-dialog/LoadingState';
import ScriptDisplay from './generated-script-dialog/ScriptDisplay';
import { GeneratedScriptDialogProps } from './generated-script-dialog/types';
import { useAuth } from '@/contexts/auth/AuthContext';
import DialogHeader from './generated-script-dialog/DialogHeader';
import ErrorState from './generated-script-dialog/ErrorState';
import ActionButtons from './generated-script-dialog/ActionButtons';
import { useScriptGeneration } from './generated-script-dialog/useScriptGeneration';
import { toast } from 'sonner';

interface ExtendedScriptDialogProps extends GeneratedScriptDialogProps {
  existingProject?: {
    id: string;
    title: string;
    content: string;
  };
}

const GeneratedScriptDialog = ({
  open,
  onOpenChange,
  targetAudienceId,
  templateId,
  advertisingGoal = '',
  socialMediaPlatform,
  existingProject
}: ExtendedScriptDialogProps) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  
  // Prevent duplicate renders by using a stable key
  const dialogKey = `${templateId}-${targetAudienceId}-${open ? 'open' : 'closed'}-${existingProject?.id || 'new'}`;
  
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
  } = useScriptGeneration(
    open, 
    targetAudienceId, 
    templateId, 
    advertisingGoal, 
    user?.id, 
    socialMediaPlatform,
    existingProject
  );
  
  const showLoading = isLoading || isGeneratingNewScript;
  const dialogId = 'script-dialog';
  const contentId = 'script-content';
  
  // Determine if this is a social media post
  const isSocialMediaPost = templateId === 'social';
  
  // Determine if this is an ad (PAS framework)
  const isAdTemplate = templateId === 'ad';

  // Handle copy to clipboard
  const handleCopyToClipboard = async () => {
    if (generatedScript) {
      try {
        await navigator.clipboard.writeText(generatedScript);
        setCopied(true);
        toast.success('Skopiowano do schowka');
        
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      }
      catch (err) {
        toast.error('Nie udało się skopiować do schowka');
      }
    }
  };

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
          <LoadingState />
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
              />
            </div>
            
            <ActionButtons 
              isSaving={isSaving}
              projectSaved={projectSaved}
              projectId={projectId}
              currentHookIndex={currentHookIndex}
              totalHooks={totalHooks}
              onGenerateNew={!existingProject ? handleGenerateWithNextHook : undefined}
              onViewProject={handleCopyToClipboard}
              isGeneratingNewScript={isGeneratingNewScript}
              copied={copied}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GeneratedScriptDialog;
