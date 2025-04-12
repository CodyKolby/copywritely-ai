
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
            className="bg-copywrite-teal hover:bg-copywrite-teal/90 text-white py-2 px-6 rounded-lg text-sm font-medium transition-colors"
          >
            Otwórz w edytorze
          </button>
        </div>
      )}
    </div>
  );
};

export default EmailDisplay;
