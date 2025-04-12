
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmailEditorView from './EmailEditorView';

interface EmailDisplayProps {
  subject: string;
  emailContent: string;
  onSubjectChange: (subject: string) => void;
  onEmailContentChange: (content: string) => void;
  onViewProject?: () => void;
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
      <Tabs defaultValue="editor">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="editor">Edytor</TabsTrigger>
            <TabsTrigger value="preview">Podgląd</TabsTrigger>
          </TabsList>
          
          {onViewProject && (
            <div className="flex items-center gap-2">
              <button 
                onClick={onViewProject}
                className="text-sm text-copywrite-teal hover:underline flex items-center gap-1"
              >
                Otwórz projekt
              </button>
            </div>
          )}
        </div>

        <TabsContent value="editor" className="mt-0">
          <EmailEditorView
            subject={subject}
            emailContent={emailContent}
            onSubjectChange={onSubjectChange}
            onEmailContentChange={onEmailContentChange}
          />
        </TabsContent>
        
        <TabsContent value="preview" className="mt-0">
          <div className="p-8 bg-white border rounded-lg">
            <h3 className="text-xl font-bold mb-4">{subject}</h3>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: emailContent.replace(/\n/g, '<br/>') }} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailDisplay;
