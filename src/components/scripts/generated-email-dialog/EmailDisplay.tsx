
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Download, CheckCircle2, Save } from 'lucide-react';
import EmailEditorView from './EmailEditorView';

interface EmailDisplayProps {
  subject: string;
  emailContent: string;
  onSubjectChange: (subject: string) => void;
  onEmailContentChange: (content: string) => void;
  onSaveToProject: () => void;
  isSaving: boolean;
  projectSaved: boolean;
}

const EmailDisplay = ({
  subject,
  emailContent,
  onSubjectChange,
  onEmailContentChange,
  onSaveToProject,
  isSaving,
  projectSaved
}: EmailDisplayProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const textToCopy = `Temat: ${subject}\n\n${emailContent}`;

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const fullEmail = `Temat: ${subject}\n\n${emailContent}`;
    const element = document.createElement('a');
    const file = new Blob([fullEmail], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'wygenerowany-email.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      <EmailEditorView
        subject={subject}
        emailContent={emailContent}
        onSubjectChange={onSubjectChange}
        onEmailContentChange={onEmailContentChange}
      />

      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={handleCopy} className="flex items-center gap-2">
          {copied ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Skopiowano
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Kopiuj
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Pobierz
        </Button>
        <Button 
          variant="default" 
          onClick={onSaveToProject} 
          disabled={isSaving || projectSaved}
          className="flex items-center gap-2 bg-copywrite-teal hover:bg-copywrite-teal-dark text-white"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Zapisywanie...' : projectSaved ? 'Zapisano' : 'Zapisz w projektach'}
        </Button>
      </div>
    </div>
  );
};

export default EmailDisplay;
