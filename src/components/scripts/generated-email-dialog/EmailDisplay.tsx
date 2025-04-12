
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
      
      {onViewProject && (
        <div className="mt-6 text-center">
          <button
            onClick={onViewProject}
            className="text-sm text-copywrite-teal hover:underline"
          >
            Otwórz w projektach
          </button>
        </div>
      )}
    </div>
  );
};

export default EmailDisplay;
