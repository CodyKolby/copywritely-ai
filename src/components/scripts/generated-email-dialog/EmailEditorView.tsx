
import React from 'react';
import EmailToolbar from './EmailToolbar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface EmailEditorViewProps {
  subject: string;
  emailContent: string;
  onSubjectChange: (subject: string) => void;
  onEmailContentChange: (content: string) => void;
}

const EmailEditorView = ({
  subject,
  emailContent,
  onSubjectChange,
  onEmailContentChange
}: EmailEditorViewProps) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
      {/* Email Title/Subject */}
      <div className="border-b border-gray-100">
        <Input 
          value={subject} 
          onChange={(e) => onSubjectChange(e.target.value)}
          className="text-xl font-medium border-none p-4 focus-visible:ring-0 focus-visible:outline-none"
          placeholder="Wpisz tytuł emaila..."
        />
      </div>
      
      {/* Toolbar (commented out for now as it's just a placeholder) */}
      {/* <EmailToolbar /> */}
      
      {/* Content Area */}
      <div className="max-h-[400px] overflow-y-auto">
        <Textarea 
          value={emailContent} 
          onChange={(e) => onEmailContentChange(e.target.value)}
          className="min-h-[300px] border-none p-4 focus-visible:ring-0 resize-none rounded-none w-full"
          placeholder="Wpisz treść emaila..."
        />
      </div>
    </div>
  );
};

export default EmailEditorView;
