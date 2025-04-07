
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import LoadingState from './generated-email-dialog/LoadingState';
import EmailDisplay from './generated-email-dialog/EmailDisplay';
import { useAuth } from '@/contexts/auth/AuthContext';
import DialogHeader from './generated-email-dialog/DialogHeader';
import ErrorState from './generated-email-dialog/ErrorState';
import { useEmailGeneration } from './generated-email-dialog/useEmailGeneration';
import { EmailStyle } from './EmailStyleDialog';
import SubjectLineToggle from './generated-email-dialog/SubjectLineToggle';
import { Badge } from '@/components/ui/badge';

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
    isSaving,
    projectSaved,
    handleRetry,
    saveToProject,
    handleViewProject,
    setGeneratedSubject,
    setGeneratedEmail,
    narrativeBlueprint,
    emailStructure
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
      <DialogContent className={`max-w-[700px] p-0 rounded-xl overflow-hidden ${isLoading ? 'bg-white' : ''}`}>
        {!isLoading && <DialogHeader isLoading={isLoading} />}

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={handleRetry} />
        ) : (
          <div className="p-6 max-h-[calc(90vh-100px)] overflow-y-auto">
            {narrativeBlueprint && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">Blueprint narracyjny:</h3>
                  <Badge variant={emailStructure === 'PAS' ? 'default' : 'secondary'} className="ml-2">
                    Struktura: {emailStructure === 'PAS' ? 'Problem-Agitacja-Rozwiązanie' : 'Customer Journey Narrative'}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-medium text-gray-600">Punkty emocjonalne:</h4>
                    <p className="text-sm whitespace-pre-line">{narrativeBlueprint.punktyemocjonalne}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-600">Styl maila:</h4>
                    <p className="text-sm whitespace-pre-line">{narrativeBlueprint.specyfikamaila}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-600">Oś narracyjna:</h4>
                    <p className="text-sm">{narrativeBlueprint.osnarracyjna}</p>
                  </div>
                </div>
              </div>
            )}
            
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
              onSaveToProject={saveToProject}
              isSaving={isSaving}
              projectSaved={projectSaved}
              onViewProject={handleViewProject}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GeneratedEmailDialog;
