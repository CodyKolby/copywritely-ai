
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ScriptDisplayProps {
  script: string;
}

const ScriptDisplay = ({ script }: ScriptDisplayProps) => {
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(script);
    toast.success('Skrypt skopiowany do schowka');
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([script], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `skrypt-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Skrypt pobrany');
  };

  return (
    <div className="py-4">
      <ScrollArea className="h-[400px] rounded-md border p-4 bg-slate-50">
        <pre className="whitespace-pre-wrap font-mono text-sm">
          {script}
        </pre>
      </ScrollArea>
      
      <DialogFooter className="mt-6 flex justify-between sm:justify-end gap-4">
        <Button 
          variant="outline" 
          className="flex items-center gap-2" 
          onClick={handleCopyToClipboard}
        >
          <Copy className="h-4 w-4" />
          Kopiuj do schowka
        </Button>
        <Button 
          className="bg-copywrite-teal hover:bg-copywrite-teal-dark flex items-center gap-2"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
          Pobierz skrypt
        </Button>
      </DialogFooter>
    </div>
  );
};

export default ScriptDisplay;
