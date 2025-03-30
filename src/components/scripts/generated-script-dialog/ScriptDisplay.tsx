
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Download, Star } from 'lucide-react';
import { toast } from 'sonner';

interface ScriptDisplayProps {
  script: string;
  bestHook?: string;
}

const ScriptDisplay = ({ script, bestHook }: ScriptDisplayProps) => {
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

  // Format the display to highlight the best hook if provided
  const formattedScript = React.useMemo(() => {
    if (!bestHook) {
      return script;
    }

    // Append the best hook at the end if it's not already there
    let result = script;
    
    // Only append if the bestHook isn't already present in the formatted output
    if (!result.includes('Najlepszy hook:') && !result.includes('Najlepszy hook (do dalszego wykorzystania):')) {
      result += `\n\nNajlepszy hook: ${bestHook}`;
    }
    
    return result;
  }, [script, bestHook]);

  return (
    <div className="py-4">
      <ScrollArea className="h-[400px] rounded-md border p-4 bg-slate-50">
        <pre className="whitespace-pre-wrap font-mono text-sm">
          {formattedScript}
        </pre>
      </ScrollArea>
      
      {bestHook && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
          <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm text-yellow-800">Najlepszy hook:</p>
            <p className="text-yellow-900">{bestHook}</p>
          </div>
        </div>
      )}
      
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
