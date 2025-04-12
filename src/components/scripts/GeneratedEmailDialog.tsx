
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import LoadingState from './generated-email-dialog/LoadingState';
import EmailDisplay from './generated-email-dialog/EmailDisplay';
import { useAuth } from '@/contexts/auth/AuthContext';
import DialogHeader from './generated-email-dialog/DialogHeader';
import ErrorState from './generated-email-dialog/ErrorState';
import { useEmailGeneration } from './generated-email-dialog/useEmailGeneration';
import { EmailStyle } from './EmailStyleDialog';
import SubjectLineToggle from './generated-email-dialog/SubjectLineToggle';

interface GeneratedEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetAudienceId: string;
  templateId: string;
  advertisingGoal: string;
  emailStyle: EmailStyle;
  existingProject?: {
    id: string;
    title: string;
    content: string;
    subject?: string;
    alternativeSubject?: string;
  };
}

const GeneratedEmailDialog = ({
  open,
  onOpenChange,
  targetAudienceId,
  templateId,
  advertisingGoal,
  emailStyle,
  existingProject
}: GeneratedEmailDialogProps) => {
  const { user } = useAuth();
  const [showAlternativeSubject, setShowAlternativeSubject] = useState(false);
  
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
    setAlternativeSubject
  } = useEmailGeneration({
    open,
    targetAudienceId,
    templateId,
    advertisingGoal,
    emailStyle,
    userId: user?.id,
    existingProject
  });

  // Check if we have an existing project with stored alternative subject
  useEffect(() => {
    if (existingProject && open) {
      // Check if there's an alternative subject in the project
      if (existingProject.alternativeSubject) {
        setAlternativeSubject(existingProject.alternativeSubject);
        setShowAlternativeSubject(true);
      } else if (alternativeSubject) {
        // If not in existingProject but we have one from generation
        setShowAlternativeSubject(true);
      }
    }
  }, [existingProject, open, alternativeSubject, setAlternativeSubject]);
  
  // Only show the dialog content after loading or if there's an error
  // This prevents showing empty content briefly during load
  const showContent = !isLoading || error;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-[700px] p-0 rounded-xl overflow-hidden ${isLoading ? 'bg-white' : ''}`}>
        {showContent && <DialogHeader isLoading={isLoading} />}

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={handleRetry} />
        ) : (
          <div className="p-6 max-h-[calc(90vh-100px)] overflow-y-auto">
            {(showAlternativeSubject || alternativeSubject) && (
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
              onViewProject={null} // Set to null to remove the button
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GeneratedEmailDialog;
