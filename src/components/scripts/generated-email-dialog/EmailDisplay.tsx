
import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import EmailEditorView from './EmailEditorView';

interface EmailDisplayProps {
  subject: string;
  emailContent: string;
  onSubjectChange: (subject: string) => void;
  onEmailContentChange: (content: string) => void;
  onViewProject: (() => void) | null;
}

const EmailDisplay = ({ 
  subject, 
  emailContent, 
  onSubjectChange, 
  onEmailContentChange,
  onViewProject 
}: EmailDisplayProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Wygenerowany email</h3>
        
        {onViewProject && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewProject}
            className="flex items-center gap-2"
          >
            <ExternalLink size={16} />
            <span>Zobacz projekt</span>
          </Button>
        )}
      </div>
      
      <EmailEditorView
        subject={subject}
        emailContent={emailContent}
        onSubjectChange={onSubjectChange}
        onEmailContentChange={onEmailContentChange}
      />
    </div>
  );
};

export default EmailDisplay;
