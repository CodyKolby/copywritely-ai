
import React from 'react';
import EmailEditorView from './EmailEditorView';

interface EmailDisplayProps {
  subject: string;
  emailContent: string;
  onSubjectChange: (subject: string) => void;
  onEmailContentChange: (content: string) => void;
  onViewProject: (() => void) | undefined;
}

const EmailDisplay = ({
  subject,
  emailContent,
  onSubjectChange,
  onEmailContentChange,
  onViewProject
}: EmailDisplayProps) => {
  return (
    <div className="space-y-6">
      <EmailEditorView
        subject={subject}
        emailContent={emailContent}
        onSubjectChange={onSubjectChange}
        onEmailContentChange={onEmailContentChange}
      />
      
      {/* The "Otwórz w edytorze" button has been removed */}
    </div>
  );
};

export default EmailDisplay;
