
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
}: GeneratedScriptDialogProps) => {
  const { user } = useAuth();
  
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
    handleViewProject
  } = useScriptGeneration(open, targetAudienceId, templateId, advertisingGoal, user?.id);
  
  const showLoading = isLoading || isGeneratingNewScript;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-[700px] p-0 rounded-xl overflow-hidden ${showLoading ? 'bg-white' : ''}`}>
        {/* Show DialogHeader only when not loading */}
        {!showLoading && (
          <DialogHeader 
            currentHookIndex={currentHookIndex}
            totalHooks={totalHooks}
            isLoading={isLoading}
            isGeneratingNewScript={isGeneratingNewScript}
          />
        )}

        {showLoading ? (
          <LoadingState stage={isGeneratingNewScript ? 'script' : undefined} />
        ) : error ? (
          <ErrorState error={error} onRetry={handleRetry} />
        ) : (
          <>
            <ScriptDisplay 
              script={generatedScript} 
              bestHook={currentHook} 
              hookIndex={currentHookIndex}
              totalHooks={totalHooks}
            />
            
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
