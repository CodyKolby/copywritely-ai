
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmailEditorView from './EmailEditorView';
import EmailToolbar from './EmailToolbar';

interface EmailDisplayProps {
  subject: string;
  emailContent: string;
  onSubjectChange: (subject: string) => void;
  onEmailContentChange: (content: string) => void;
  onSaveToProject: () => void;
  isSaving: boolean;
  projectSaved: boolean;
  onViewProject?: () => void;
}

const EmailDisplay = ({
  subject,
  emailContent,
  onSubjectChange,
  onEmailContentChange,
  onSaveToProject,
  isSaving,
  projectSaved,
  onViewProject
}: EmailDisplayProps) => {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="editor">
        <div className="flex justify-between items-center mb-4">
        <div />
          
          <EmailToolbar 
            onSaveToProject={onSaveToProject}
            isSaving={isSaving}
            projectSaved={projectSaved}
            onViewProject={onViewProject}
          />
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
