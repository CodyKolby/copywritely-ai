
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import LoadingState from './generated-email-dialog/LoadingState';
import EmailDisplay from './generated-email-dialog/EmailDisplay';
import { useAuth } from '@/contexts/auth/AuthContext';
import DialogHeader from './generated-email-dialog/DialogHeader';
import ErrorState from './generated-email-dialog/ErrorState';
import { useEmailGeneration } from './generated-email-dialog/useEmailGeneration';
import { EmailStyle } from './EmailStyleDialog';

interface GeneratedEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetAudienceId: string;
  templateId: string;
  advertisingGoal: string;
  emailStyle: EmailStyle;
}

const GeneratedEmailDialog = ({
  open,
  onOpenChange,
  targetAudienceId,
  templateId,
  advertisingGoal,
  emailStyle,
}: GeneratedEmailDialogProps) => {
  const { user } = useAuth();
  
  const {
    isLoading,
    generatedSubject,
    generatedEmail,
    error,
    isSaving,
    projectSaved,
    handleRetry,
    saveToProject,
    handleViewProject,
    setGeneratedSubject,
    setGeneratedEmail
  } = useEmailGeneration({
    open,
    targetAudienceId,
    templateId,
    advertisingGoal,
    emailStyle,
    userId: user?.id
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-auto p-0">
        <DialogHeader isLoading={isLoading} />

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={handleRetry} />
        ) : (
          <div className="p-6">
            <EmailDisplay 
              subject={generatedSubject} 
              emailContent={generatedEmail} 
              onSubjectChange={setGeneratedSubject}
              onEmailContentChange={setGeneratedEmail}
              onSaveToProject={saveToProject}
              isSaving={isSaving}
              projectSaved={projectSaved}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GeneratedEmailDialog;
