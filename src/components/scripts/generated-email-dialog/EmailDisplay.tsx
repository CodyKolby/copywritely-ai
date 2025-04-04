
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Copy, Download, CheckCircle2, Save, Edit2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import EmailToolbar from './EmailToolbar';

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
  const [activeTab, setActiveTab] = useState('preview');

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
      <Tabs defaultValue="preview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview">Podgląd</TabsTrigger>
          <TabsTrigger value="edit">Edytuj</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="pt-4">
          <div className="space-y-4">
            <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
              {/* Email Header */}
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-xl font-medium text-gray-800">{subject}</h2>
              </div>
              
              {/* Email Content */}
              <div className="p-4 whitespace-pre-wrap">
                {emailContent}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="edit" className="pt-4">
          <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
            {/* Subject Line */}
            <div className="border-b border-gray-100">
              <Input 
                value={subject} 
                onChange={(e) => onSubjectChange(e.target.value)}
                className="text-xl font-medium text-gray-800 border-none p-4 focus-visible:ring-0 focus-visible:outline-none"
                placeholder="Wpisz temat emaila..."
              />
            </div>
            
            {/* Toolbar */}
            <EmailToolbar />
            
            {/* Content Area */}
            <Textarea 
              value={emailContent} 
              onChange={(e) => onEmailContentChange(e.target.value)}
              className="min-h-[300px] border-none p-4 focus-visible:ring-0 resize-none rounded-none"
              placeholder="Wpisz treść emaila..."
            />
          </div>
        </TabsContent>
      </Tabs>

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
