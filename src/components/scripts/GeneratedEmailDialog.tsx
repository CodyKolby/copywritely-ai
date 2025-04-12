
import React, { useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import LoadingState from './generated-email-dialog/LoadingState';
import EmailDisplay from './generated-email-dialog/EmailDisplay';
import { useAuth } from '@/contexts/auth/AuthContext';
import DialogHeader from './generated-email-dialog/DialogHeader';
import ErrorState from './generated-email-dialog/ErrorState';
import { useEmailGeneration } from './generated-email-dialog/useEmailGeneration';
import { EmailStyle } from './EmailStyleDialog';
import SubjectLineToggle from './generated-email-dialog/SubjectLineToggle';
import { toast } from 'sonner';

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
    alternativeSubject,
    isShowingAlternative,
    toggleSubjectLine,
    generatedEmail,
    error,
    projectSaved,
    handleRetry,
    handleViewProject,
    setGeneratedSubject,
    setGeneratedEmail,
    narrativeBlueprint,
    emailStructure,
    saveToProject,
    isSaving
  } = useEmailGeneration({
    open,
    targetAudienceId,
    templateId,
    advertisingGoal,
    emailStyle,
    userId: user?.id
  });

  // Debug save state changes
  useEffect(() => {
    console.log('EMAIL DIALOG: Save state change:', {
      isLoading, 
      hasError: !!error, 
      projectSaved, 
      isSaving,
      hasUser: !!user?.id
    });
  }, [isLoading, error, projectSaved, isSaving, user?.id]);
  
  // Usunięcie automatycznego zapisu, który powodował podwójne zapisywanie
  // Umieszczamy próbę zapisu tylko w kodzie useEmailGeneration.tsx
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-[700px] p-0 rounded-xl overflow-hidden ${isLoading ? 'bg-white' : ''}`}>
        {!isLoading && <DialogHeader isLoading={isLoading} />}

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={handleRetry} />
        ) : (
          <div className="p-6 max-h-[calc(90vh-100px)] overflow-y-auto">
            {alternativeSubject && (
              <SubjectLineToggle 
                currentSubject={generatedSubject}
                alternativeSubject={alternativeSubject}
                isShowingAlternative={isShowingAlternative}
                onToggle={toggleSubjectLine}
              />
            )}
            
            <EmailDisplay 
              subject={generatedSubject} 
              emailContent={generatedEmail} 
              onSubjectChange={setGeneratedSubject}
              onEmailContentChange={setGeneratedEmail}
              onViewProject={projectSaved ? handleViewProject : undefined}
            />
            
            {isSaving && (
              <div className="text-center mt-4 text-sm text-gray-500">
                Zapisywanie...
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GeneratedEmailDialog;
